import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSlideShowOptions {
  totalSlides: number;
}

export function useSlideShow({ totalSlides }: UseSlideShowOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const autoPlayRef = useRef<ReturnType<typeof setInterval>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const goNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      setDirection('right');
      setCurrentIndex(prev => prev + 1);
      setCountdown(0);
    } else {
      setIsAutoPlaying(false);
      setIsComplete(true);
    }
  }, [currentIndex, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('left');
      setCurrentIndex(prev => prev - 1);
      setCountdown(0);
    }
  }, [currentIndex]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setDirection(index > currentIndex ? 'right' : 'left');
      setCurrentIndex(index);
      setCountdown(0);
    }
  }, [currentIndex, totalSlides]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
    setCountdown(0);
  }, []);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setIsComplete(false);
    setIsAutoPlaying(false);
    setCountdown(0);
    setDirection('right');
  }, []);

  // Autoplay timer — every 5 seconds
  useEffect(() => {
    if (isAutoPlaying && totalSlides > 0) {
      autoPlayRef.current = setInterval(() => {
        goNext();
      }, 5000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isAutoPlaying, goNext, totalSlides]);

  // Countdown timer — updates every 50ms for smooth progress bar
  useEffect(() => {
    if (isAutoPlaying) {
      setCountdown(0);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev >= 100) return 0;
          return prev + 1; // 100 steps over 5000ms = 50ms per step
        });
      }, 50);
    } else {
      setCountdown(0);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAutoPlaying, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  return {
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
  };
}
