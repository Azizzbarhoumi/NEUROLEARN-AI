import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import { getCharacter } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';

export default function SetupPin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useUser();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const char = getCharacter(profile.character);

  const handleDot = (num: number) => {
    if (step === 'create') {
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        if (newPin.length === 4) setTimeout(() => setStep('confirm'), 400);
      }
    } else {
      if (confirmPin.length < 4) {
        const newConfirm = confirmPin + num;
        setConfirmPin(newConfirm);
        if (newConfirm.length === 4) {
          if (newConfirm === pin) {
            setSuccess(true);
            updateProfile({ pinHash: btoa(pin), setupComplete: false });
            setTimeout(() => navigate('/learning-quiz'), 1200);
          } else {
            setError(true);
            setTimeout(() => {
              setConfirmPin('');
              setError(false);
            }, 800);
          }
        }
      }
    }
  };

  const currentPin = step === 'create' ? pin : confirmPin;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      <TopControls />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 px-4 max-w-3xl mx-auto">
        {/* Character */}
        <motion.div className="flex-shrink-0" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <img
            src={getCharacterImage(profile.character)}
            alt={char?.name || ''}
            className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover glow-primary"
            width={192}
            height={192}
          />
          <motion.div
            className="mt-4 bg-card rounded-xl p-3 border border-border max-w-[200px] relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="absolute -top-2 left-6 w-4 h-4 bg-card border-l border-t border-border rotate-45" />
            <p className="text-sm font-body text-foreground">
              {step === 'create' ? t('setupPin') : t('confirmPin')}
            </p>
          </motion.div>
        </motion.div>

        {/* PIN Input */}
        <motion.div
          className={`bg-card rounded-2xl p-8 border border-border ${error ? '' : ''}`}
          animate={error ? { x: [-10, 10, -10, 10, 0] } : success ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* Dots */}
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  i < currentPin.length
                    ? 'bg-primary border-primary glow-primary'
                    : 'border-muted-foreground'
                } ${error ? 'border-destructive bg-destructive' : ''}`}
                animate={i < currentPin.length ? { scale: [0.8, 1.2, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>

          {/* Number pad */}
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
              ) : (
                <div key={i} />
              )
            )}
          </div>

          {error && (
            <motion.p
              className="text-destructive text-sm text-center mt-4 font-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {t('pinMismatch')}
            </motion.p>
          )}
          {success && (
            <motion.p
              className="text-cosmic-green text-sm text-center mt-4 font-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ✨ {t('pinSuccess')}
            </motion.p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
