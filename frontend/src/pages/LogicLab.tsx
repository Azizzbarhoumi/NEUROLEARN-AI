import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, FlaskConical, Loader2, AlertTriangle } from 'lucide-react';
import { explainTopic, type LogicalData } from '@/lib/api';

const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'CS'];

export default function LogicLab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addXP, addTopicExplored } = useUser();
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LogicalData | null>(null);
  const [visibleSteps, setVisibleSteps] = useState(0);

  const handleSolve = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    setData(null);
    setVisibleSteps(0);
    try {
      const result = await explainTopic(input, 'logical', subject);
      setData(result as LogicalData);
      addXP(15);
      addTopicExplored(input);
    } catch (e: any) {
      setError(e.message || t('failedToGenerateSolution'));
    } finally {
      setLoading(false);
    }
  };

  const revealNext = () => {
    if (data && visibleSteps < data.steps.length) {
      setVisibleSteps(prev => prev + 1);
      if (data.steps.length > 0 && visibleSteps + 1 === data.steps.length) {
        addXP(10);
      }
    }
  };

  const stepColors = ['border-cosmic-blue', 'border-cosmic-green', 'border-cosmic-gold', 'border-cosmic-cyan', 'border-cosmic-pink'];

  return (
    <div className="min-h-screen relative overflow-hidden pb-8">
      <ParticleBackground />
      <TopControls />

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-16">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        <div className="flex items-center gap-2 mb-6">
          <FlaskConical className="w-6 h-6 text-cosmic-green" />
          <h1 className="text-2xl font-display font-bold gradient-cosmic-text">{t('logicLab')}</h1>
        </div>

        {/* Input section */}
        <div className="bg-card rounded-2xl p-5 border border-border mb-6">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('enterProblem')}
            className="w-full bg-secondary rounded-xl p-3 font-body text-sm text-foreground resize-none h-20 border border-border focus:border-primary focus:outline-none"
          />
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full mt-2 bg-secondary rounded-xl p-2.5 font-body text-sm text-foreground border border-border"
          >
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSolve}
            disabled={loading || !input.trim()}
            className="mt-3 w-full py-2.5 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Solving...' : t('solve')}
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-destructive/20 border border-destructive text-sm font-body mb-4 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-3">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-primary/30"
            >
              <h2 className="font-display text-sm font-bold gradient-cosmic-text mb-2">{data.title}</h2>
              <p className="text-sm font-body text-muted-foreground">{data.introduction}</p>
            </motion.div>

            {/* Steps timeline */}
            <AnimatePresence>
              {data.steps.slice(0, visibleSteps).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-card rounded-xl p-4 border-l-4 ${stepColors[i % stepColors.length]} border border-border flex gap-3`}
                >
                  {/* Step number circle */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full gradient-cosmic flex items-center justify-center text-xs font-display text-primary-foreground">
                    {step.step || i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-display font-bold block mb-1">{step.title}</span>
                    <p className="text-sm font-body whitespace-pre-wrap">{step.content}</p>
                    {step.formula && (
                      <div className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <code className="text-xs font-mono text-primary">{step.formula}</code>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Reveal / Next */}
            {visibleSteps < data.steps.length ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={revealNext}
                className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-display text-sm border border-border hover:border-primary/50 transition-colors"
              >
                {t('revealStep')} ({visibleSteps}/{data.steps.length})
              </motion.button>
            ) : (
              <div className="space-y-3">
                {/* Common mistakes */}
                {data.common_mistakes && data.common_mistakes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="font-display text-sm font-bold text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Common Mistakes
                    </h3>
                    <div className="space-y-2">
                      {data.common_mistakes.map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-destructive/10 border border-destructive/30">
                          <p className="text-sm font-body"><strong>❌ {m.mistake}</strong></p>
                          <p className="text-sm font-body text-cosmic-green mt-1">✅ {m.correction}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Summary */}
                {data.summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-cosmic-gold/10 border border-cosmic-gold/30"
                  >
                    <h3 className="font-display text-sm font-bold text-cosmic-gold mb-1">📝 Summary</h3>
                    <p className="text-sm font-body">{data.summary}</p>
                  </motion.div>
                )}

                {/* Practice question */}
                {data.practice_question && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl glass-card border border-primary/30"
                  >
                    <h3 className="font-display text-sm font-bold mb-1">🧪 Practice Question</h3>
                    <p className="text-sm font-body">{data.practice_question}</p>
                  </motion.div>
                )}

                {/* Try another */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  onClick={() => { setData(null); setVisibleSteps(0); setInput(''); }}
                  className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-display text-sm"
                >
                  {t('trySimilar')}
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
