import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Slide } from '@/types/slideTypes';
import { COLOR_MAP } from '@/types/slideTypes';
import MermaidRenderer from './MermaidRenderer';

const IFRAME_BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%) !important;
    color: #ffffff;
    min-height: 0;
    padding: 1.5rem;
    margin: 0;
    overflow: hidden;
  }
  .slide-container {
    width: 100%;
    max-width: 700px;
    text-align: left;
  }
  h3 {
    font-size: 1.4rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
    color: #ffffff;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(124, 111, 247, 0.5);
  }
  p {
    font-size: 0.95rem;
    line-height: 1.7;
    color: #cbd5e1;
    margin: 0 0 1rem 0;
  }
  .example {
    background: rgba(124, 111, 247, 0.1);
    border: 1px solid rgba(124, 111, 247, 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-top: 0.75rem;
  }
  .example-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #7c6ff7;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .example div:not(.example-title) {
    font-size: 0.9rem;
    color: #e2e8f0;
    line-height: 1.5;
  }
  div, span, b, strong {
    background: transparent !important;
  }
`;

interface SlideCardProps {
  slide: Slide;
  direction: 'left' | 'right';
  totalSlides: number;
}

export default function SlideCard({ slide, direction, totalSlides }: SlideCardProps) {
  const slideNumber = slide.slide ?? slide.slide_number ?? 1;
  const slideColor = slide.color || ['purple', 'blue', 'green', 'yellow', 'coral'][slideNumber % 5] as keyof typeof COLOR_MAP;
  const color = COLOR_MAP[slideColor] || COLOR_MAP.purple;
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number | undefined>(180);

  const hasHtmlContent = !!slide.html_content;

  useEffect(() => {
    if (!hasHtmlContent) return;
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'slideHeight' && typeof e.data.height === 'number') {
        setIframeHeight(Math.max(180, e.data.height + 20));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasHtmlContent]);

  const iframeSrcDoc = useMemo(() => {
    if (!hasHtmlContent) return '';
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script>
window.onload = function() {
  setInterval(function() {
    window.parent.postMessage({ type: 'slideHeight', height: document.body.scrollHeight }, '*');
  }, 100);
};
window.onresize = function() {
  window.parent.postMessage({ type: 'slideHeight', height: document.body.scrollHeight }, '*');
};
</script>
<style>
${IFRAME_BASE_STYLES}
</style>
</head>
<body>
${slide.html_content}
</body>
</html>`;
  }, [slide.html_content, hasHtmlContent]);

  useEffect(() => {
    if (hasHtmlContent) return;
    setGeneratedImage(null);
    if (slide.visual_hint) {
      setIsGenerating(true);
      const styleKeywords = ', digital art, smooth highlights, Artstation, clear concept, high quality';
      const prompt = encodeURIComponent(slide.visual_hint + styleKeywords);
      const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=500&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
      const timeout = setTimeout(() => {
        setGeneratedImage(imageUrl);
        setIsGenerating(false);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [slide.slide, slide.slide_number, slide.visual_hint, hasHtmlContent]);

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
            {slideNumber}
          </div>
          <h2 className="text-lg font-display font-bold">{slide.title}</h2>
        </div>
        <div className="flex items-center gap-2">
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
          {slide.speaker_notes && (
            <button
              onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
              className="px-2.5 py-1 rounded-full text-xs font-display font-medium transition-all hover:scale-105"
              style={{
                background: showSpeakerNotes ? color.tint : 'hsl(var(--secondary))',
                color: showSpeakerNotes ? color.accent : 'hsl(var(--muted-foreground))',
                border: `1px solid ${color.accent}44`,
              }}
            >
              {showSpeakerNotes ? 'Hide Notes' : 'Notes'}
            </button>
          )}
        </div>
      </div>

      {/* Speaker notes */}
      {showSpeakerNotes && slide.speaker_notes && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-6 mb-3 px-4 py-3 rounded-xl text-sm font-body leading-relaxed"
          style={{
            background: color.tint,
            border: `1px solid ${color.accent}33`,
            color: color.accent,
          }}
        >
          {slide.speaker_notes}
        </motion.div>
      )}

      {/* Content area */}
      {hasHtmlContent ? (
        <div className="px-4 py-3 space-y-4">
          <iframe
            srcDoc={iframeSrcDoc}
            title={`Slide ${slideNumber}: ${slide.title}`}
            sandbox="allow-scripts"
            className="w-full rounded-xl border border-white/5"
            style={{
              height: iframeHeight,
              minHeight: 180,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              borderRadius: '0.75rem',
            }}
          />
          {/* Napkin diagram image */}
          {(slide as any).diagram_image_url && (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-card/50">
              <div className="px-3 py-2 text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: color.accent, background: color.tint }}>
                <span className="text-base">📊</span> Educational Diagram
              </div>
              <div className="p-3">
                <img
                  src={(slide as any).diagram_image_url}
                  alt="Diagram"
                  className="w-full rounded-lg"
                  style={{ maxHeight: '500px', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}
          {/* Mermaid diagram */}
          {(slide as any).diagram_mermaid_code && (
            <div className="rounded-xl overflow-hidden border border-white/10 bg-card/50">
              <div className="px-3 py-2 text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: color.accent, background: color.tint }}>
                <span className="text-base">📊</span> Educational Diagram
              </div>
              <div className="p-3">
                <MermaidRenderer code={(slide as any).diagram_mermaid_code} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Text content fallback */}
          {slide.content && (
            <div className="px-7 py-5">
              <p className="text-base font-body leading-relaxed" style={{ lineHeight: 1.8 }}>
                {slide.content}
              </p>
            </div>
          )}

          {/* Visual hint image */}
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
                        backgroundColor: 'rgba(0,0,0,0.2)',
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
                        if (!target.src.includes('seed=final_retry')) {
                          target.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.visual_hint!)}?nologo=true&seed=final_retry`;
                        }
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-xl pointer-events-none opacity-10 group-hover:opacity-30 transition-opacity duration-500"
                      style={{ boxShadow: `inset 0 0 50px ${color.accent}` }}
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <div className="px-2 py-1 rounded bg-black/40 backdrop-blur-md text-[8px] text-white font-mono uppercase">AI Generated</div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Slide footer */}
      <div className="px-6 pb-4">
        <span className="text-xs text-muted-foreground font-body">
          {slideNumber} / {totalSlides}
        </span>
      </div>
    </motion.div>
  );
}
