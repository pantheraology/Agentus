import React from 'react';
import { Edge, Node } from '../types';

interface EdgeLayerProps {
  edges: Edge[];
  nodes: Node[];
  execStates: Record<string, string>;
}

const EdgeLayer: React.FC<EdgeLayerProps> = React.memo(({ edges, nodes, execStates }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
      <defs>
        <filter id="glow-path" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      {edges.map(edge => {
        const source = nodes.find(n => n.id === edge.sourceId);
        const target = nodes.find(n => n.id === edge.targetId);
        if (!source || !target) return null;

        let sx = source.x + 280; // Node width
        let sy = source.y + 40; // Default handle Y
        if (source.type === 'conditional') {
          sy = source.y + (edge.sourceHandle === 'true' ? 35 : 85);
        }
        const tx = target.x;
        const ty = target.y + 40; // Target handle Y

        const dx = Math.abs(sx - tx) * 0.5;
        // Smoother Bezier
        const path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

        const isRunning = execStates[edge.sourceId] === 'running';
        const isCompleted = execStates[edge.sourceId] === 'completed';
        const color = isCompleted ? 'var(--accent-success)' : isRunning ? 'var(--accent-primary)' : 'var(--border-subtle)';

        return (
          <g key={edge.id}>
             {/* Shadow Path for visibility */}
             <path d={path} stroke="var(--bg-deep)" strokeWidth="6" fill="none" />
             {/* Main Path */}
             <path 
              d={path} 
              stroke={color}
              strokeWidth={isCompleted || isRunning ? "2" : "1.5"}
              fill="none"
              strokeDasharray={isCompleted ? "0" : isRunning ? "8 4" : "0"}
              className={isRunning ? "edge-flow" : ""}
              filter={isRunning || isCompleted ? "url(#glow-path)" : ""}
              style={{ transition: 'stroke 0.5s ease' }}
            />
          </g>
        );
      })}
    </svg>
  );
});

export default EdgeLayer;