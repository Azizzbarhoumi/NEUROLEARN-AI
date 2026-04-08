import React, { useRef, useEffect, useState } from 'react';

const COLORS = {
  purple: '#7C6FF7',
  blue: '#60B8FF',
  green: '#7CF7B5',
  coral: '#FF8B8B',
  yellow: '#FFD700',
};

export default function FourierSeries() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(4);
  const nRef = useRef(4);
  const [type, setType] = useState<'square' | 'sawtooth'>('square');
  const typeRef = useRef<'square' | 'sawtooth'>('square');

  useEffect(() => {
    nRef.current = n;
    typeRef.current = type;
  }, [n, type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let animationFrameId: number;
    let wavePoints: number[] = [];

    const resize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = 400;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = 400;
      const originX = 180;
      const originY = 200;

      ctx.clearRect(0, 0, w, h);

      let x = 0;
      let y = 0;

      for (let i = 0; i < nRef.current; i++) {
        let prevx = x;
        let prevy = y;

        let radius: number;
        let nValue: number;

        if (typeRef.current === 'square') {
          nValue = i * 2 + 1;
          radius = 75 * (4 / (nValue * Math.PI));
        } else {
          nValue = i + 1;
          radius = 50 * (2 / (nValue * Math.PI * (i % 2 === 0 ? 1 : -1)));
        }

        x += radius * Math.cos(nValue * time);
        y += radius * Math.sin(nValue * time);

        // Draw circles
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(originX + prevx, originY + prevy, Math.abs(radius), 0, Math.PI * 2);
        ctx.stroke();

        // Draw connections
        ctx.strokeStyle = COLORS.blue;
        ctx.beginPath();
        ctx.moveTo(originX + prevx, originY + prevy);
        ctx.lineTo(originX + x, originY + y);
        ctx.stroke();
        
        ctx.fillStyle = COLORS.blue;
        ctx.beginPath();
        ctx.arc(originX + x, originY + y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      wavePoints.unshift(y);
      if (wavePoints.length > 500) wavePoints.pop();

      // Connect circle to wave
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(originX + x, originY + y);
      ctx.lineTo(originX + 150, originY + y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw the wave
      ctx.beginPath();
      ctx.strokeStyle = COLORS.purple;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `${COLORS.purple}88`;
      for (let i = 0; i < wavePoints.length; i++) {
        const wx = originX + 150 + i;
        const wy = originY + wavePoints[i];
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      time += 0.03;
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
        <canvas ref={canvasRef} className="w-full" />
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-white font-display">Harmonic Convergence: {n} terms</span>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-[#60B8FF] uppercase tracking-wider">Fourier Series Controls</h3>
          <div className="flex bg-black/30 rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => setType('square')}
              className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest transition-colors ${type === 'square' ? 'bg-[#7C6FF7] text-white shadow-lg shadow-[#7C6FF7]/20' : 'text-muted-foreground hover:text-white'}`}
            >
              Square
            </button>
            <button 
              onClick={() => setType('sawtooth')}
              className={`px-3 py-1 rounded text-[10px] uppercase tracking-widest transition-colors ${type === 'sawtooth' ? 'bg-[#7C6FF7] text-white shadow-lg shadow-[#7C6FF7]/20' : 'text-muted-foreground hover:text-white'}`}
            >
              Sawtooth
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase">
             <span>Terms: {n}</span>
          </div>
          <input 
            type="range" min="1" max="25" 
            value={n} 
            onChange={e => setN(parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#60B8FF]"
          />
        </div>
        <p className="text-[10px] font-body text-muted-foreground italic leading-relaxed">
          ✨ Joseph Fourier discovered that complicated periodic waves can be synthesized by summing simple sines and cosines. Watch how the wave stabilizes as more terms are added.
        </p>
      </div>
    </div>
  );
}
