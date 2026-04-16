import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
}

export default function MermaidRenderer({ code }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#8B5CF6',
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: '#8B5CF6',
        lineColor: '#8B5CF6',
        secondaryColor: '#06B6D4',
        tertiaryColor: '#F8FAFC',
        mainBkg: '#FFFFFF',
        nodeBorder: '#8B5CF6',
        nodeBkg: '#8B5CF6',
        nodeTextColor: '#FFFFFF',
        arrowheadColor: '#8B5CF6',
        fontFamily: '"Outfit", "Nunito", system-ui, sans-serif',
        fontSize: '14px',
        textColor: '#1E293B',
      },
      flowchart: {
        curve: 'catmullRom',
        padding: 20,
        nodeSpacing: 40,
        rankSpacing: 50,
      },
      securityLevel: 'loose',
    });

    const renderDiagram = async () => {
      if (!code) return;
      
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        
        // Add styling wrapper
        const styledSvg = svg
          .replace('<svg', '<svg class="mermaid-diagram"')
          .replace(/<g class="node">/g, '<g class="node">')
          .replace(/<g class="label">/g, '<g class="label">');
        
        setSvg(styledSvg);
        setError(null);
      } catch (err) {
        console.error('[MermaidRenderer] Render error:', err);
        const errMsg = err instanceof Error ? err.message : 'Invalid diagram';
        if (errMsg.includes('Lexical') || errMsg.includes('Parse')) {
          setError('diagram-syntax');
        } else {
          setError(errMsg);
        }
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="p-4 border-2 border-dashed border-red-500/50 rounded-xl bg-red-500/10 text-red-500 text-xs font-mono">
        ⚠️ Diagram Render Error: {error}
        <pre className="mt-2 text-[10px] overflow-auto">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent border-purple-500 animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full overflow-auto"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
      }}
    >
      <style>{`
        .mermaid-diagram {
          width: 100%;
          max-width: 100%;
        }
        .mermaid-diagram .node rect,
        .mermaid-diagram .node polygon,
        .mermaid-diagram .node circle,
        .mermaid-diagram .node ellipse {
          fill: #8B5CF6 !important;
          stroke: #7C3AED !important;
          stroke-width: 2px !important;
          rx: 12 !important;
          ry: 12 !important;
          filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
        }
        .mermaid-diagram .node polygon {
          fill: #8B5CF6 !important;
        }
        .mermaid-diagram .node text {
          fill: #FFFFFF !important;
          font-family: "Outfit", "Nunito", system-ui, sans-serif !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }
        .mermaid-diagram .edgeLabel text {
          fill: #1E293B !important;
          font-family: "Outfit", system-ui, sans-serif !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }
        .mermaid-diagram .edgePath .path {
          stroke: #8B5CF6 !important;
          stroke-width: 2.5px !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
        }
        .mermaid-diagram .marker {
          fill: #8B5CF6 !important;
          stroke: #7C3AED !important;
        }
        .mermaid-diagram text {
          font-family: "Outfit", "Nunito", system-ui, sans-serif !important;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}