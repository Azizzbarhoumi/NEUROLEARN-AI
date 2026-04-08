import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Slide } from '@/types/slideTypes';
import { COLOR_MAP } from '@/types/slideTypes';

interface SlideNavigationProps {
  currentIndex: number;
  total: number;
  slides: Slide[];
  onPrev: () => void;
  onNext: () => void;
  onDot: (index: number) => void;
}

export default function SlideNavigation({
  currentIndex,
  total,
  slides,
  onPrev,
  onNext,
  onDot,
}: SlideNavigationProps) {
  const currentColor = COLOR_MAP[slides[currentIndex]?.color] || COLOR_MAP.purple;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <div className="flex items-center justify-between mt-5 px-1">
      {/* Prev button */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary font-display text-xs transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
        style={{
          boxShadow: !isFirst ? `0 0 14px ${currentColor.accent}33` : undefined,
        }}
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </button>

      {/* Dots */}
      <div className="flex items-center gap-2">
        {slides.map((s, i) => {
          const dotColor = COLOR_MAP[s.color] || COLOR_MAP.purple;
          const isActive = i === currentIndex;
          return (
            <button
              key={i}
              onClick={() => onDot(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: isActive ? 24 : 10,
                height: 10,
                background: isActive ? dotColor.accent : 'hsl(var(--muted))',
                boxShadow: isActive ? `0 0 8px ${dotColor.accent}66` : undefined,
              }}
            />
          );
        })}
      </div>

      {/* Next / Finish button */}
      <button
        onClick={onNext}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-display text-xs transition-all hover:scale-105"
        style={{
          background: isLast ? currentColor.accent : 'hsl(var(--secondary))',
          color: isLast ? '#fff' : undefined,
          boxShadow: `0 0 14px ${currentColor.accent}33`,
        }}
      >
        {isLast ? (
          <>
            Finish <Check className="w-4 h-4" />
          </>
        ) : (
          <>
            Next <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
