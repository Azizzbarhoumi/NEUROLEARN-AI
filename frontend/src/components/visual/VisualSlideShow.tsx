import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { SlidesData } from '@/types/slideTypes';
import { COLOR_MAP } from '@/types/slideTypes';
import { useSlideShow } from '@/hooks/useSlideShow';
import SlideCard from './SlideCard';
import SlideProgress from './SlideProgress';
import SlideSummary from './SlideSummary';

interface VisualSlideShowProps {
  data: SlidesData;
  topic: string;
}

export default function VisualSlideShow({ data, topic }: VisualSlideShowProps) {
  const {
    currentIndex,
    isAutoPlaying,
    isComplete,
    countdown,
    direction,
    goNext,
    goPrev,
    goToSlide,
    toggleAutoPlay,
    restart,
  } = useSlideShow({ totalSlides: data.slides.length });

  const currentSlide = data.slides[currentIndex];
  const currentColor = COLOR_MAP[currentSlide?.color] || COLOR_MAP.purple;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === data.slides.length - 1;

  if (isComplete) {
    return (
      <SlideSummary
        summary={data.summary}
        keyTakeaway={data.key_takeaway}
        onRestart={restart}
        topic={topic}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-2">
        {/* Prev Button */}
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-display text-sm font-bold transition-all hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#ffffff',
          }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Center: Title + Dots */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="font-display text-lg font-bold gradient-cosmic-text">
            {data.title}
          </h2>
          <div className="flex items-center gap-2">
            {data.slides.map((s, i) => {
              const dotColor = COLOR_MAP[s.color] || COLOR_MAP.purple;
              const isActive = i === currentIndex;
              return (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: isActive ? 28 : 10,
                    height: 10,
                    background: isActive ? dotColor.accent : 'rgba(255,255,255,0.2)',
                    boxShadow: isActive ? `0 0 10px ${dotColor.accent}88` : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Next / Finish Button */}
        <button
          onClick={goNext}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-display text-sm font-bold transition-all hover:scale-105"
          style={{
            background: isLast 
              ? 'linear-gradient(135deg, #7C6FF7 0%, #60B8FF 100%)' 
              : 'rgba(255,255,255,0.08)',
            border: isLast ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: '#ffffff',
            boxShadow: isLast ? '0 4px 20px rgba(124,111,247,0.4)' : undefined,
          }}
        >
          {isLast ? (
            <>
              <span className="hidden sm:inline">Finish</span> 🎉
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Slide Counter */}
      <div className="text-center">
        <span className="text-sm font-body text-muted-foreground">
          Slide {currentIndex + 1} of {data.slides.length} ✨
        </span>
      </div>

      {/* Slide area */}
      <div className="overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <SlideCard
            key={currentIndex}
            slide={currentSlide}
            direction={direction}
            totalSlides={data.slides.length}
          />
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <SlideProgress
        countdown={countdown}
        isAutoPlaying={isAutoPlaying}
        color={currentColor.accent}
      />

      {/* Autoplay toggle */}
      <div className="flex justify-center">
        <button
          onClick={toggleAutoPlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-display font-medium transition-all hover:scale-105"
          style={{
            background: isAutoPlaying ? currentColor.tint : 'rgba(255,255,255,0.08)',
            border: `1px solid ${isAutoPlaying ? currentColor.accent + '66' : 'rgba(255,255,255,0.12)'}`,
            color: isAutoPlaying ? currentColor.accent : 'rgba(255,255,255,0.7)',
          }}
        >
          {isAutoPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Playing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Auto Play</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
