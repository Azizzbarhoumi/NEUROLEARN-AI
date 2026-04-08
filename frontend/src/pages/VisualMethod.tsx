import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, Eye, ArrowRight, Loader2, RefreshCw, Zap } from 'lucide-react';
import { explainTopic, type ExplainData } from '@/lib/api';
import VisualSlideShow from '@/components/visual/VisualSlideShow';
import InteractiveCanvas from '@/components/visual/InteractiveCanvas';

const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'CS'];

export default function VisualMethod() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addXP, addTopicExplored } = useUser();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visData, setVisData] = useState<ExplainData | null>(null);
  const [showXPBadge, setShowXPBadge] = useState(false);

  const fetchData = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // We now use visual_interactive for dynamic simulation code
      const data = await explainTopic(topic, 'visual_interactive', subject);
      setVisData(data);
      addXP(25); // Increased XP for interactive lab
      addTopicExplored(topic);
      setShowXPBadge(true);
      setTimeout(() => setShowXPBadge(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('failedToGenerateSimulation');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-8 nebula-glow">
      <ParticleBackground />
      <TopControls />

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-cosmic-cyan/10 border border-cosmic-cyan/20">
            <Eye className="w-8 h-8 text-cosmic-cyan" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black gradient-cosmic-text uppercase tracking-tighter">
              Interactive Visual Lab
            </h1>
            <p className="text-xs text-muted-foreground font-display uppercase tracking-widest mt-1">AI-Powered Simulation Engine</p>
          </div>
        </div>

        {/* XP Badge */}
        <AnimatePresence>
          {showXPBadge && (
            <motion.div
              initial={{ scale: 0, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="fixed top-20 right-6 z-50 px-5 py-2.5 rounded-full gradient-cosmic text-primary-foreground font-display text-sm flex items-center gap-2"
              style={{ boxShadow: '0 0 40px rgba(124,111,247,0.6)' }}
            >
              <Zap className="w-4 h-4 fill-current" />
              +25 XP EARNED
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── INPUT SCREEN ─── */}
        {!visData && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="text-6xl mb-6 filter drop-shadow-lg">🔬</div>
              <h2 className="text-2xl font-display font-black mb-3 text-white uppercase tracking-tight">{t('generateInteractiveLab')}</h2>
              <p className="text-sm text-muted-foreground font-body mb-8 max-w-sm mx-auto leading-relaxed">
                Describe a concept, and our AI will code a real-time interactive simulation just for you.
              </p>

              {/* Topic input with floating label */}
              <div className="relative mb-8 max-w-md mx-auto">
                <input
                  id="topic-input"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') fetchData(); }}
                  placeholder={t('gravityPlanets')}
                  className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-sm font-body text-white focus:border-primary/50 focus:bg-white/10 focus:outline-none transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Subject pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {subjects.map(s => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-display font-black uppercase tracking-widest transition-all ${
                      subject === s
                        ? 'gradient-cosmic text-primary-foreground scale-105 shadow-lg shadow-primary/20'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchData}
                disabled={!topic.trim()}
                className="w-full max-w-sm py-4 rounded-2xl gradient-cosmic text-primary-foreground font-display font-black text-sm uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
              >
                Launch Simulation
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Error inline */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-display uppercase font-bold tracking-tight"
                >
                  ⚠️ Engineering Alert: {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── LOADING SKELETON ─── */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-3xl p-8 aspect-video flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-cosmic-cyan/10 border-t-cosmic-cyan rounded-full animate-spin" />
                <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-cosmic-cyan animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-white uppercase">{t('initializingSandbox')}</h3>
                <p className="text-sm text-muted-foreground font-body max-w-xs transition-opacity duration-1000">
                  AI is currently writing the physics engine and animation logic for "{topic}"...
                </p>
              </div>
              <div className="flex gap-2">
                <div className="h-1.5 w-12 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="h-1.5 w-12 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="h-1.5 w-12 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── SIMULATION VIEW ─── */}
        {visData && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {visData.format === 'interactive' ? (
              <InteractiveCanvas 
                code={visData.canvas_code}
                title={visData.title}
                explanation={visData.explanation}
                keyTakeaway={visData.key_takeaway}
              />
            ) : (
              // Fallback to slides if needed, though we request interactive
              visData.format === 'slides' && <VisualSlideShow data={visData as any} topic={topic} />
            )}

            {/* Controls Footer */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setVisData(null); setTopic(''); setError(null); }}
                className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display font-black text-sm uppercase tracking-widest transition-all"
              >
                Reset Workshop
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={fetchData}
                className="flex-1 py-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-display font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refine Logic
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
