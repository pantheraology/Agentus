import { LucideIcon } from 'lucide-react';

export type NodeType = 
  | 'start' | 'end' | 'textModel' | 'prompt' | 'imageGeneration' 
  | 'audio' | 'embedding' | 'tool' | 'structuredOutput' 
  | 'conditional' | 'httpRequest' | 'javascript';

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: {
    label: string;
    [key: string]: any;
  };
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle?: string;
}

export interface NodeTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
  category: 'Logic' | 'AI' | 'Data';
}