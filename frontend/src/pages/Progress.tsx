import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import XPBar from '@/components/XPBar';
import { ArrowLeft, TrendingUp, Lock, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Progress() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useUser();

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = weekDays.map((day, i) => ({ day, xp: profile.weeklyXP[i] || 0 }));

  const journeyNodes = Array.from({ length: 10 }, (_, i) => ({
    level: i + 1,
    completed: profile.level > i + 1,
    current: profile.level === i + 1,
  }));

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative overflow-hidden pb-8">
      <ParticleBackground />
      <TopControls />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-4 pt-16"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        <motion.div variants={item} className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-cosmic-cyan" />
          <h1 className="text-2xl font-display font-bold gradient-cosmic-text">{t('progress')}</h1>
        </motion.div>

        {/* XP Bar */}
        <motion.div variants={item} className="bg-card rounded-2xl p-5 border border-border mb-6">
          <XPBar current={profile.xp} max={200} level={profile.level} />
        </motion.div>

        {/* Journey Map */}
        <motion.div variants={item} className="bg-card rounded-2xl p-5 border border-border mb-6 overflow-x-auto">
          <h3 className="font-display text-sm font-bold mb-4">{t('journeyMap')}</h3>
          <div className="flex items-center gap-2 min-w-max">
            {journeyNodes.map((node, i) => (
              <div key={i} className="flex items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-display ${
                    node.current
                      ? 'gradient-cosmic text-primary-foreground glow-primary animate-glow-pulse'
                      : node.completed
                      ? 'bg-cosmic-green/20 text-cosmic-green border border-cosmic-green'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {node.completed ? <Check className="w-4 h-4" /> : node.level}
                </motion.div>
                {i < journeyNodes.length - 1 && (
                  <div className={`w-8 h-0.5 ${node.completed ? 'bg-cosmic-green' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly XP Chart */}
        <motion.div variants={item} className="bg-card rounded-2xl p-5 border border-border mb-6">
          <h3 className="font-display text-sm font-bold mb-4">📊 {t('weeklyXP')}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Badges */}
        <motion.div variants={item} className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="font-display text-sm font-bold mb-4">🏆 {t('badges')}</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {profile.badges.map(badge => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.1 }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl ${
                  badge.earned ? 'bg-primary/10' : 'bg-secondary opacity-50'
                }`}
              >
                <span className="text-2xl">{badge.earned ? badge.icon : <Lock className="w-5 h-5 text-muted-foreground" />}</span>
                <span className="text-[10px] font-body text-center">{badge.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
