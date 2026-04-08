import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { EvolvedCharacter, TIER_LABELS } from '@/data/characterEvolution';
import { getCharacterImage } from '@/data/characterImages';

interface Props {
  character: EvolvedCharacter;
  onClose: () => void;
}

export default function HeroEvolutionModal({ character, onClose }: Props) {
  const [phase, setPhase] = useState<'charging' | 'reveal' | 'done'>('charging');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 2000);
    const t2 = setTimeout(() => {
      setPhase('done');
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#a855f7', '#ec4899', '#06b6d4', '#facc15'] });
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const tier = TIER_LABELS[character.tier];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={phase === 'done' ? onClose : undefined} />

        <motion.div className="relative z-10 flex flex-col items-center gap-6 p-8">
          {phase === 'charging' && (
            <motion.div
              className="flex flex-col items-center gap-4"
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <motion.div
                className="w-32 h-32 rounded-full"
                style={{ background: `radial-gradient(circle, hsl(${character.glowColor} / 0.8) 0%, transparent 70%)` }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-foreground font-display text-lg animate-pulse-glow">Evolving...</p>
            </motion.div>
          )}

          {(phase === 'reveal' || phase === 'done') && (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
            >
              <motion.div
                className="relative"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div
                  className="absolute inset-0 rounded-full blur-2xl -z-10"
                  style={{ background: `hsl(${character.glowColor} / 0.4)`, transform: 'scale(1.5)' }}
                />
                <img
                  src={getCharacterImage(character.baseCharacter)}
                  alt={character.name}
                  className="w-36 h-36 rounded-full object-cover border-4"
                  style={{ borderColor: `hsl(${character.glowColor})` }}
                />
                <span className="absolute -top-2 -right-2 text-3xl">{tier.badge}</span>
              </motion.div>

              <motion.h2
                className="font-display text-2xl font-bold text-center gradient-cosmic-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {character.name}
              </motion.h2>

              <motion.p
                className="text-muted-foreground font-body text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {tier.badge} {tier.label} Tier — {character.personality}
              </motion.p>

              {phase === 'done' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={onClose}
                  className="mt-4 px-6 py-3 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm glow-primary"
                >
                  Continue ✦
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
