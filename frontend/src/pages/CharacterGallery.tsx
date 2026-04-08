import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { EVOLVED_CHARACTERS, TIER_LABELS, EvolvedCharacter } from '@/data/characterEvolution';
import { getCharacterImage } from '@/data/characterImages';
import { TopControls } from '@/components/TopControls';
import ParticleBackground from '@/components/ParticleBackground';
import { ArrowLeft, Lock, Crown, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import HeroEvolutionModal from '@/components/HeroEvolutionModal';

export default function CharacterGallery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, updateProfile } = useUser();
  const [previewChar, setPreviewChar] = useState<EvolvedCharacter | null>(null);
  const [showEvolution, setShowEvolution] = useState<EvolvedCharacter | null>(null);

  const isUnlocked = (c: EvolvedCharacter) => profile.level >= c.requiredLevel;
  const isActive = (c: EvolvedCharacter) => {
    if (c.tier === 'base') return profile.character === c.key;
    return profile.activeEvolution === c.key;
  };

  const handleSelect = (c: EvolvedCharacter) => {
    if (!isUnlocked(c)) return;
    if (c.tier === 'base') {
      updateProfile({ character: c.baseCharacter, activeEvolution: null });
    } else {
      updateProfile({ character: c.baseCharacter, activeEvolution: c.key });
      setShowEvolution(c);
    }
  };

  const tiers: Array<{ tier: 'base' | 'ascended' | 'legendary'; icon: React.ReactNode }> = [
    { tier: 'base', icon: <Star className="w-5 h-5" /> },
    { tier: 'ascended', icon: <Sparkles className="w-5 h-5" /> },
    { tier: 'legendary', icon: <Crown className="w-5 h-5" /> },
  ];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative overflow-hidden pb-8 nebula-glow">
      <ParticleBackground />
      <TopControls />

      {showEvolution && (
        <HeroEvolutionModal character={showEvolution} onClose={() => setShowEvolution(null)} />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16">
        <motion.button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 font-body text-sm"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4" /> {t('backToDashboard') || 'Back to Dashboard'}
        </motion.button>

        <motion.h1
          className="font-display text-2xl md:text-3xl font-bold mb-2 gradient-cosmic-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✦ Character Gallery ✦
        </motion.h1>
        <p className="text-muted-foreground font-body text-sm mb-8">
          {t('levelUpToUnlock')} <span className="text-primary font-bold">{profile.level}</span>
        </p>

        {tiers.map(({ tier, icon }) => {
          const chars = EVOLVED_CHARACTERS.filter(c => c.tier === tier);
          const tierInfo = TIER_LABELS[tier];
          return (
            <div key={tier} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                {icon}
                <h2 className="font-display text-lg font-bold">{tierInfo.badge} {tierInfo.label} Heroes</h2>
                {tier !== 'base' && (
                  <span className="text-xs text-muted-foreground font-body ml-2">
                    Requires Level {tier === 'ascended' ? 5 : 10}
                  </span>
                )}
              </div>

              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {chars.map(c => {
                  const unlocked = isUnlocked(c);
                  const active = isActive(c);
                  return (
                    <motion.button
                      key={c.key}
                      variants={item}
                      whileHover={unlocked ? { scale: 1.05, y: -4 } : {}}
                      whileTap={unlocked ? { scale: 0.97 } : {}}
                      onClick={() => unlocked && handleSelect(c)}
                      className={`relative glass-card rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${
                        active ? 'ring-2 ring-primary glow-primary' : ''
                      } ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="relative">
                        {unlocked && (
                          <div
                            className="absolute inset-0 rounded-full blur-xl -z-10"
                            style={{ background: `hsl(${c.glowColor} / 0.3)`, transform: 'scale(1.4)' }}
                          />
                        )}
                        <img
                          src={getCharacterImage(c.baseCharacter)}
                          alt={c.name}
                          className={`w-20 h-20 rounded-full object-cover border-2 ${
                            unlocked ? tierInfo.borderClass : 'border-muted grayscale'
                          }`}
                          loading="lazy"
                        />
                        {!unlocked && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                            <Lock className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        {active && (
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            ✓
                          </motion.div>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="font-display text-xs font-bold">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.emoji}</p>
                        {!unlocked && (
                          <p className="text-[10px] text-cosmic-gold mt-1">🔒 Lvl {c.requiredLevel}</p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
