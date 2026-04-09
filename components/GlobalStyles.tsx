import React from 'react';

const GlobalStyles = () => (
  <style>{`
    :root {
      /* Core Palette - Deep Space Theme */
      --bg-deep: oklch(0.10 0.02 260);
      --bg-panel: oklch(0.14 0.03 260);
      --bg-card: oklch(0.18 0.04 260);
      --bg-glass: oklch(0.14 0.03 260 / 0.7);
      
      --fg-primary: oklch(0.98 0 0);
      --fg-secondary: oklch(0.70 0.05 260);
      --fg-muted: oklch(0.50 0.05 260);
      
      --border-subtle: oklch(0.25 0.05 260);
      --border-active: oklch(0.40 0.10 260);

      /* Brand Accents */
      --accent-primary: oklch(0.65 0.22 265);    /* Electric Violet */
      --accent-glow: oklch(0.65 0.22 265 / 0.4);
      --accent-success: oklch(0.70 0.15 150);
      --accent-warning: oklch(0.80 0.15 80);
      --accent-error: oklch(0.65 0.20 25);

      /* Node Identity Colors */
      --c-llm: oklch(0.65 0.22 265);
      --c-cond: oklch(0.60 0.20 300);
      --c-io: oklch(0.70 0.15 200);
      --c-tool: oklch(0.75 0.18 60);
      --c-start: oklch(0.70 0.15 150);
      --c-end: oklch(0.65 0.20 25);
    }

    * { box-sizing: border-box; }

    body {
      background-color: var(--bg-deep);
      color: var(--fg-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--fg-muted); }

    /* Canvas Grid - Dot Matrix */
    .canvas-grid {
      background-color: var(--bg-deep);
      background-image: radial-gradient(var(--border-subtle) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    /* Glassmorphism Utilities */
    .glass-panel {
      background: var(--bg-glass);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-subtle);
    }

    /* Animations */
    @keyframes flow-dash {
      to { stroke-dashoffset: -20; }
    }
    .edge-flow {
      animation: flow-dash 1s linear infinite;
    }

    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 10px var(--accent-glow), 0 0 20px var(--accent-glow); border-color: var(--accent-primary); }
      50% { box-shadow: 0 0 20px var(--accent-glow), 0 0 40px var(--accent-glow); border-color: white; }
    }
    .node-running {
      animation: glow-pulse 2s infinite;
    }

    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-enter { animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

    /* Handle Styles */
    .handle {
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--bg-deep);
      border: 2px solid var(--fg-muted);
      cursor: crosshair; z-index: 50;
      transition: all 0.2s ease;
      box-shadow: 0 0 0 2px var(--bg-card);
    }
    .handle:hover { 
      background: var(--accent-primary); 
      border-color: white;
      transform: scale(1.2); 
    }
    .handle-connect-active {
      background: var(--accent-primary);
      box-shadow: 0 0 10px var(--accent-primary);
    }

    /* Range Input Customization */
    input[type=range] {
      -webkit-appearance: none; width: 100%; background: transparent;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%;
      background: var(--fg-primary); cursor: pointer; margin-top: -6px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    input[type=range]::-webkit-slider-runnable-track {
      width: 100%; height: 4px; cursor: pointer;
      background: var(--border-subtle); border-radius: 2px;
    }
  `}</style>
);

export default GlobalStyles;