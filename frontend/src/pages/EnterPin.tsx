import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import { getCharacter } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';

export default function EnterPin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const char = getCharacter(profile.character);

  const handleDot = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (btoa(newPin) === profile.pinHash) {
          navigate('/dashboard');
        } else {
          setError(true);
          setTimeout(() => { setPin(''); setError(false); }, 800);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      <TopControls />
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <motion.img
          src={getCharacterImage(profile.character)}
          alt={char?.name}
          className="w-24 h-24 rounded-full object-cover glow-primary"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          width={96}
          height={96}
        />
        <h2 className="font-display text-lg">{t('enterPin')}</h2>

        <motion.div
          className="bg-card rounded-2xl p-8 border border-border"
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? error ? 'bg-destructive border-destructive' : 'bg-primary border-primary glow-primary'
                    : 'border-muted-foreground'
                }`}
                animate={i < pin.length ? { scale: [0.8, 1.2, 1] } : {}}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, null].map((num, i) =>
              num !== null ? (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDot(num)}
                  className="w-14 h-14 rounded-xl bg-secondary text-foreground font-display text-xl hover:bg-primary/20 transition-colors"
                >
                  {num}
                </motion.button>
              ) : <div key={i} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
