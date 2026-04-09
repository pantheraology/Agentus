import React, { useState, useRef } from 'react';
import { X, Trash2, AlertTriangle, Mic, Image as ImageIcon, Search, MapPin, BrainCircuit, Zap } from 'lucide-react';
import { Node } from '../types';
import { NODE_TYPES_CONFIG } from '../config';
import { Button, Input, Textarea, Badge } from './ui/Atoms';

interface PropertiesPanelProps {
  selectedNode: Node | undefined;
  updateNodeData: (id: string, data: any) => void;
  removeNode: (id: string) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, updateNodeData, removeNode, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  if (!selectedNode) return null;
  const config = NODE_TYPES_CONFIG[selectedNode.type];

  // Helper for file reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        updateNodeData(selectedNode.id, { [key]: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Audio Recording Logic
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
             const base64 = (reader.result as string).split(',')[1];
             updateNodeData(selectedNode.id, { audioData: base64 });
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied", err);
        alert("Please allow microphone access to record audio.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-enter">
      <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-glass)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[var(--bg-deep)] border border-[var(--border-subtle)]" style={{ color: config.color }}>
            {React.createElement(config.icon, { size: 16 })}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--fg-primary)]">Properties</h3>
            <div className="text-[10px] text-[var(--fg-secondary)]">{selectedNode.type} • {selectedNode.id.substr(0,4)}</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} icon={X} />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Node Label</label>
          <Input 
            value={selectedNode.data.label} 
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} 
            placeholder="Name your step..."
          />
        </div>

        {/* --- START NODE --- */}
        {selectedNode.type === 'start' && (
          <div className="space-y-4 pt-2">
             <div className="text-xs font-semibold text-[var(--accent-primary)] border-b border-[var(--border-subtle)] pb-1">Test Inputs</div>
             
             <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Initial Text</label>
                <Textarea 
                   value={selectedNode.data.startText || ''}
                   onChange={(e) => updateNodeData(selectedNode.id, { startText: e.target.value })}
                   placeholder="Enter a test prompt to start the flow..."
                />
             </div>

             <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Attach Image</label>
                <div className="flex items-center gap-2">
                   <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'startImage')} />
                </div>
                {selectedNode.data.startImage && (
                   <div className="text-[10px] text-[var(--accent-success)] flex items-center gap-1">
                      <ImageIcon size={10} /> Image attached
                   </div>
                )}
             </div>
          </div>
        )}

        {/* --- TEXT MODEL NODE --- */}
        {selectedNode.type === 'textModel' && (
          <>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">AI Model</label>
              <select 
                className="w-full h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-deep)] px-3 text-sm text-[var(--fg-primary)] focus:border-[var(--accent-primary)] outline-none"
                value={selectedNode.data.model || 'gemini-3-flash-preview'}
                onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash (Standard)</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro (High Intellect)</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Fast)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Maps Compatible)</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Capabilities</label>
               
               <div className="flex items-center justify-between p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-deep)]">
                  <div className="flex items-center gap-2 text-xs">
                     <BrainCircuit size={14} className="text-purple-400" /> Thinking Mode
                  </div>
                  <input type="checkbox" 
                     checked={selectedNode.data.useThinking || false}
                     onChange={(e) => updateNodeData(selectedNode.id, { useThinking: e.target.checked })}
                  />
               </div>
               
               <div className="flex items-center justify-between p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-deep)]">
                  <div className="flex items-center gap-2 text-xs">
                     <Search size={14} className="text-blue-400" /> Google Search
                  </div>
                  <input type="checkbox" 
                     checked={selectedNode.data.useSearch || false}
                     onChange={(e) => updateNodeData(selectedNode.id, { useSearch: e.target.checked })}
                  />
               </div>

               <div className="flex items-center justify-between p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-deep)]">
                  <div className="flex items-center gap-2 text-xs">
                     <MapPin size={14} className="text-red-400" /> Google Maps
                  </div>
                  <input type="checkbox" 
                     checked={selectedNode.data.useMaps || false}
                     onChange={(e) => updateNodeData(selectedNode.id, { useMaps: e.target.checked })}
                  />
               </div>
            </div>

            <div className="space-y-2 mt-4">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">System Instructions</label>
               <Textarea 
                 placeholder="You are a helpful expert..."
                 rows={3}
                 value={selectedNode.data.systemInstruction || ''}
                 onChange={(e) => updateNodeData(selectedNode.id, { systemInstruction: e.target.value })}
               />
            </div>

            <div className="space-y-2">
               <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Additional Prompt</label>
               <Textarea 
                 placeholder="Refine the input..."
                 value={selectedNode.data.prompt || ''}
                 onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
               />
            </div>
          </>
        )}

        {/* --- IMAGE GEN NODE --- */}
        {selectedNode.type === 'imageGeneration' && (
           <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Prompt</label>
              <Textarea 
                 placeholder="Describe the image to generate..."
                 value={selectedNode.data.prompt || ''}
                 onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
              />
              <div className="text-[10px] text-[var(--fg-muted)] italic">Uses Gemini 2.5 Flash Image</div>
           </div>
        )}

        {/* --- AUDIO NODE --- */}
        {selectedNode.type === 'audio' && (
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Audio Source</label>
                 <div className="p-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-deep)] flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-[var(--bg-panel)]'}`}>
                       <Mic size={24} className={isRecording ? 'text-red-500' : 'text-[var(--fg-muted)]'} />
                    </div>
                    <Button 
                       variant={isRecording ? "destructive" : "secondary"} 
                       size="sm"
                       onClick={toggleRecording}
                    >
                       {isRecording ? "Stop Recording" : "Record Microphone"}
                    </Button>
                 </div>
                 {selectedNode.data.audioData && (
                    <div className="text-[10px] text-[var(--accent-success)] flex items-center gap-1 justify-center">
                       <Zap size={10} /> Audio captured successfully
                    </div>
                 )}
              </div>
           </div>
        )}

        {selectedNode.type === 'conditional' && (
           <div className="p-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-deep)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--accent-warning)] text-xs font-bold">
                <AlertTriangle size={12}/> Logic Gate
              </div>
              <p className="text-[10px] text-[var(--fg-muted)]">Executes JavaScript condition on input text.</p>
              <Input 
                className="font-mono text-xs"
                placeholder="text.includes('urgent')"
                value={selectedNode.data.condition}
                onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
              />
           </div>
        )}

        <div className="pt-6 border-t border-[var(--border-subtle)]">
           <Button variant="destructive" className="w-full" size="sm" onClick={() => { removeNode(selectedNode.id); onClose(); }} icon={Trash2}>
              Remove Node
           </Button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;