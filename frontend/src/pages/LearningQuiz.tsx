import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { fetchQuizQuestions, analyzeStyle, QuizQuestion, QuizAnswer } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function LearningQuiz() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addXP, updateProfile } = useUser();
  const [current, setCurrent] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz questions from API on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = await fetchQuizQuestions();
        if (!cancelled) setQuestions(qs);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load quiz questions. Please check your connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleAnswer = async (questionText: string, answerText: string) => {
    if (submitting) return;
    const newAnswers = [...answers, { question: questionText, answer: answerText }];
    setAnswers(newAnswers);
    addXP(20);
    setTotalXP(prev => prev + 20);

    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
    } else {
      // Submit all answers to analyze-style
      setSubmitting(true);
      try {
        const profile = await analyzeStyle(newAnswers);
        // Save full style profile + learning style
        updateProfile({
          learningStyle: profile.style as any,
          styleProfile: profile,
          quizAnswers: [],
        });
        // Store in localStorage for easy access
        localStorage.setItem('neurolearn-style-profile', JSON.stringify(profile));
        setTimeout(() => navigate('/profile-reveal'), 500);
      } catch (e: any) {
        setError(e.message || t('failedToAnalyze'));
        setSubmitting(false);
      }
    }
  };

  const progress = questions.length > 0 ? ((current + 1) / questions.length) * 100 : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <ParticleBackground />
        <TopControls />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-10 h-10 text-primary" />
          </motion.div>
          <p className="text-sm font-body text-muted-foreground">{t('loadingQuiz')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <ParticleBackground />
        <TopControls />
        <div className="relative z-10 max-w-md mx-auto px-4">
          <div className="bg-destructive/10 border border-destructive rounded-2xl p-6 text-center">
            <p className="text-lg font-display mb-2">⚠️ {t('oops')}</p>
            <p className="text-sm font-body text-muted-foreground mb-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm"
            >
              {t('tryAgain')}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <ParticleBackground />
      <TopControls />

      <div className="relative z-10 max-w-xl mx-auto px-4 w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-display gradient-cosmic-text">{t('howLearn')}</h2>
            <motion.span
              className="text-sm font-body text-cosmic-gold"
              key={totalXP}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.3 }}
            >
              +{totalXP} XP
            </motion.span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-cosmic rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-body">{current + 1} / {questions.length}</p>
        </div>

        {/* Submitting overlay */}
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="text-sm font-body text-muted-foreground mt-4">Analyzing your learning style...</p>
          </motion.div>
        )}

        {/* Error during submission */}
        {error && questions.length > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-destructive/20 border border-destructive text-sm font-body">
            {error}
          </div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-card rounded-2xl p-6 border border-border mb-6">
              <p className="text-lg font-body text-foreground">{questions[current]?.question}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {questions[current]?.options.map((option, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(questions[current].question, option)}
                  disabled={submitting}
                  className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 text-left font-body transition-all card-glow disabled:opacity-50"
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
