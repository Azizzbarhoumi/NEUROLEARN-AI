import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Code, HelpCircle, Terminal } from 'lucide-react';

interface InteractiveCanvasProps {
  code: string;
  title: string;
  explanation: string;
  keyTakeaway: string;
}

const COLORS = {
  purple: '#7C6FF7',
  blue: '#60B8FF',
  green: '#7CF7B5',
  coral: '#FF8B8B',
  yellow: '#FFD700',
  background: '#0D0118'
};

export default function InteractiveCanvas({ code, title, explanation, keyTakeaway }: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isCompiling, setIsCompiling] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  const runSimulation = () => {
    if (!canvasRef.current || !code) return;
    
    setError(null);
    setIsCompiling(true);
    
    // Cleanup previous instance
    if (cleanupRef.current) {
      try {
        cleanupRef.current();
      } catch (e) {
        console.warn('Cleanup failed', e);
      }
      cleanupRef.current = null;
    }

    // Set up high-DPI canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // AI Simulation Sandbox
    try {
      // The AI generates: function init(canvas, colors) { ... }
      // We wrap it to ensure it can be called and potentially return a cleanup
      const sandbox = new Function('canvas', 'colors', `
        ${code}
        if (typeof init === 'function') {
          return init(canvas, colors);
        }
        return null;
      `);

      const result = sandbox(canvas, COLORS);
      if (typeof result === 'function') {
        cleanupRef.current = result;
      }
      
      // Simulate "compiling" delay for effect
      setTimeout(() => setIsCompiling(false), 800);
    } catch (err: any) {
      setError(err.message || 'The AI-generated code has a syntax error.');
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    // Initial run
    const timer = setTimeout(runSimulation, 500);
    
    // Resize handler
    const handleResize = () => {
      runSimulation();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (cleanupRef.current) cleanupRef.current();
      clearTimeout(timer);
    };
  }, [code]);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-display font-black text-white uppercase tracking-tighter">
            {title}
          </h2>
          <div className="flex items-center gap-2 text-xs font-display text-primary uppercase tracking-widest">
            <Terminal className="w-3 h-3" /> AI Simulation Hub
          </div>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded-xl border transition-all ${showCode ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-muted-foreground hover:text-white'}`}
            title="View Code"
          >
            <Code className="w-5 h-5" />
          </button>
          <button 
            onClick={runSimulation}
            className="p-2 rounded-xl bg-white/5 border border-white/5 text-muted-foreground hover:text-white transition-all"
            title="Refresh Simulation"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div 
          ref={containerRef} 
          className="w-full aspect-video rounded-3xl overflow-hidden bg-[#0D0118] border-2 border-white/5 shadow-2xl relative"
          style={{ boxShadow: '0 0 50px rgba(124,111,247,0.1)' }}
        >
          <canvas 
            ref={canvasRef} 
            className="w-full h-full cursor-crosshair"
          />

          {/* Compilation / Loading Overlay */}
          <AnimatePresence>
            {isCompiling && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-[#0D0118]/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <h3 className="font-display font-bold text-white text-lg mb-2 uppercase tracking-tight">AI is coding your simulation...</h3>
                <p className="text-muted-foreground font-body text-sm max-w-xs leading-relaxed italic">
                  Parsing prompts, generating Canvas buffers, and finalizing the animation loop.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Overlay */}
          <AnimatePresence>
            {error && !isCompiling && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-30 bg-destructive/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="font-display font-bold text-white text-lg mb-2 uppercase tracking-tight">Execution Error</h3>
                <p className="text-white/80 font-body text-sm max-w-md mb-6 font-mono bg-black/30 p-3 rounded-lg overflow-auto max-h-32">
                  {error}
                </p>
                <button 
                   onClick={runSimulation}
                   className="px-6 py-2.5 rounded-xl bg-white text-destructive font-display font-bold text-sm uppercase tracking-tighter hover:bg-white/90 transition-colors"
                >
                  Regenerate Script
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code Drawer Overlay */}
          <AnimatePresence>
            {showCode && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 right-0 z-40 w-full md:w-[400px] bg-black/90 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-display font-black text-primary uppercase tracking-widest">Source Stream</h4>
                  <button onClick={() => setShowCode(false)} className="text-muted-foreground hover:text-white text-[10px] uppercase">Close</button>
                </div>
                <div className="flex-1 overflow-auto rounded-xl bg-[#050510] border border-white/5 p-4 font-mono text-[11px] leading-relaxed text-[#60B8FF]">
                  <pre>{code}</pre>
                </div>
                <p className="text-[9px] text-muted-foreground mt-4 font-body leading-none">
                  AI-generated JavaScript (ES6+). Optimized for high-performance Canvas 2D.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3">
          <h3 className="text-xs font-display font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" /> Concept Breakdown
          </h3>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            {explanation}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-700" />
          <h3 className="text-xs font-display font-black text-cosmic-gold uppercase tracking-widest flex items-center gap-2">
            ✨ Key Intelligence
          </h3>
          <p className="text-sm text-white font-body leading-relaxed font-medium">
            {keyTakeaway}
          </p>
          <div className="pt-2">
            <div className="text-[10px] text-muted-foreground uppercase font-display tracking-tighter opacity-50">
              Interactive Mode Active • 60 FPS Target
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
