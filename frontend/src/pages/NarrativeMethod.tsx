import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, BookOpen, Lightbulb, Brain, Globe, Star, Loader2 } from 'lucide-react';
import { explainTopic, type NarrativeData as NData } from '@/lib/api';

const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'CS'];

export default function NarrativeMethod() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addXP, addTopicExplored } = useUser();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NData | null>(null);

  const fetchStory = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await explainTopic(topic, 'narrative', subject);
      setData(result as NData);
      addXP(15);
      addTopicExplored(topic);
    } catch (e: any) {
      setError(e.message || t('failedToGenerateStory'));
    } finally {
      setLoading(false);
    }
  };

  const sectionAnim = (i: number) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: i * 0.1 } });

  return (
    <div className="min-h-screen relative overflow-hidden pb-8 nebula-glow">
      <ParticleBackground />
      <TopControls />
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-16">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-cosmic-pink" />
          <h1 className="text-2xl font-display font-bold gradient-cosmic-text">{t('storyMode')}</h1>
        </div>

        {!data ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('topicStory')}
              className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground" />
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm font-body text-foreground">
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
            <motion.button whileTap={{ scale: 0.97 }} onClick={fetchStory} disabled={loading || !topic.trim()} className="w-full py-3 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Writing story...' : 'Generate Story'}
            </motion.button>
            {error && <div className="p-4 rounded-xl bg-destructive/20 border border-destructive text-sm font-body">{error}</div>}
          </motion.div>
        ) : (
          <div className="space-y-5">
            {/* Hook */}
            <motion.div {...sectionAnim(0)} className="glass-card rounded-2xl p-6 glow-primary">
              <p className="text-lg font-body italic leading-relaxed">"{data.hook}"</p>
            </motion.div>

            {/* Story */}
            <motion.div {...sectionAnim(1)} className="glass-card rounded-2xl p-6" style={{ background: 'hsl(var(--card) / 0.4)' }}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-cosmic-purple" />
                <h3 className="font-display text-sm font-bold">{t('theStory')}</h3>
              </div>
              <p className="text-sm font-body leading-relaxed">{data.story}</p>
            </motion.div>

            {/* Analogy */}
            <motion.div {...sectionAnim(2)} className="rounded-2xl p-6 bg-cosmic-gold/10 border border-cosmic-gold/30">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-cosmic-gold" />
                <h3 className="font-display text-sm font-bold">{t('analogy')}</h3>
              </div>
              <p className="text-sm font-body leading-relaxed">{data.analogy}</p>
            </motion.div>

            {/* Explanation */}
            <motion.div {...sectionAnim(3)} className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-cosmic-cyan" />
                <h3 className="font-display text-sm font-bold">{t('explanation')}</h3>
              </div>
              <p className="text-sm font-body leading-relaxed">{data.explanation}</p>
            </motion.div>

            {/* Real world */}
            <motion.div {...sectionAnim(4)} className="rounded-2xl p-6 bg-cosmic-green/10 border border-cosmic-green/30">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-cosmic-green" />
                <h3 className="font-display text-sm font-bold">{t('realWorldConnection')}</h3>
              </div>
              <p className="text-sm font-body leading-relaxed">{data.real_world_connection}</p>
            </motion.div>

            {/* Key takeaway */}
            <motion.div {...sectionAnim(5)} className="rounded-2xl p-6 bg-cosmic-gold/15 border-2 border-cosmic-gold/40">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-cosmic-gold" />
                <h3 className="font-display text-sm font-bold text-cosmic-gold">{t('keyTakeaway')}</h3>
              </div>
              <p className="text-sm font-body leading-relaxed font-medium">{data.key_takeaway}</p>
            </motion.div>

            {/* Practice */}
            {data.practice_question && (
              <motion.div {...sectionAnim(6)} className="glass-card rounded-2xl p-6 border border-primary/30">
                <h3 className="font-display text-sm font-bold mb-2">🧪 Practice Question</h3>
                <p className="text-sm font-body">{data.practice_question}</p>
              </motion.div>
            )}

            {/* New topic */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => { setData(null); setTopic(''); }}
              className="w-full py-2.5 rounded-xl bg-secondary text-foreground font-display text-sm"
            >
              Generate New Story
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
