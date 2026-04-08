import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import type { SlidesData } from '@/types/slideTypes';
import { COLOR_MAP } from '@/types/slideTypes';
import { useSlideShow } from '@/hooks/useSlideShow';
import SlideCard from './SlideCard';
import SlideNavigation from './SlideNavigation';
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
    <div className="space-y-0">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-sm font-bold gradient-cosmic-text">
            {data.title}
          </h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Slide {currentIndex + 1} of {data.slides.length}
          </p>
        </div>

        {/* Autoplay toggle */}
        <button
          onClick={toggleAutoPlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display transition-all hover:scale-105"
          style={{
            background: isAutoPlaying ? currentColor.tint : 'hsl(var(--secondary))',
            border: isAutoPlaying ? `1px solid ${currentColor.accent}44` : '1px solid transparent',
            color: isAutoPlaying ? currentColor.accent : undefined,
          }}
        >
          {isAutoPlaying ? (
            <>
              <div className="relative w-4 h-4">
                <Pause className="w-4 h-4" />
                {/* Spinning progress ring */}
                <svg
                  className="absolute -inset-1 w-6 h-6"
                  viewBox="0 0 24 24"
                  style={{ animation: 'spin 2s linear infinite' }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke={currentColor.accent}
                    strokeWidth="2"
                    strokeDasharray="62.8"
                    strokeDashoffset={62.8 - (62.8 * countdown) / 100}
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                </svg>
              </div>
              Playing
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Auto Play
            </>
          )}
        </button>
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

      {/* Navigation */}
      <SlideNavigation
        currentIndex={currentIndex}
        total={data.slides.length}
        slides={data.slides}
        onPrev={goPrev}
        onNext={goNext}
        onDot={goToSlide}
      />
    </div>
  );
}
