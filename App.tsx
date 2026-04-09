import React, { useState, useCallback } from 'react';
import { 
  Sparkles, SquareTerminal, Code, Play, Loader2, X, Menu, 
  ZoomIn, ZoomOut, RotateCcw, Copy, Check 
} from 'lucide-react';
import GlobalStyles from './components/GlobalStyles';
import { Button } from './components/ui/Atoms';
import { useWorkflowGraph, useWorkflowRunner } from './hooks/useWorkflow';
import EdgeLayer from './components/EdgeLayer';
import WorkflowNode from './components/WorkflowNode';
import PropertiesPanel from './components/PropertiesPanel';
import { NODE_TYPES_CONFIG } from './config';
import { Node, NodeType } from './types';

export default function App() {
  const { nodes, edges, addNode, updateNodeData, removeNode, updateNodePosition, addEdge } = useWorkflowGraph();
  const { isExecuting, logs, execStates, run, clearLogs } = useWorkflowRunner();
  
  // --- VIEWPORT & INTERACTION STATE ---
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [showCode, setShowCode] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  
  // Dragging state now stores INITIAL positions to calculate deltas correctly
  const [nodeDrag, setNodeDrag] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const [connecting, setConnecting] = useState<{ sourceId: string; handleId?: string } | null>(null);

  // --- HANDLERS ---

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: Node) => {
    e.stopPropagation(); // Prevent panning when clicking a node
    // Store initial mouse and node positions
    setNodeDrag({ 
      id: node.id, 
      startX: e.clientX, 
      startY: e.clientY, 
      initialX: node.x, 
      initialY: node.y 
    });
    setSelectedId(node.id);
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle click or Left click on background starts panning
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setSelectedId(null);
      setConnecting(null);
    }
  }, []);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (nodeDrag) {
      // Calculate delta considering zoom level
      const dx = (e.clientX - nodeDrag.startX) / viewport.zoom;
      const dy = (e.clientY - nodeDrag.startY) / viewport.zoom;
      updateNodePosition(nodeDrag.id, nodeDrag.initialX + dx, nodeDrag.initialY + dy);
    } else if (isPanning) {
      setViewport(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  }, [nodeDrag, isPanning, viewport.zoom, updateNodePosition]);

  const handleCanvasMouseUp = useCallback(() => {
    setNodeDrag(null);
    setIsPanning(false);
  }, []);

  const handleConnectStart = useCallback((e: React.MouseEvent, sourceId: string, handleId?: string) => {
    e.stopPropagation();
    setConnecting({ sourceId, handleId });
  }, []);

  const handleConnectEnd = useCallback((targetNode: Node) => {
    if (connecting && connecting.sourceId !== targetNode.id) {
      addEdge(connecting.sourceId, targetNode.id, connecting.handleId);
    }
    setConnecting(null);
  }, [connecting, addEdge]);

  // Zoom Helpers
  const zoomIn = () => setViewport(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.1, 2) }));
  const zoomOut = () => setViewport(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.1, 0.5) }));
  const resetView = () => setViewport({ x: 0, y: 0, zoom: 1 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Zoom sensitivity factor
    const scaleAmount = -e.deltaY * 0.001;
    setViewport(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + scaleAmount, 0.5), 2)
    }));
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedId);

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden select-none text-sm" 
      onMouseMove={handleCanvasMouseMove} 
      onMouseUp={handleCanvasMouseUp}
    >
      <GlobalStyles />
      
      {/* Floating Header */}
      <header className="absolute top-4 left-4 right-4 h-16 glass-panel rounded-xl flex items-center justify-between px-6 z-[60] shadow-2xl pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="p-2.5 bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 rounded-lg shadow-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none text-white">Panthera<span className="text-[var(--accent-primary)]">Agentus</span></h1>
            <span className="text-[10px] font-mono text-[var(--fg-muted)] tracking-widest uppercase">Visual Agent Builder v0.1</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <Button variant="secondary" size="sm" onClick={() => setShowLogs(true)} icon={SquareTerminal}>System Logs</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowCode(true)} icon={Code}>Export SDK</Button>
          <div className="h-6 w-px bg-[var(--border-subtle)] mx-1" />
          <Button onClick={() => run(nodes, edges)} disabled={isExecuting} icon={isExecuting ? Loader2 : Play}>
            {isExecuting ? 'Processing...' : 'Run Sequence'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex relative pt-0">
        
        {/* Left Palette - Floating */}
        <div className={`absolute top-24 left-4 bottom-4 w-64 glass-panel rounded-xl flex flex-col transition-all duration-500 z-50 ${showPalette ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'}`}>
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="font-bold text-[var(--fg-primary)] flex items-center gap-2">Component Library</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPalette(false)} icon={X} />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {['Logic', 'AI', 'Data'].map(category => (
              <div key={category} className="mb-4">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)] mb-1">{category}</div>
                {Object.entries(NODE_TYPES_CONFIG)
                  .filter(([_, cfg]) => cfg.category === category)
                  .map(([type, config]) => (
                  <div 
                    key={type}
                    className="p-3 rounded-lg border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-panel)] cursor-grab active:cursor-grabbing transition-all group flex items-center gap-3"
                    onClick={() => {
                        // Add node centered on current view
                        const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom - 140;
                        const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom - 50;
                        addNode(type as NodeType, centerX, centerY);
                    }}
                  >
                    <div className="p-2 rounded-md bg-[var(--bg-deep)] border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] transition-colors" style={{ color: config.color }}>
                      {React.createElement(config.icon, { size: 16 })}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--fg-primary)]">{config.label}</div>
                      <div className="text-[10px] text-[var(--fg-muted)] line-clamp-1">{config.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Toggle Button */}
        {!showPalette && (
          <div className="absolute top-24 left-4 z-50 animate-enter">
            <Button variant="secondary" size="icon" onClick={() => setShowPalette(true)} icon={Menu} className="h-10 w-10 shadow-xl" />
          </div>
        )}

        {/* Canvas Area with Transforms */}
        <div 
          className="flex-1 canvas-grid relative overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        >
          {/* Transform Container */}
          <div 
            style={{ 
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
          >
            <EdgeLayer edges={edges} nodes={nodes} execStates={execStates} />

            {nodes.map(node => (
              <WorkflowNode 
                key={node.id}
                node={node}
                state={execStates[node.id] || 'idle'}
                isSelected={selectedId === node.id}
                onMouseDown={handleNodeMouseDown}
                onConnectStart={handleConnectStart}
                onConnectEnd={() => handleConnectEnd(node)}
              />
            ))}
            
            {/* Active Connection Line */}
            {connecting && <div className="absolute inset-0 pointer-events-none z-[100] border-2 border-[var(--accent-primary)] opacity-30 border-dashed" />}
          </div>
          
          {/* Viewport Controls - Bottom Right */}
          <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
            <div className="glass-panel p-1 rounded-lg flex flex-col gap-1 shadow-xl">
               <Button variant="ghost" size="icon" onClick={zoomIn} icon={ZoomIn} />
               <Button variant="ghost" size="icon" onClick={zoomOut} icon={ZoomOut} />
               <div className="h-px w-full bg-[var(--border-subtle)] my-0.5" />
               <Button variant="ghost" size="icon" onClick={resetView} icon={RotateCcw} />
            </div>
          </div>

          {/* Quick Info Toast */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 rounded-full text-[10px] text-[var(--fg-muted)] pointer-events-none flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[var(--accent-success)] animate-pulse" />
             Zoom: {Math.round(viewport.zoom * 100)}% • {nodes.length} Nodes Active
          </div>
        </div>

        {/* Right Sidebar - Floating */}
        <div className={`absolute top-24 right-4 bottom-4 w-80 glass-panel rounded-xl flex flex-col transition-all duration-300 z-50 shadow-2xl ${selectedId ? 'translate-x-0' : 'translate-x-[120%]'}`}>
           <PropertiesPanel 
             selectedNode={selectedNode} 
             updateNodeData={updateNodeData} 
             removeNode={removeNode} 
             onClose={() => setSelectedId(null)} 
           />
        </div>
      </div>

      {/* Logs Overlay */}
      {showLogs && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-enter">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl h-[60vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-[var(--border-subtle)]">
             <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-deep)]">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-[var(--accent-primary)] rounded text-white"><SquareTerminal size={20}/></div>
                   <div>
                     <h2 className="font-bold text-lg text-[var(--fg-primary)]">System Logs</h2>
                     <p className="text-xs text-[var(--fg-muted)]">Real-time execution trace</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" onClick={clearLogs}>Clear</Button>
                   <Button variant="ghost" size="icon" onClick={() => setShowLogs(false)} icon={X} />
                </div>
             </div>
             <div className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-2 bg-[#0d0d0d] scroll-smooth">
               {logs.map((log, i) => (
                 <div key={i} className={`flex gap-3 p-2 rounded border border-transparent hover:border-[var(--border-subtle)] hover:bg-[var(--bg-panel)] transition-colors ${log.includes('[CRITICAL]') ? 'text-[var(--accent-error)]' : log.includes('[EXEC]') ? 'text-[var(--accent-primary)]' : 'text-[var(--fg-muted)]'}`}>
                   <span className="opacity-50 shrink-0">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                   <span>{log}</span>
                 </div>
               ))}
               {logs.length === 0 && <div className="text-center mt-20 opacity-30 italic">No activity logs recorded.</div>}
             </div>
             <div className="p-5 border-t border-[var(--border-subtle)] flex justify-end bg-[var(--bg-panel)]">
                <Button variant="secondary" onClick={() => setShowLogs(false)}>Close Console</Button>
             </div>
          </div>
        </div>
      )}

      {/* Code Overlay */}
      {showCode && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-enter">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-[var(--border-subtle)]">
             <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-deep)]">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-[var(--accent-primary)] rounded text-white"><Code size={20}/></div>
                   <div>
                     <h2 className="font-bold text-lg text-[var(--fg-primary)]">Production SDK Export</h2>
                     <p className="text-xs text-[var(--fg-muted)]">Generated TypeScript for Vercel AI SDK</p>
                   </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCode(false)} icon={X} />
             </div>
             <div className="flex-1 overflow-auto p-0 bg-[#0d0d0d] relative group">
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" icon={Copy}>Copy Code</Button>
                </div>
                <pre className="p-6 text-xs font-mono leading-relaxed text-[var(--fg-secondary)]">
{`import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createWorkflow } from '@flowforge/sdk';

/**
 * PantheraAgentus Workflow
 * ID: ${Math.random().toString(36).substr(2,9)}
 * Generated: ${new Date().toISOString()}
 */
export async function executeAgentWorkflow(context: Record<string, any>) {
  console.log("Initializing Workflow Engine...");

${nodes.map(n => `  // [Step] ${n.data.label} (${n.type})
  const step_${n.id.replace(/-/g,'')} = await createWorkflow.step({
    id: "${n.id}",
    type: "${n.type}",
    params: ${JSON.stringify(n.data, null, 4).replace(/\n/g, '\n    ')}
  });`).join('\n\n')}

  return { 
    status: 'success', 
    timestamp: Date.now(),
    trace: [${nodes.map(n => `step_${n.id.replace(/-/g,'')}.id`).join(', ')}]
  };
}`}
                </pre>
             </div>
             <div className="p-5 border-t border-[var(--border-subtle)] flex justify-end gap-3 bg-[var(--bg-panel)]">
                <Button variant="ghost" onClick={() => setShowCode(false)}>Close</Button>
                <Button icon={Check}>Download .ts</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}