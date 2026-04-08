import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser, LearningStyle } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import { getCharacter } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import confetti from 'canvas-confetti';

const styleIcons: Record<string, string> = {
  visual: '👁️',
  auditory: '👂',
  kinesthetic: '🤸',
  reading: '📖',
  logical: '🧩',
  narrative: '📖',
};

const styleTitleKeys: Record<string, string> = {
  visual: 'visualLearner',
  auditory: 'auditoryLearner',
  kinesthetic: 'kinestheticLearner',
  reading: 'readingLearner',
  logical: 'logicalLearner',
  narrative: 'narrativeLearner',
};

// Fallback data if no AI profile available
const fallbackData: Record<string, { descKey: string; strengthKey: string; growthKey: string }> = {
  visual: { descKey: 'visualDesc', strengthKey: 'visualStrength', growthKey: 'visualGrowth' },
  auditory: { descKey: 'auditoryDesc', strengthKey: 'auditoryStrength', growthKey: 'auditoryGrowth' },
  kinesthetic: { descKey: 'kinestheticDesc', strengthKey: 'kinestheticStrength', growthKey: 'kinestheticGrowth' },
  reading: { descKey: 'readingDesc', strengthKey: 'readingStrength', growthKey: 'readingGrowth' },
  logical: { descKey: 'kinestheticDesc', strengthKey: 'kinestheticStrength', growthKey: 'kinestheticGrowth' },
  narrative: { descKey: 'readingDesc', strengthKey: 'readingStrength', growthKey: 'readingGrowth' },
};

export default function ProfileReveal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, addXP, earnBadge, updateProfile } = useUser();
  const [phase, setPhase] = useState(0); // 0=dim, 1=orb, 2=analyzing, 3=reveal
  const char = getCharacter(profile.character);
  const style = profile.learningStyle || 'visual';
  const styleProfile = profile.styleProfile;
  const icon = styleIcons[style] || '🧠';
  const titleKey = styleTitleKeys[style] || 'visualLearner';
  const fb = fallbackData[style] || fallbackData.visual;

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => {
        setPhase(3);
        addXP(100);
        earnBadge('first-quest');
        updateProfile({ setupComplete: true });
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      <TopControls />

      <motion.div
        className="absolute inset-0 bg-background/80 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase < 3 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      <div className="relative z-20 text-center px-4 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {phase < 3 ? (
            <motion.div key="loading" className="flex flex-col items-center">
              {/* Character floating */}
              <motion.img
                src={getCharacterImage(profile.character)}
                alt={char?.name}
                className="w-32 h-32 rounded-full object-cover mb-8"
                animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                width={128}
                height={128}
              />

              {/* Glowing orb */}
              {phase >= 1 && (
                <motion.div
                  className="w-20 h-20 rounded-full gradient-cosmic mb-6"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {/* Analyzing text */}
              {phase >= 2 && (
                <motion.p
                  className="text-lg font-display text-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {t('analyzing')}
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <motion.img
                src={getCharacterImage(profile.character)}
                alt={char?.name}
                className="w-28 h-28 rounded-full object-cover mb-4 glow-primary"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                width={112}
                height={112}
              />

              <p className="text-sm text-muted-foreground font-body mb-1">{t('youAre')}</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold gradient-cosmic-text mb-2">
                {icon} {t(titleKey) || `${style.charAt(0).toUpperCase() + style.slice(1)} Learner`}
              </h1>

              {/* Confidence badge */}
              {styleProfile?.confidence && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <span className="px-3 py-1 rounded-full bg-cosmic-green/20 text-cosmic-green text-xs font-display">
                    {Math.round(styleProfile.confidence * 100)}% match
                  </span>
                  {styleProfile.secondary_style && (
                    <span className="ml-2 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-xs font-display">
                      Secondary: {styleProfile.secondary_style}
                    </span>
                  )}
                </motion.div>
              )}

              <div className="bg-card rounded-2xl p-6 border border-border w-full text-left space-y-3 mb-6">
                {/* AI description or fallback */}
                <p className="text-sm font-body text-muted-foreground">
                  {styleProfile?.description || t(fb.descKey)}
                </p>

                {/* AI strengths */}
                {styleProfile?.strengths && styleProfile.strengths.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cosmic-green">💪</span>
                      <span className="text-sm font-body font-bold">{t('strength')}:</span>
                    </div>
                    <ul className="text-sm font-body text-muted-foreground space-y-1 pl-7">
                      {styleProfile.strengths.map((s, i) => (
                        <li key={i} className="list-disc">{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-cosmic-green">💪</span>
                    <span className="text-sm font-body"><strong>{t('strength')}:</strong> {t(fb.strengthKey)}</span>
                  </div>
                )}

                {/* AI study tips */}
                {styleProfile?.study_tips && styleProfile.study_tips.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cosmic-cyan">📚</span>
                      <span className="text-sm font-body font-bold">{t('studyTips')}</span>
                    </div>
                    <ul className="text-sm font-body text-muted-foreground space-y-1 pl-7">
                      {styleProfile.study_tips.map((tip, i) => (
                        <li key={i} className="list-disc">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI avoid section */}
                {styleProfile?.avoid && (
                  <div className="flex items-center gap-2">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-sm font-body"><strong>{t('avoid')}:</strong> {styleProfile.avoid}</span>
                  </div>
                )}

                {/* Fallback growth */}
                {!styleProfile && (
                  <div className="flex items-center gap-2">
                    <span className="text-cosmic-gold">🌱</span>
                    <span className="text-sm font-body"><strong>{t('growth')}:</strong> {t(fb.growthKey)}</span>
                  </div>
                )}
              </div>

              <motion.div
                className="flex items-center gap-2 text-cosmic-gold font-display text-lg mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: 2 }}
              >
                ✨ +100 {t('xpEarned')}
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
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
