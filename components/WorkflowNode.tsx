import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, BrainCircuit, Search, MapPin, Mic, Image as ImageIcon } from 'lucide-react';
import { Node } from '../types';
import { NODE_TYPES_CONFIG } from '../config';
import { Badge } from './ui/Atoms';

interface WorkflowNodeProps {
  node: Node;
  state: string;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, node: Node) => void;
  onConnectStart: (e: React.MouseEvent, sourceId: string, handleId?: string) => void;
  onConnectEnd: () => void;
}

const WorkflowNode: React.FC<WorkflowNodeProps> = React.memo(({ node, state, isSelected, onMouseDown, onConnectStart, onConnectEnd }) => {
  const config = NODE_TYPES_CONFIG[node.type];

  return (
    <div 
      onMouseDown={(e) => onMouseDown(e, node)}
      onMouseUp={onConnectEnd}
      style={{ left: node.x, top: node.y }}
      className={`
        absolute w-[280px] rounded-xl transition-all duration-300 animate-enter
        flex flex-col bg-[var(--bg-card)]
        ${isSelected 
          ? 'border-2 border-[var(--accent-primary)] shadow-[0_10px_40px_-10px_var(--accent-glow)] z-40 translate-y-[-2px]' 
          : 'border border-[var(--border-subtle)] hover:border-[var(--fg-secondary)] shadow-lg z-10'
        }
        ${state === 'running' ? 'node-running z-50' : ''}
        ${state === 'completed' ? 'border-[var(--accent-success)] shadow-[0_0_20px_var(--accent-success)]' : ''}
        ${state === 'error' ? 'border-[var(--accent-error)] shadow-[0_0_20px_var(--accent-error)]' : ''}
      `}
    >
      {/* Decorative Gradient Top */}
      <div className="h-1 w-full rounded-t-lg opacity-80" style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }} />

      {/* Header */}
      <div className="p-3 flex items-start gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] rounded-t-lg">
          <div className="p-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-subtle)] shrink-0" style={{ color: config.color }}>
            {React.createElement(config.icon, { size: 18 })}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center h-9">
            <div className="text-sm font-semibold text-[var(--fg-primary)] truncate leading-tight">{node.data.label}</div>
            <div className="text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wide">{config.category} • {config.label}</div>
          </div>
          <div className="shrink-0 flex items-center h-9">
             {state === 'running' && <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" />}
             {state === 'completed' && <CheckCircle2 size={16} className="text-[var(--accent-success)]" />}
             {state === 'error' && <AlertTriangle size={16} className="text-[var(--accent-error)]" />}
          </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2 relative group">
          {node.type === 'httpRequest' && (
            <div className="flex items-center gap-2 text-xs font-mono bg-[var(--bg-deep)] p-2 rounded border border-[var(--border-subtle)]">
              <span className="font-bold text-[var(--accent-primary)]">{node.data.method}</span> 
              <span className="truncate opacity-70">{node.data.url}</span>
            </div>
          )}
          {node.type === 'textModel' && (
             <div className="space-y-2">
                 <div className="text-xs text-[var(--fg-secondary)] flex justify-between items-center">
                    <span className="opacity-50">Model</span>
                    <Badge>{(node.data.model || 'Flash').split('-')[2]}</Badge>
                 </div>
                 <div className="flex gap-1">
                    {node.data.useThinking && <div className="p-1 rounded bg-purple-500/20 text-purple-400" title="Thinking Mode"><BrainCircuit size={12}/></div>}
                    {node.data.useSearch && <div className="p-1 rounded bg-blue-500/20 text-blue-400" title="Google Search"><Search size={12}/></div>}
                    {node.data.useMaps && <div className="p-1 rounded bg-red-500/20 text-red-400" title="Google Maps"><MapPin size={12}/></div>}
                 </div>
             </div>
          )}
          {node.type === 'audio' && (
             <div className="text-xs text-[var(--fg-secondary)] flex items-center gap-2">
                 <Mic size={12} className="text-[var(--accent-primary)]" />
                 {node.data.audioData ? "Audio Recorded" : "No Audio"}
             </div>
          )}
           {node.type === 'imageGeneration' && (
             <div className="text-xs text-[var(--fg-secondary)] flex items-center gap-2">
                 <ImageIcon size={12} className="text-[var(--accent-primary)]" />
                 Gen: Gemini 2.5 Flash
             </div>
          )}
          {node.type === 'prompt' && (
             <div className="text-xs italic text-[var(--fg-muted)] bg-[var(--bg-deep)] p-2 rounded border border-[var(--border-subtle)] line-clamp-2">
               "{node.data.content || 'System prompt...'}"
             </div>
          )}
          {node.type === 'conditional' && (
             <div className="text-xs font-mono text-[var(--accent-primary)] text-center py-1">
               IF {node.data.condition || 'condition'}
             </div>
          )}
          
          {/* Subtle ID watermark */}
          <div className="absolute bottom-1 right-2 text-[8px] font-mono text-[var(--border-active)] opacity-0 group-hover:opacity-100 transition-opacity">
            ID: {node.id}
          </div>
      </div>

      {/* Handles - Interactive Zones */}
      {/* Input */}
      {node.type !== 'start' && (
        <div className="absolute -left-[6px] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair group-handle" onMouseUp={onConnectEnd}>
          <div className="handle" />
          <div className="absolute left-[-20px] bg-[var(--bg-card)] text-[9px] px-1 py-0.5 rounded border border-[var(--border-subtle)] opacity-0 group-handle-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Input</div>
        </div>
      )}

      {/* Output */}
      {node.type !== 'end' && node.type !== 'conditional' && (
        <div className="absolute -right-[6px] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center cursor-crosshair group-handle" onMouseDown={(e) => onConnectStart(e, node.id)}>
          <div className="handle" />
        </div>
      )}

      {/* Conditional Outputs */}
      {node.type === 'conditional' && (
        <>
          <div className="absolute -right-[6px] top-[35px] w-6 h-6 flex items-center justify-center cursor-crosshair group-handle" onMouseDown={(e) => onConnectStart(e, node.id, 'true')}>
             <div className="handle !border-[var(--accent-success)] hover:!bg-[var(--accent-success)]" />
             <div className="absolute right-[-30px] text-[9px] font-bold text-[var(--accent-success)] pointer-events-none">TRUE</div>
          </div>
          <div className="absolute -right-[6px] top-[85px] w-6 h-6 flex items-center justify-center cursor-crosshair group-handle" onMouseDown={(e) => onConnectStart(e, node.id, 'false')}>
             <div className="handle !border-[var(--accent-error)] hover:!bg-[var(--accent-error)]" />
             <div className="absolute right-[-35px] text-[9px] font-bold text-[var(--accent-error)] pointer-events-none">FALSE</div>
          </div>
        </>
      )}
    </div>
  );
});

export default WorkflowNode;