import { motion } from 'framer-motion';

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  showLabel?: boolean;
}

export default function XPBar({ current, max, level, showLabel = true }: XPBarProps) {
  const progress = Math.min((current % max) / max * 100, 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-body">
          <span className="text-muted-foreground">Level {level}</span>
          <span className="text-cosmic-gold font-medium">{current % max} / {max} XP</span>
        </div>
      )}
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full gradient-cosmic"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
