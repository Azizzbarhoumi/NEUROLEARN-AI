import React, { useRef, useEffect, useState } from 'react';

// COLOR_MAP values from the project
const COLORS = {
  purple: '#7C6FF7',
  blue: '#60B8FF',
  green: '#7CF7B5',
  coral: '#FF8B8B',
  yellow: '#FFD700',
};

export default function SineWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for UI to show values
  const [params, setParams] = useState({
    amp1: 50,
    freq1: 0.02,
    phase1: 0,
    amp2: 30,
    freq2: 0.05,
    phase2: 0,
  });

  // Refs for animation loop to read without state staleness or overhead
  const paramsRef = useRef(params);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const resize = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = 400;
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerRef.current.clientWidth * dpr;
        canvas.height = 400 * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${containerRef.current.clientWidth}px`;
        canvas.style.height = '400px';
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const { amp1, freq1, phase1, amp2, freq2, phase2 } = paramsRef.current;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = 400; // Fixed style height
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      // Draw Center Axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Wave 1 (faded blue)
      ctx.beginPath();
      ctx.strokeStyle = `${COLORS.blue}44`; 
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const y = centerY + amp1 * Math.sin(x * freq1 + offset + (phase1 * Math.PI / 180));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Wave 2 (faded green)
      ctx.beginPath();
      ctx.strokeStyle = `${COLORS.green}44`; 
      ctx.lineWidth = 2;
      for (let x = 0; x < w; x++) {
        const y = centerY + amp2 * Math.sin(x * freq2 + offset + (phase2 * Math.PI / 180));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Combined Wave (Sum - Purple)
      ctx.beginPath();
      ctx.strokeStyle = COLORS.purple; 
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `${COLORS.purple}88`;
      
      for (let x = 0; x < w; x++) {
        const y1 = amp1 * Math.sin(x * freq1 + offset + (phase1 * Math.PI / 180));
        const y2 = amp2 * Math.sin(x * freq2 + offset + (phase2 * Math.PI / 180));
        const y = centerY + y1 + y2;
        
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      offset -= 0.05; // Horizontal movement
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div ref={containerRef} className="rounded-2xl border border-white/10 bg-[#0A0A1F]/60 backdrop-blur-xl overflow-hidden shadow-2xl relative">
        <canvas ref={canvasRef} className="cursor-crosshair w-full" />
        <div className="absolute top-4 left-4 flex gap-4">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-[#60B8FF]" />
            <span className="text-[10px] uppercase tracking-tighter text-white font-display">Wave A</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-[#7CF7B5]" />
            <span className="text-[10px] uppercase tracking-tighter text-white font-display">Wave B</span>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-[#7C6FF7]" />
            <span className="text-[10px] uppercase tracking-tighter text-white font-display">Combined (Superposition)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Wave 1 Panel */}
        <div className="p-5 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-[#60B8FF] uppercase">Wave A Properties</h3>
            <span className="text-[10px] font-mono text-muted-foreground">{params.amp1}A | {params.freq1.toFixed(2)}f</span>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-display text-muted-foreground uppercase">Amplitude</label>
              <input 
                type="range" min="0" max="100" 
                value={params.amp1} 
                onChange={e => setParams(p => ({ ...p, amp1: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#60B8FF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-display text-muted-foreground uppercase">Frequency</label>
              <input 
                type="range" min="0.001" max="0.1" step="0.001" 
                value={params.freq1} 
                onChange={e => setParams(p => ({ ...p, freq1: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#60B8FF]"
              />
            </div>
          </div>
        </div>

        {/* Wave 2 Panel */}
        <div className="p-5 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-[#7CF7B5] uppercase">Wave B Properties</h3>
            <span className="text-[10px] font-mono text-muted-foreground">{params.amp2}A | {params.freq2.toFixed(2)}f</span>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-display text-muted-foreground uppercase">Amplitude</label>
              <input 
                type="range" min="0" max="100" 
                value={params.amp2} 
                onChange={e => setParams(p => ({ ...p, amp2: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7CF7B5]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-display text-muted-foreground uppercase">Frequency</label>
              <input 
                type="range" min="0.001" max="0.1" step="0.001" 
                value={params.freq2} 
                onChange={e => setParams(p => ({ ...p, freq2: parseFloat(e.target.value) }))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7CF7B5]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
