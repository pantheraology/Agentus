import { 
  Bot, Play, SquareTerminal, Settings2, Image as ImageIcon, Mic, Database, 
  Workflow, Code, Globe, Split, CheckCircle2 
} from 'lucide-react';
import { Node, Edge, NodeType, NodeTypeConfig } from './types';

export const NODE_TYPES_CONFIG: Record<NodeType, NodeTypeConfig> = {
  start: { label: 'Start Trigger', icon: Play, color: 'var(--c-start)', description: 'Entry point', category: 'Logic' },
  end: { label: 'End Response', icon: SquareTerminal, color: 'var(--c-end)', description: 'Final output', category: 'Logic' },
  textModel: { label: 'LLM Node', icon: Bot, color: 'var(--c-llm)', description: 'GPT-4 / Gemini', category: 'AI' },
  prompt: { label: 'Prompt Template', icon: Workflow, color: 'var(--c-llm)', description: 'Text injection', category: 'AI' },
  imageGeneration: { label: 'Image Gen', icon: ImageIcon, color: 'var(--c-io)', description: 'Diffusion', category: 'AI' },
  audio: { label: 'Voice Synth', icon: Mic, color: 'var(--c-io)', description: 'TTS / STT', category: 'AI' },
  embedding: { label: 'Embeddings', icon: Database, color: 'var(--c-io)', description: 'Vector Store', category: 'Data' },
  tool: { label: 'Custom Tool', icon: Settings2, color: 'var(--c-tool)', description: 'Function Call', category: 'Logic' },
  structuredOutput: { label: 'JSON Guard', icon: CheckCircle2, color: 'var(--c-tool)', description: 'Schema Valid', category: 'Logic' },
  conditional: { label: 'Router', icon: Split, color: 'var(--c-cond)', description: 'If / Else', category: 'Logic' },
  httpRequest: { label: 'API Request', icon: Globe, color: 'var(--c-tool)', description: 'REST Client', category: 'Data' },
  javascript: { label: 'Script', icon: Code, color: 'var(--c-tool)', description: 'JS Sandbox', category: 'Logic' },
};

export const INITIAL_NODES: Node[] = [
  { id: '1', type: 'start', x: 100, y: 300, data: { label: 'User Request' } },
  { id: '2', type: 'httpRequest', x: 400, y: 300, data: { label: 'Fetch Profile', url: 'https://api.srv.com/v1/user', method: 'GET' } },
  { id: '3', type: 'conditional', x: 700, y: 300, data: { label: 'Is Premium?', condition: 'user.plan === "pro"' } },
  { id: '4', type: 'textModel', x: 1000, y: 150, data: { label: 'GPT-4 Turbo', model: 'gpt-4-turbo' } },
  { id: '5', type: 'textModel', x: 1000, y: 450, data: { label: 'GPT-3.5 Fast', model: 'gpt-3.5-turbo' } },
  { id: '6', type: 'end', x: 1350, y: 300, data: { label: 'Final Output' } },
];

export const INITIAL_EDGES: Edge[] = [
  { id: 'e1-2', sourceId: '1', targetId: '2' },
  { id: 'e2-3', sourceId: '2', targetId: '3' },
  { id: 'e3-4', sourceId: '3', targetId: '4', sourceHandle: 'true' },
  { id: 'e3-5', sourceId: '3', targetId: '5', sourceHandle: 'false' },
  { id: 'e4-6', sourceId: '4', targetId: '6' },
  { id: 'e5-6', sourceId: '5', targetId: '6' },
];