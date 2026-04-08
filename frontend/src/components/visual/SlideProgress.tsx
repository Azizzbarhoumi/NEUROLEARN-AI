interface SlideProgressProps {
  countdown: number;
  isAutoPlaying: boolean;
  color: string;
}

export default function SlideProgress({ countdown, isAutoPlaying, color }: SlideProgressProps) {
  if (!isAutoPlaying) return null;

  return (
    <div className="w-full h-[3px] bg-secondary/30 overflow-hidden">
      <div
        className="h-full transition-all duration-[50ms] ease-linear"
        style={{
          width: `${countdown}%`,
          background: color,
          boxShadow: `0 0 6px ${color}88`,
        }}
      />
    </div>
  );
}
