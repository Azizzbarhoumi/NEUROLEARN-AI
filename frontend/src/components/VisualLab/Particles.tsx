import React, { useRef, useEffect, useState, useCallback } from 'react';

const COLORS = {
  purple: '#7C6FF7',
  blue: '#60B8FF',
  green: '#7CF7B5',
  coral: '#FF8B8B',
  yellow: '#FFD700',
};

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.radius = Math.random() * 2 + 2;
    const colorKeys = Object.values(COLORS);
    this.color = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  }

  update(mouse: { x: number; y: number; active: boolean }, gravity: number, w: number, h: number) {
    // Basic Movement
    this.x += this.vx;
    this.y += this.vy;

    // Bounds
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;

    // Mouse Interaction
    if (mouse.active) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const force = (200 - dist) / 200 * gravity;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }
    }

    // Friction
    this.vx *= 0.99;
    this.vy *= 0.99;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 4;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export default function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const [gravity, setGravity] = useState(0.5);
  const gravityRef = useRef(0.5);

  useEffect(() => {
    gravityRef.current = gravity;
  }, [gravity]);

  const initParticles = useCallback((w: number, h: number) => {
    const count = Math.min(100, Math.floor((w * h) / 8000));
    particlesRef.current = [];
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(Math.random() * w, Math.random() * h));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

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
        initParticles(w, h);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = 400;

      ctx.fillStyle = 'rgba(10, 10, 31, 1)';
      ctx.fillRect(0, 0, w, h);

      // Draw lines between close particles
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(124, 111, 247, ${1 - dist / 100})`;
            ctx.stroke();
          }
        }
      }

      particlesRef.current.forEach(p => {
        p.update(mouseRef.current, gravityRef.current, w, h);
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [initParticles]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current.active = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Spawn 5 particles on click
      for (let i = 0; i < 5; i++) {
        if (particlesRef.current.length < 300) {
          particlesRef.current.push(new Particle(x, y));
        }
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div ref={containerRef} className="rounded-2xl border border-white/10 bg-[#0A0A1F]/60 backdrop-blur-xl overflow-hidden shadow-2xl relative">
        <canvas 
          ref={canvasRef} 
          className="cursor-none w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
        />
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] uppercase tracking-wider text-white font-display">Active Flow | {particlesRef.current.length} particles</span>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white/5 font-display text-4xl uppercase select-none font-black italic">
          Attract Mode
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-secondary/20 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-[#7C6FF7] uppercase tracking-wider">Gravity Mechanics</h3>
          <button 
            onClick={() => particlesRef.current = []}
            className="text-[10px] uppercase bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full hover:bg-red-500/20 transition-colors"
          >
            Clear All
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase">
             <span>Repel</span>
             <span>Current Strength: {gravity.toFixed(2)}</span>
             <span>Attract</span>
          </div>
          <input 
            type="range" min="-1" max="1" step="0.05" 
            value={gravity} 
            onChange={e => setParams(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7C6FF7]"
          />
        </div>
        <p className="text-[10px] font-body text-muted-foreground italic leading-relaxed">
          🖱️ <span className="text-white">Hover</span> to influence the flow. <span className="text-white">Click</span> to spawn matter. Gravity simulates how mass interacts in a void.
        </p>
      </div>
    </div>
  );
  
  function setParams(val: number) {
    setGravity(val);
  }
}
