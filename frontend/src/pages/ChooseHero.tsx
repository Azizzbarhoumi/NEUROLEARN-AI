import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { CHARACTERS } from '@/data/characters';
import { getCharacterImage } from '@/data/characterImages';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { Check, Sparkles } from 'lucide-react';
import type { CharacterKey } from '@/contexts/UserContext';

export default function ChooseHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updateProfile } = useUser();
  const [selected, setSelected] = useState<CharacterKey>(null);

  const handleContinue = () => {
    if (selected) {
      updateProfile({ character: selected });
      navigate('/setup-pin');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      <TopControls />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-cosmic-gold" />
            <h1 className="text-3xl md:text-4xl font-display font-bold gradient-cosmic-text">
              {t('chooseHero')}
            </h1>
            <Sparkles className="w-6 h-6 text-cosmic-gold" />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {CHARACTERS.map((char, i) => (
            <motion.button
              key={char.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(char.key)}
              className={`relative p-4 rounded-2xl bg-card border-2 transition-all flex flex-col items-center gap-3 ${
                selected === char.key
                  ? 'border-primary glow-primary'
                  : 'border-border hover:border-primary/40 card-glow'
              }`}
            >
              {selected === char.key && (
                <motion.div
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}
              <motion.img
                src={getCharacterImage(char.key)}
                alt={char.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                animate={selected === char.key ? { y: [0, -5, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                loading="lazy"
                width={96}
                height={96}
              />
              <span className="text-sm font-display font-medium">
                {char.emoji} {char.name}
              </span>
              <span className="text-xs text-muted-foreground font-body">{char.personality}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleContinue}
                className="px-8 py-3 rounded-xl font-display gradient-cosmic text-primary-foreground glow-primary"
              >
                {t('continue')} →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
