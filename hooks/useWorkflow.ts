import { useState, useCallback } from 'react';
import { Node, Edge, NodeType } from '../types';
import { NODE_TYPES_CONFIG, INITIAL_NODES, INITIAL_EDGES } from '../config';
import { GoogleGenAI, Type } from '@google/genai';

export const useWorkflowGraph = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);

  const addNode = useCallback((type: NodeType, x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNode: Node = { id, type, x, y, data: { label: NODE_TYPES_CONFIG[type].label } };
    setNodes(prev => [...prev, newNode]);
    return newNode;
  }, []);

  const updateNodeData = useCallback((id: string, data: any) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.sourceId !== id && e.targetId !== id));
  }, []);

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  const addEdge = useCallback((sourceId: string, targetId: string, sourceHandle?: string) => {
    setEdges(prev => {
      if (prev.some(e => e.sourceId === sourceId && e.targetId === targetId && e.sourceHandle === sourceHandle)) return prev;
      return [...prev, {
        id: `e-${sourceId}-${targetId}-${Math.random().toString(36).substr(2, 5)}`,
        sourceId, targetId, sourceHandle
      }];
    });
  }, []);

  return { nodes, edges, setNodes, addNode, updateNodeData, removeNode, updateNodePosition, addEdge };
};

export const useWorkflowRunner = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [execStates, setExecStates] = useState<Record<string, 'idle' | 'running' | 'completed' | 'error'>>({});

  const clearLogs = () => setLogs([]);

  const log = (msg: string, type: 'info' | 'exec' | 'error' = 'info') => {
    const prefix = type === 'error' ? '[ERROR]' : type === 'exec' ? '[EXEC]' : '[SYSTEM]';
    setLogs(prev => [...prev, `${prefix} ${msg}`]);
  };

  const run = async (nodes: Node[], edges: Edge[]) => {
    setIsExecuting(true);
    setLogs([]);
    setExecStates({});
    log("Initializing Neural Engine...", 'info');

    // Initialize Gemini Client
    let ai: GoogleGenAI;
    try {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        log("Gemini Client Connected.", 'info');
    } catch (e) {
        log("Failed to initialize Gemini Client. Check API Key.", 'error');
        setIsExecuting(false);
        return;
    }

    // Topological Sort / Execution Queue
    const adjacency: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    nodes.forEach(n => {
        adjacency[n.id] = [];
        inDegree[n.id] = 0;
    });

    edges.forEach(e => {
        if (adjacency[e.sourceId]) {
            adjacency[e.sourceId].push(e.targetId);
            inDegree[e.targetId] = (inDegree[e.targetId] || 0) + 1;
        }
    });

    const queue: string[] = nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    const results: Record<string, { text?: string, images?: string[], audio?: string, json?: any }> = {};

    log(`Execution Plan: ${queue.length} entry points identified.`, 'info');

    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const node = nodeMap.get(nodeId);
        
        if (!node) continue;

        setExecStates(prev => ({ ...prev, [nodeId]: 'running' }));
        log(`Processing Node: ${node.data.label}`, 'exec');

        try {
            // Gather Inputs from Parents
            const parentEdges = edges.filter(e => e.targetId === nodeId);
            const inputs = parentEdges.map(e => results[e.sourceId]).filter(Boolean);
            
            const inputContext = {
                text: inputs.map(i => i.text).filter(Boolean).join('\n\n'),
                images: inputs.flatMap(i => i.images || []),
                audio: inputs.find(i => i.audio)?.audio // Take first audio if exists
            };

            // --- EXECUTION LOGIC PER NODE TYPE ---
            let output: any = {};

            if (node.type === 'start') {
                 // Pass through any static data defined in start node
                 output = { 
                    text: node.data.startText,
                    images: node.data.startImage ? [node.data.startImage] : []
                 };
            }
            else if (node.type === 'textModel') {
                const modelName = node.data.model || 'gemini-3-flash-preview';
                const isThinking = node.data.useThinking;
                const useSearch = node.data.useSearch;
                const useMaps = node.data.useMaps;

                // Model Overrides based on Features
                let activeModel = modelName;
                if (isThinking) activeModel = 'gemini-3-pro-preview';
                if (useMaps) activeModel = 'gemini-2.5-flash';
                if (useSearch && activeModel.includes('2.5')) activeModel = 'gemini-3-flash-preview'; // Upgrade for search if needed

                log(`Invoking ${activeModel}...`, 'info');

                const parts: any[] = [];
                // Add System/Prompt Text
                if (node.data.systemInstruction) {
                    // Implicitly handled by config or just prepend
                }
                
                // Add Inputs
                if (inputContext.text) parts.push({ text: inputContext.text });
                
                // Add Node's own prompt if exists
                if (node.data.prompt) parts.push({ text: `User Prompt: ${node.data.prompt}` });

                // Add Images
                inputContext.images.forEach(img => {
                    parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
                });

                if (parts.length === 0) parts.push({ text: "Hello!" });

                const config: any = {};
                
                // Thinking Config
                if (isThinking) {
                    config.thinkingConfig = { thinkingBudget: 32768 };
                    // config.maxOutputTokens is deliberately undefined
                }

                // Tools
                const tools: any[] = [];
                if (useSearch) tools.push({ googleSearch: {} });
                if (useMaps) {
                    tools.push({ googleMaps: {} });
                    // Try to get location
                    try {
                        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                             navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                        });
                        config.toolConfig = {
                            retrievalConfig: {
                                latLng: {
                                    latitude: pos.coords.latitude,
                                    longitude: pos.coords.longitude
                                }
                            }
                        };
                    } catch (e) {
                        log("Location access failed for Maps, using default.", 'info');
                    }
                }
                if (tools.length > 0) config.tools = tools;
                
                if (node.data.systemInstruction) {
                    config.systemInstruction = node.data.systemInstruction;
                }

                const response = await ai.models.generateContent({
                    model: activeModel,
                    contents: { parts },
                    config
                });

                output.text = response.text;
                
                // Log Grounding
                if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                    const chunks = response.candidates[0].groundingMetadata.groundingChunks;
                    const urls = chunks.map((c: any) => c.web?.uri || c.maps?.uri).filter(Boolean);
                    if (urls.length > 0) {
                        log(`Sources found: ${urls.slice(0,3).join(', ')}...`, 'info');
                    }
                }
            }
            else if (node.type === 'imageGeneration') {
                log("Generating Image...", 'info');
                const prompt = node.data.prompt || inputContext.text || "A cool futuristic abstract shape";
                
                // Using gemini-2.5-flash-image for generation via generateContent as per instructions
                // "Call generateContent to generate images with nano banana series models"
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: prompt }] },
                    config: {
                        imageConfig: {
                            aspectRatio: "1:1",
                            imageSize: "1K" // actually only for 3-pro, but harmless to try or omit
                        }
                    }
                });

                let generatedImage = null;
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        generatedImage = part.inlineData.data;
                        break;
                    }
                }

                if (generatedImage) {
                    output.images = [generatedImage];
                    output.text = "Image generated successfully.";
                } else {
                    throw new Error("No image returned.");
                }
            }
            else if (node.type === 'audio') {
                // Transcription Node
                log("Transcribing Audio...", 'info');
                
                // Source: Either input from previous node (if we had audio flow) or Node's internal recording
                const audioData = node.data.audioData; // Base64 string from recording
                
                if (!audioData) {
                    throw new Error("No audio data found. Please record audio in node properties.");
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: {
                        parts: [{
                            inlineData: {
                                mimeType: 'audio/wav', // Assuming recorder saves as wav/webm
                                data: audioData
                            }
                        }, {
                            text: "Transcribe this audio."
                        }]
                    }
                });
                
                output.text = response.text;
                log(`Transcription: ${response.text.substring(0, 50)}...`, 'info');
            }
            else if (node.type === 'prompt') {
                 // Just a pass-through of text
                 output.text = node.data.content;
            }
            else if (node.type === 'javascript') {
                // Safe-ish eval
                try {
                    // eslint-disable-next-line no-new-func
                    const fn = new Function('input', node.data.code || 'return input;');
                    const result = fn(inputContext.text);
                    output.text = String(result);
                } catch (e: any) {
                    output.text = `Error: ${e.message}`;
                }
            }
            else if (node.type === 'conditional') {
                // Logic evaluation
                let conditionMet = false;
                try {
                   // eslint-disable-next-line no-new-func
                   const check = new Function('text', `return ${node.data.condition || 'true'}`);
                   conditionMet = check(inputContext.text);
                } catch(e) {
                   conditionMet = false;
                }
                
                output.conditionResult = conditionMet;
                log(`Condition: ${conditionMet}`, 'info');
            }

            results[nodeId] = output;
            setExecStates(prev => ({ ...prev, [nodeId]: 'completed' }));
            
            // Queue Children
            const outgoing = edges.filter(e => e.sourceId === nodeId);
            outgoing.forEach(edge => {
                 // Check conditional flow
                 if (node.type === 'conditional') {
                     if ((output.conditionResult && edge.sourceHandle === 'true') || 
                         (!output.conditionResult && edge.sourceHandle === 'false')) {
                          inDegree[edge.targetId]--;
                     }
                 } else {
                     inDegree[edge.targetId]--;
                 }
                 
                 if (inDegree[edge.targetId] <= 0) {
                     queue.push(edge.targetId);
                 }
            });

        } catch (error: any) {
            log(`Error in node ${node.data.label}: ${error.message}`, 'error');
            setExecStates(prev => ({ ...prev, [nodeId]: 'error' }));
        }
    }

    log("Workflow Execution Finished.", 'info');
    setIsExecuting(false);
  };

  return { isExecuting, logs, execStates, run, clearLogs };
};