import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { Sparkles, Rocket } from 'lucide-react';
import { getCharacterImage } from '@/data/characterImages';

export default function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useUser();

  const handleStart = () => {
    if (profile.setupComplete) {
      navigate('/dashboard');
    } else {
      navigate('/choose-hero');
    }
  };

  const handleLogin = () => {
    if (profile.setupComplete) {
      navigate('/enter-pin');
    } else {
      navigate('/choose-hero');
    }
  };

  const floatingChars = ['hiro', 'sakura', 'luna'] as const;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      <TopControls />

      {/* Floating characters */}
      {floatingChars.map((char, i) => (
        <motion.img
          key={char}
          src={getCharacterImage(char)}
          className="absolute w-24 h-24 opacity-20 pointer-events-none"
          style={{
            top: `${20 + i * 25}%`,
            left: i === 1 ? '80%' : `${10 + i * 30}%`,
          }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, i % 2 === 0 ? 5 : -5, 0],
          }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}
          loading="lazy"
          width={96}
          height={96}
        />
      ))}

      <motion.div
        className="z-10 text-center px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="flex items-center justify-center gap-2 mb-4"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-8 h-8 text-cosmic-gold" />
          <h1 className="text-5xl md:text-7xl font-display font-bold gradient-cosmic-text glow-text">
            NeuroLearn
          </h1>
          <Sparkles className="w-8 h-8 text-cosmic-gold" />
        </motion.div>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground mb-12 font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('tagline')}
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px hsl(270 80% 65% / 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="px-8 py-4 rounded-xl font-display text-lg gradient-cosmic text-primary-foreground glow-primary flex items-center gap-2 justify-center"
          >
            <Rocket className="w-5 h-5" />
            {t('startAdventure')}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            className="px-8 py-4 rounded-xl font-display text-lg bg-secondary text-secondary-foreground border border-border hover:border-primary/50 transition-colors"
          >
            {t('haveAccount')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
