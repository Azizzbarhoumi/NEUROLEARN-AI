import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, RotateCcw, Target, X, CheckCircle2, XCircle } from 'lucide-react';

interface SlideSummaryProps {
  summary: string;
  keyTakeaway: string;
  onRestart: () => void;
  topic: string;
}

// Simple confetti piece component
function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#7C6FF7', '#60B8FF', '#4ECBA0', '#FFD966', '#FF6B6B'];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random();
  const size = 6 + Math.random() * 6;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: -10,
        width: size,
        height: size,
        background: color,
        borderRadius: index % 2 === 0 ? '50%' : '2px',
        animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

// Quiz options for self-test
const MOCK_OPTIONS = [
  'I understood the key concepts well',
  'I need to review a specific section',
  'I can explain this to someone else',
  'I need more practice problems',
];

export default function SlideSummary({ summary, keyTakeaway, onRestart, topic }: SlideSummaryProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected !== null) setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5 relative overflow-hidden"
    >
      {/* CSS for confetti */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Confetti burst */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Checkmark animation */}
      <div className="flex justify-center pt-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          className="w-20 h-20 rounded-full gradient-cosmic flex items-center justify-center"
          style={{ boxShadow: '0 0 40px rgba(124,111,247,0.4)' }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </motion.div>
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <h2 className="text-2xl font-display font-bold gradient-cosmic-text">
          You crushed it! 🎉
        </h2>
        <p className="text-sm text-muted-foreground font-body mt-1">
          You've completed all slides on "{topic}"
        </p>
      </motion.div>

      {/* Summary glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-2xl p-6"
      >
        <h3 className="font-display text-sm font-bold mb-2">📝 Summary</h3>
        <p className="text-sm font-body leading-relaxed">{summary}</p>
      </motion.div>

      {/* Key takeaway gold box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl p-6 bg-cosmic-gold/10 border-2 border-cosmic-gold/40"
      >
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-cosmic-gold" />
          <h3 className="font-display text-sm font-bold text-cosmic-gold">Key Takeaway</h3>
        </div>
        <p className="text-sm font-body leading-relaxed font-medium">{keyTakeaway}</p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-display text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Replay Slides 🔄
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowQuiz(true)}
          className="flex-1 py-3 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          Test Yourself 🎯
        </motion.button>
      </motion.div>

      {/* Self-quiz modal */}
      {showQuiz && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-2xl p-6 max-w-md w-full relative"
            style={{ background: 'hsl(var(--card) / 0.95)' }}
          >
            <button
              onClick={() => { setShowQuiz(false); setSelected(null); setSubmitted(false); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display text-base font-bold mb-1">🎯 Quick Self-Check</h3>
            <p className="text-sm text-muted-foreground font-body mb-4">
              How well did you understand "{topic}"?
            </p>

            <div className="space-y-2 mb-4">
              {MOCK_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { if (!submitted) setSelected(i); }}
                  className={`w-full text-left p-3 rounded-xl text-sm font-body transition-all border ${
                    selected === i
                      ? submitted
                        ? i === 0 || i === 2
                          ? 'border-green-400 bg-green-400/10'
                          : 'border-cosmic-gold bg-cosmic-gold/10'
                        : 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {submitted && selected === i && (
                      i === 0 || i === 2
                        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-cosmic-gold flex-shrink-0" />
                    )}
                    {opt}
                  </div>
                </button>
              ))}
            </div>

            {!submitted ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={selected === null}
                className="w-full py-2.5 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm disabled:opacity-50"
              >
                Submit
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-sm font-body text-center"
              >
                {selected === 0 || selected === 2
                  ? '🌟 Awesome! You\'re on the right track!'
                  : '💪 No worries — review the slides to strengthen your understanding!'}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
