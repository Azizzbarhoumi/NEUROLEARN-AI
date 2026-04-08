import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import { getCharacter } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import XPBar from '@/components/XPBar';
import { MessageCircle, FlaskConical, Gamepad2, Headphones, Users, TrendingUp, Flame, BookOpen, Target, Trophy, Crown, FileText, Eye, BookMarked } from 'lucide-react';

const styleLabels: Record<string, { key: string; icon: string; strengthKey: string; growthKey: string }> = {
  visual: { key: 'visualLearner', icon: '👁️', strengthKey: 'visualStrength', growthKey: 'visualGrowth' },
  auditory: { key: 'auditoryLearner', icon: '👂', strengthKey: 'auditoryStrength', growthKey: 'auditoryGrowth' },
  kinesthetic: { key: 'kinestheticLearner', icon: '🤸', strengthKey: 'kinestheticStrength', growthKey: 'kinestheticGrowth' },
  reading: { key: 'readingLearner', icon: '📖', strengthKey: 'readingStrength', growthKey: 'readingGrowth' },
  logical: { key: 'logicalLearner', icon: '🧩', strengthKey: 'kinestheticStrength', growthKey: 'kinestheticGrowth' },
  narrative: { key: 'narrativeLearner', icon: '📖', strengthKey: 'readingStrength', growthKey: 'readingGrowth' },
};

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useUser();
  const char = getCharacter(profile.character);
  const sl = styleLabels[profile.learningStyle || 'visual'];

  const featureCards = [
    { icon: MessageCircle, label: t('chatExplain'), sub: '', route: '/chat', color: 'text-cosmic-cyan', xp: '+5 XP' },
    { icon: FlaskConical, label: t('logicLab'), sub: '', route: '/logic-lab', color: 'text-cosmic-green', xp: '+15 XP' },
    { icon: Gamepad2, label: t('gameZone'), sub: '', route: '/game-zone', color: 'text-cosmic-pink', xp: '+20 XP' },
    { icon: Headphones, label: t('voiceMode'), sub: '', route: '/voice-mode', color: 'text-cosmic-gold', xp: '+10 XP' },
    { icon: FileText, label: 'PDF Lab', sub: '', route: '/pdf-lab', color: 'text-cosmic-cyan', xp: '+25 XP' },
    { icon: Eye, label: 'Visual Method', sub: '', route: '/visual-method', color: 'text-cosmic-blue', xp: '+15 XP' },
    { icon: BookMarked, label: 'Story Mode', sub: '', route: '/narrative-method', color: 'text-cosmic-pink', xp: '+15 XP' },
  ];

  const todayPlan = [
    { icon: BookOpen, text: t('learnLesson'), time: '15 ' + t('min'), done: false },
    { icon: Target, text: t('practiceProblems'), time: '10 ' + t('min'), done: false },
    { icon: Trophy, text: t('unlockLevel'), time: '5 ' + t('min'), done: false },
  ];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-8 nebula-glow">
      <ParticleBackground />
      <TopControls />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-4 pt-16 md:pt-12"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* AI Input Bar */}
        <motion.div variants={item} className="mb-6">
          <div className="flex items-center gap-3 glass-card rounded-2xl p-3">
            <motion.img
              src={getCharacterImage(profile.character)}
              alt={char?.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              width={40}
              height={40}
            />
            <button
              onClick={() => navigate('/chat')}
              className="flex-1 text-left px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground font-body text-sm hover:border-primary/30 border border-transparent transition-colors"
            >
              {t('askAnything')}
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 rounded-xl gradient-cosmic text-primary-foreground text-sm font-display"
            >
              ▶ {t('resumeLearning')}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Profile Card */}
          <motion.div variants={item} className="md:col-span-1 glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={getCharacterImage(profile.character)}
                alt={char?.name}
                className="w-14 h-14 rounded-full object-cover"
                loading="lazy"
                width={56}
                height={56}
              />
              <div>
                <h3 className="font-display text-sm font-bold">{char?.name}</h3>
                <p className="text-xs text-muted-foreground font-body">{sl.icon} {t(sl.key)}</p>
              </div>
              {profile.streak > 0 && (
                <div className="ml-auto flex items-center gap-1 text-cosmic-gold">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-display">{profile.streak}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 text-xs font-body">
              <p><span className="text-cosmic-green">💪</span> {t('strength')}: {t(sl.strengthKey)}</p>
              <p><span className="text-cosmic-gold">🌱</span> {t('growth')}: {t(sl.growthKey)}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/character-gallery')}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary text-xs font-display transition-colors"
            >
              <Crown className="w-3.5 h-3.5 text-cosmic-gold" />
              {t('characterGallery') || 'Character Gallery'}
            </motion.button>
          </motion.div>

          {/* XP & Level */}
          <motion.div variants={item} className="md:col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold">{t('level')} {profile.level}</h3>
              <div className="flex gap-2">
                {profile.badges.filter(b => b.earned).slice(0, 3).map(b => (
                  <span key={b.id} className="text-lg" title={b.name}>{b.icon}</span>
                ))}
              </div>
            </div>
            <XPBar current={profile.xp} max={200} level={profile.level} />
            <p className="text-xs text-cosmic-gold mt-2 font-body">+10 XP {t('learnLesson')}</p>
          </motion.div>
        </div>

        {/* Today's Plan */}
        <motion.div variants={item} className="glass-card rounded-2xl p-5 mb-6">
          <h3 className="font-display text-sm font-bold mb-3">📋 {t('todayPlan')}</h3>
          <div className="space-y-2">
            {todayPlan.map((p, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                whileHover={{ x: 5 }}
              >
                <p.icon className="w-4 h-4 text-primary" />
                <span className="flex-1 text-sm font-body">{p.text}</span>
                <span className="text-xs text-muted-foreground">{p.time}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 auto-rows-fr">
          {featureCards.map((card, i) => (
            <motion.button
              key={i}
              variants={item}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(card.route)}
              className="glass-card rounded-2xl p-4 text-left flex flex-col gap-2"
            >
              <card.icon className={`w-6 h-6 ${card.color}`} />
              <span className="font-display text-xs font-bold">{card.label}</span>
              <span className="text-xs text-cosmic-gold font-body">{card.xp}</span>
            </motion.button>
          ))}
        </div>

        {/* Social Card */}
        <motion.button
          variants={item}
          whileHover={{ scale: 1.01 }}
          onClick={() => navigate('/social')}
          className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 mb-6"
        >
          <Users className="w-8 h-8 text-cosmic-cyan" />
          <div className="text-left">
            <h3 className="font-display text-sm font-bold">{t('friendsSpace')}</h3>
            <p className="text-xs text-muted-foreground font-body">3 {t('studyCrew')} {t('online')}</p>
          </div>
        </motion.button>

        {/* Bottom Nav (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border flex justify-around py-2 z-50">
          {[
            { icon: TrendingUp, label: t('progress'), route: '/progress' },
            { icon: MessageCircle, label: t('chatExplain'), route: '/chat' },
            { icon: Gamepad2, label: t('gameZone'), route: '/game-zone' },
            { icon: Users, label: t('social'), route: '/social' },
          ].map((n, i) => (
            <button key={i} onClick={() => navigate(n.route)} className="flex flex-col items-center gap-1 p-1">
              <n.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-body">{n.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
