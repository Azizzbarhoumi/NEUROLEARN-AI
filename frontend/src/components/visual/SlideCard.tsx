import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Slide } from '@/types/slideTypes';
import { COLOR_MAP } from '@/types/slideTypes';

interface SlideCardProps {
  slide: Slide;
  direction: 'left' | 'right';
  totalSlides: number;
}

export default function SlideCard({ slide, direction, totalSlides }: SlideCardProps) {
  const color = COLOR_MAP[slide.color] || COLOR_MAP.purple;
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Use an AI image generation service (Pollinations AI) based on the visual_hint
    const prompt = encodeURIComponent(slide.visual_hint);
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
    
    // Tiny delay to show the nice skeleton animation
    setTimeout(() => {
      setGeneratedImage(imageUrl);
      setIsGenerating(false);
    }, 1500);
  };

  // Auto-generate on slide mount or change
  useEffect(() => {
    // Reset image when slide changes
    setGeneratedImage(null);
    
    if (slide.visual_hint) {
      setIsGenerating(true);
      const styleKeywords = ', digital art, smooth highlights, Artstation, clear concept, high quality';
      const prompt = encodeURIComponent(slide.visual_hint + styleKeywords);
      const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=500&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
      
      // Artificial delay for premium feel
      const timeout = setTimeout(() => {
        setGeneratedImage(imageUrl);
        setIsGenerating(false);
      }, 1200);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [slide.slide, slide.visual_hint]);

  const variants = {
    enter: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? '100.5%' : '-100.5%',
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'left' | 'right') => ({
      x: dir === 'right' ? '-100.5%' : '100.5%',
      opacity: 0,
    }),
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Accent bar */}
      <div
        className="w-full h-1.5"
        style={{
          background: color.accent,
          boxShadow: `0 2px 12px ${color.accent}66`,
        }}
      />

      {/* Slide header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold text-white"
            style={{ background: color.accent }}
          >
            {slide.slide}
          </div>
          <h2 className="text-lg font-display font-bold">{slide.title}</h2>
        </div>
        {slide.key_term && (
          <span
            className="px-3 py-1 rounded-full text-xs font-mono font-semibold"
            style={{
              background: color.tint,
              color: color.accent,
              border: `1px solid ${color.accent}44`,
            }}
          >
            {slide.key_term}
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="px-7 py-5">
        <p className="text-base font-body leading-relaxed" style={{ lineHeight: 1.8 }}>
          {slide.content}
        </p>
      </div>

      {/* Visual hint box */}
      {slide.visual_hint && (
        <div className="px-6 pb-5">
          <div
            className="rounded-2xl p-5 transition-all duration-300"
            style={{
              border: `2px dashed ${color.accent}88`,
              background: color.tint,
            }}
          >
            {isGenerating || !generatedImage ? (
              <div className="space-y-4 py-2">
                <div className="h-48 w-full animate-shimmer rounded-xl relative overflow-hidden" 
                  style={{ 
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', 
                    backgroundSize: '200% 100%',
                    backgroundColor: 'rgba(0,0,0,0.2)' 
                  }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-2 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${color.accent} transparent transparent transparent` }} />
                       <span className="text-[10px] font-display text-muted-foreground uppercase tracking-widest animate-pulse">Visualizing...</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group mt-1"
              >
                <img
                  src={generatedImage}
                  alt={slide.visual_hint}
                  className="w-full rounded-xl shadow-2xl border border-white/5 transition-all duration-700 group-hover:scale-[1.01]"
                  style={{ minHeight: '240px', maxHeight: '420px', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Try one last time with a fresh seed and no extra params
                    if (!target.src.includes('seed=final_retry')) {
                      target.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.visual_hint)}?nologo=true&seed=final_retry`;
                    }
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-xl pointer-events-none opacity-10 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 50px ${color.accent}` }}
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                   <div className="px-2 py-1 rounded bg-black/40 backdrop-blur-md text-[8px] text-white font-mono uppercase">AI Generated Hub</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Slide footer */}
      <div className="px-6 pb-4">
        <span className="text-xs text-muted-foreground font-body">
          {slide.slide} / {totalSlides}
        </span>
      </div>
    </motion.div>
  );
}
