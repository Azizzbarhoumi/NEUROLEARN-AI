import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, Rocket, Heart, Skull, Loader2, Trophy, CheckCircle, XCircle, Lightbulb, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { explainTopic, type LogicalData } from '@/lib/api';

const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'CS'];

interface Mission {
  mission_number: number;
  scenario: string;
  question: string;
  options: string[];
  correct: number;
  hint: string;
  is_boss?: boolean;
}

export default function GameZone() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, addXP, earnBadge, addTopicExplored } = useUser();
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [oldScore, setOldScore] = useState(0);
  const [scoreIncreased, setScoreIncreased] = useState(false);
  
  const [lives, setLives] = useState(3);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<'setup' | 'playing' | 'end'>('setup');
  const [totalXP, setTotalXP] = useState(0);

  // New states for the requested animations
  const [streak, setStreak] = useState(0);
  const [shakeStreak, setShakeStreak] = useState(false);
  const [reactionEmoji, setReactionEmoji] = useState<string | null>(null);
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);
  
  // Wrong answer states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [retryPending, setRetryPending] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<{id: number, x: number, y: number, text: string}[]>([]);
  const [lostLifeIndex, setLostLifeIndex] = useState<number | null>(null);

  // Transitions & Progression states
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [nextMissionReady, setNextMissionReady] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // For forcing re-render of countdown
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const triggerParticles = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#7C6FF7', '#FFD966', '#4ECBA0'];
    const particles: any[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 2 + Math.random() * 5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 800
      });
    }

    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let alive = false;
      for (const p of particles) {
        if (elapsed < p.life) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2; // gravity
          p.alpha = 1 - (elapsed / p.life);
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        }
      }
      
      ctx.globalAlpha = 1.0;
      if (alive) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    requestAnimationFrame(animate);
  };

  const startGame = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await explainTopic(topic, 'logical', subject) as LogicalData;
      addTopicExplored(topic);
      let m: Mission[] = [];
      if (data.steps && data.steps.length > 0) {
        m = data.steps.map((s: any, i: number) => {
          let opts = s.options || ['A', 'B', 'C', 'D'];
          let correct = 0;
          
          if (s.options && s.options.length === 4) {
             const arr = s.options.map((opt: string, index: number) => {
                 let isCorrect = index === 0;
                 if (s.correct_answer && typeof s.correct_answer === 'string') {
                    isCorrect = opt === s.correct_answer;
                 }
                 return { text: opt, isCorrect };
             });
             arr.sort(() => Math.random() - 0.5);
             opts = arr.map((x: any) => x.text);
             correct = arr.findIndex((x: any) => x.isCorrect);
             if (correct === -1) correct = 0; // Fallback
          }

          return {
            mission_number: i + 1,
            scenario: s.content || s.title || '',
            question: s.question || (s.title ? `What is the key concept of: ${s.title}?` : `What is the result of step ${i + 1}?`),
            options: opts,
            correct: correct,
            hint: s.formula || 'Think carefully!',
            is_boss: i === data.steps.length - 1,
          };
        });
      }
      if (!m.length) {
        m = [
          { mission_number: 1, scenario: `Let's explore ${topic}!`, question: `What is the fundamental concept of ${topic}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0, hint: 'Think about the basics!' },
          { mission_number: 2, scenario: 'Going deeper...', question: `Which principle applies to ${topic}?`, options: ['Principle 1', 'Principle 2', 'Principle 3', 'Principle 4'], correct: 1, hint: 'Review the core ideas!', is_boss: true },
        ];
      }
      setMissions(m);
      setCurrent(0);
      setScore(0);
      setOldScore(0);
      setLives(3);
      setStreak(0);
      setTotalXP(0);
      setFailedAttempts(0);
      setRetryPending(false);
      setMissionCompleted(false);
      setNextMissionReady(false);
      setPhase('playing');
    } catch (e: any) {
      setError(e.message || t('failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = useCallback((idx: number, e: React.MouseEvent) => {
    if (selected !== null || retryPending || missionCompleted) return;
    setSelected(idx);
    
    const mission = missions[current];
    const isCorrect = idx === mission.correct;

    if (isCorrect) {
      const pts = mission.is_boss ? 50 : 20;
      setOldScore(score);
      setScore(p => p + pts);
      setScoreIncreased(true);
      setTimeout(() => setScoreIncreased(false), 500);

      setTotalXP(p => p + pts);
      addXP(pts);

      const newStreak = streak + 1;
      setStreak(newStreak);

      triggerParticles(e.clientX, e.clientY);

      const msgs = ["Nailed it! +10 XP", "Perfect! Keep going!", "You're on fire!", "Genius move!", "That's correct!"];
      setCelebrationMsg(msgs[Math.floor(Math.random() * msgs.length)]);
      setTimeout(() => setCelebrationMsg(null), 2000);

      let emoji = '🎉';
      if (newStreak >= 5) emoji = '🏆';
      else if (newStreak >= 3) emoji = '🔥';
      setReactionEmoji(emoji);
      setTimeout(() => setReactionEmoji(null), 1500);

      // Lock in mission completed and show next button
      setMissionCompleted(true);
      setNextMissionReady(false);
      setTimerKey(k => k + 1);
      setTimeout(() => setNextMissionReady(true), 1500);
      
    } else {
      setStreak(0);
      setShakeStreak(true);
      setTimeout(() => setShakeStreak(false), 500);

      const newLives = lives - 1;
      setLives(newLives);
      setLostLifeIndex(newLives); 

      // Decrement logic
      setOldScore(score);
      const newScore = Math.max(0, score - 5);
      setScore(newScore);
      setTotalXP(p => Math.max(0, p - 5));
      addXP(-5);
      
      const f_id = Date.now();
      setFloatingTexts(p => [...p, { id: f_id, x: e.clientX, y: e.clientY, text: '-5 XP' }]);
      setTimeout(() => setFloatingTexts(p => p.filter(t => t.id !== f_id)), 1000);

      setFailedAttempts(p => p + 1);
      
      if (newLives <= 0) {
        setTimeout(() => setPhase('end'), 1500);
      } else {
        // Allow user to use next mission button even if wrong (to skip) or try again
        setMissionCompleted(true);
        setNextMissionReady(false);
        setTimerKey(k => k + 1);
        setTimeout(() => setNextMissionReady(true), 1500);
        setRetryPending(true);
      }
    }
  }, [selected, current, missions, lives, score, streak, retryPending, missionCompleted, addXP]);

  const handleRetry = () => {
    setSelected(null);
    setRetryPending(false);
    setMissionCompleted(false);
  };

  const advanceMission = () => {
    if (current < missions.length - 1) {
      setCurrent(p => p + 1);
      setSelected(null);
      setFailedAttempts(0);
      setRetryPending(false);
      setMissionCompleted(false);
    } else {
      setPhase('end');
      earnBadge('quiz-master');
      confetti({ particleCount: 100, spread: 70 });
    }
  };

  if (phase === 'end') {
    if (lives <= 0) {
      return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
          <ParticleBackground />
          <TopControls />
          <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
          <motion.div className="relative z-10 glass-card rounded-3xl p-10 max-w-sm w-full text-center border-red-500/30" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <motion.div 
               className="text-7xl mb-4" 
               animate={{ rotate: [-10, 10, -10, 10, 0] }} 
               transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            >
              💀
            </motion.div>
            <h1 className="text-3xl font-display font-black text-red-500 mb-2 uppercase tracking-widest">{t('gameOver')}</h1>
            <p className="text-lg font-body text-white mb-6">{t('finalScore')}: {score}</p>
            <div className="flex flex-col gap-3">
              <motion.button whileHover={{ scale: 1.05 }} onClick={startGame} className="w-full py-3 rounded-xl gradient-cosmic text-white font-display text-sm">
                {t('tryAgain')} ({topic})
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPhase('setup')} className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-display text-sm border border-red-500/30 transition-colors">
                {t('newTopic')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden nebula-glow">
        <ParticleBackground />
        <TopControls />
        <motion.div className="relative z-10 text-center px-4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.img src={getCharacterImage(profile.character)} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} width={96} height={96} />
          <Trophy className="w-12 h-12 text-cosmic-gold mx-auto mb-3" />
          <h1 className="text-3xl font-display font-bold gradient-cosmic-text mb-2">{t('victory')}</h1>
          <p className="text-lg font-display text-cosmic-gold mb-1">{t('scoreLabel')}: {score}</p>
          <p className="text-sm text-muted-foreground font-body mb-6">+{totalXP} {t('xpEarned')}</p>
          <div className="flex gap-3 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPhase('setup')} className="px-6 py-2.5 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm">{t('playAgain')}</motion.button>
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl bg-secondary text-foreground font-display text-sm">{t('dashboard')}</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <div className="min-h-screen relative overflow-hidden nebula-glow">
        <ParticleBackground />
        <TopControls />
        <div className="relative z-10 max-w-xl mx-auto px-4 pt-16">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>
          <div className="flex items-center gap-2 mb-6">
            <Rocket className="w-6 h-6 text-cosmic-pink" />
            <h1 className="text-2xl font-display font-bold gradient-cosmic-text">{t('gameZone')}</h1>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('whatToMaster')}
              className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground" />
            <div className="grid grid-cols-5 gap-2">
              {subjects.map(s => (
                <button key={s} onClick={() => setSubject(s)} className={`rounded-xl py-2 text-xs font-display transition-all ${subject === s ? 'gradient-cosmic text-primary-foreground' : 'bg-secondary'}`}>{s}</button>
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={startGame} disabled={loading || !topic.trim()} className="w-full py-3 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {loading ? t('generating') : t('startMission')}
            </motion.button>
            {error && <div className="p-4 rounded-xl bg-destructive/20 border border-destructive text-sm font-body">{error}</div>}
          </motion.div>
        </div>
      </div>
    );
  }

  const mission = missions[current];
  
  let activeHint = "";
  if (failedAttempts === 1) {
    activeHint = mission.hint.split('.')[0] + (mission.hint.includes('.') ? '.' : '');
  } else if (failedAttempts >= 2) {
    activeHint = mission.hint;
  }

  return (
    <div className="min-h-screen relative overflow-hidden nebula-glow">
      <ParticleBackground />
      <TopControls />
      <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />
      
      {/* Mission Progress Bar */}
      <div className="absolute top-16 left-0 w-full flex gap-1 px-4 max-w-xl left-1/2 -translate-x-1/2 z-20">
        {missions.map((_, i) => (
          <motion.div 
             key={i} 
             className={`h-1.5 flex-1 rounded-full ${i <= current ? 'bg-primary' : 'bg-white/10'}`}
             animate={i === current ? { scale: [1, 1.2, 1] } : {}}
             transition={{ duration: 0.3 }}
          />
        ))}
      </div>
      
      {/* Floating texts overlay */}
      {floatingTexts.map(f => (
        <motion.div
           key={f.id}
           initial={{ opacity: 1, y: f.y - 20, x: f.x - 20 }}
           animate={{ opacity: 0, y: f.y - 80 }}
           transition={{ duration: 1 }}
           className="fixed z-50 text-red-500 font-display font-bold text-lg drop-shadow-[0_0_10px_rgba(255,0,0,0.5)] pointer-events-none"
        >
          {f.text}
        </motion.div>
      ))}

      {/* Celebration overlay message */}
      <AnimatePresence>
        {celebrationMsg && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 glass-card bg-cosmic-green/20 border border-cosmic-green/50 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(78,203,160,0.3)] pointer-events-none"
          >
            <div className="text-cosmic-green font-display text-lg font-bold">{celebrationMsg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-24">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 relative z-30">
          {/* Animated Scoreboard */}
          <div className="flex items-center gap-2">
            <span className="font-display text-sm tracking-widest uppercase">🏆 Score: </span>
            <div className="relative w-12 h-6 flex items-center">
              <AnimatePresence mode="popLayout">
                <motion.span 
                  key={score}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1, color: scoreIncreased ? '#4ECBA0' : '#ffffff' }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-display text-sm font-bold absolute"
                >
                  {score}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
          
          <AnimatePresence>
            {reactionEmoji && (
              <motion.div
                initial={{ y: -80, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", bounce: 0.6, duration: 0.6 }}
                className="absolute left-1/2 -translate-x-1/2 text-7xl z-50 filter drop-shadow-2xl pointer-events-none"
              >
                {reactionEmoji}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 absolute left-1/2 -translate-x-1/2">
            <span className="font-display text-xs text-muted-foreground uppercase tracking-widest">Mission</span>
            <div className="relative w-4 h-4 flex items-center justify-center">
              <AnimatePresence mode="popLayout">
                <motion.span 
                  key={current}
                  initial={{ rotateX: -90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ transformOrigin: 'bottom' }}
                  className="font-display text-xs font-bold text-primary absolute"
                >
                  {current + 1}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="font-display text-xs text-muted-foreground">/ {missions.length}</span>
          </div>
          
          <motion.div 
            animate={shakeStreak ? { x: [-5, 5, -5, 5, 0] } : {}}
            className={`absolute top-0 right-28 px-3 py-1 rounded-full font-display text-[10px] font-bold tracking-widest uppercase transition-colors shadow-lg ${
              streak >= 5 ? 'bg-cosmic-gold text-yellow-900 border-2 border-yellow-200' :
              streak >= 3 ? 'bg-orange-500 text-white border-2 border-orange-300' :
              'bg-secondary text-primary border border-primary/30'
            }`}
          >
            {streak >= 5 ? `⚡ Unstoppable! ${streak}` : 
             streak >= 3 ? `🔥 On Fire! ${streak}` : 
             `Streak: ${streak}`}
          </motion.div>

          {/* Heart Life System */}
          <div className="flex gap-1 absolute right-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={i === lostLifeIndex ? { scale: [1, 1.3, 0.8, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {i < lives ? (
                  <Heart className="w-5 h-5 text-destructive fill-destructive drop-shadow-[0_0_5px_rgba(255,0,0,0.5)]" />
                ) : (
                  <Heart className="w-5 h-5 text-secondary fill-black/50" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
              <motion.div key={current} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }} transition={{ duration: 0.4, ease: "easeInOut" }}>
                {/* Mission card */}
                <div className={`glass-card rounded-2xl p-5 mb-4 relative z-10 ${mission.is_boss ? 'border-2 border-destructive shadow-[0_0_20px_rgba(255,0,0,0.2)]' : ''}`}>
                  {mission.is_boss && (
                    <div className="flex items-center gap-2 mb-2 text-destructive">
                      <Skull className="w-5 h-5" />
                      <span className="font-display text-xs font-bold animate-pulse">{t('bossChallengeLabel')}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground font-body mb-2">{mission.scenario}</p>
                  <p className="text-lg font-body font-medium">{mission.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-2 relative z-10">
                  {mission.options.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    let cls = 'border-white/10 hover:border-white/20 hover:bg-white/5';
                    
                    let isSelectedCorrect = false;
                    let isDrawnWrong = false;
                    
                    const revealedByHint = retryPending && failedAttempts >= 3 && i === mission.correct;

                    if (selected !== null) {
                      if (i === mission.correct) {
                        cls = 'bg-cosmic-green/20 border-cosmic-green text-white shadow-[0_0_20px_rgba(78,203,160,0.4)]';
                        isSelectedCorrect = true;
                      }
                      else if (i === selected) {
                        cls = 'bg-[#FF6B6B]/30 border-destructive shadow-[0_0_20px_rgba(255,107,107,0.3)] text-white';
                        isDrawnWrong = true;
                      }
                    } else if (revealedByHint) {
                       cls = 'bg-cosmic-green/20 border-cosmic-green text-white shadow-[0_0_20px_rgba(78,203,160,0.4)]';
                    }

                    const opacity = (selected !== null && i !== mission.correct) || (revealedByHint && i !== mission.correct) ? 0.3 : 1;
                    const disabled = selected !== null || retryPending || missionCompleted;

                    return (
                      <motion.button
                        key={i}
                        onClick={(e) => handleAnswer(i, e)}
                        disabled={disabled}
                        style={{ opacity }}
                        className={`w-full p-4 rounded-xl border-2 font-body text-sm text-left transition-all flex items-center gap-3 relative overflow-hidden glass-card ${cls}`}
                        animate={
                          isDrawnWrong ? { x: [-10, 10, -8, 8, -4, 0] } : 
                          isSelectedCorrect && i === selected ? { boxShadow: ['0 0 0px rgba(78,203,160,0)', '0 0 30px rgba(78,203,160,0.8)', '0 0 15px rgba(78,203,160,0.4)'] } : 
                          {}
                        }
                        transition={isDrawnWrong ? { duration: 0.4 } : { duration: 0.6 }}
                      >
                        <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-display text-xs z-10 shrink-0">{letter}</span>
                        <span className="flex-1 z-10">{opt}</span>
                        
                        {(isSelectedCorrect || revealedByHint) && (
                           <CheckCircle className="w-5 h-5 text-cosmic-green shrink-0 z-10" />
                        )}
                        {isDrawnWrong && (
                           <XCircle className="w-5 h-5 text-destructive shrink-0 z-10" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Progressive Hint Reveal */}
                <AnimatePresence>
                  {failedAttempts > 0 && activeHint && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                      animate={{ height: 'auto', opacity: 1, marginTop: 16 }} 
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-[rgba(255,217,102,0.1)] border border-dashed border-[#FFD966] text-sm font-body flex gap-3 shadow-[0_0_15px_rgba(255,217,102,0.05)]">
                        <Lightbulb className="w-5 h-5 text-[#FFD966] shrink-0" />
                        <span className="text-white/90">{activeHint}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Try Again & Next Mission Layout */}
                <AnimatePresence>
                  {missionCompleted && lives > 0 && (
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 20, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="mt-6 flex flex-col gap-3 w-full"
                    >
                      {/* Show Try again if wrong previously and still have lives */}
                      {retryPending && (
                        <motion.button 
                           onClick={handleRetry}
                           animate={{ boxShadow: ['0 0 0px rgba(124,111,247,0)', '0 0 15px rgba(124,111,247,0.4)', '0 0 0px rgba(124,111,247,0)'] }}
                           transition={{ duration: 2, repeat: Infinity }}
                           className="w-full py-4 rounded-xl border border-primary/50 bg-primary/10 text-primary font-display font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors shadow-lg"
                        >
                           <RefreshCw className="w-4 h-4" /> {t('tryAgain')}
                        </motion.button>
                      )}

                      <div className="relative inline-block w-full">
                         <motion.button 
                           animate={nextMissionReady ? { scale: [1, 1.02, 1], boxShadow: ['0 0 0px var(--primary)', '0 0 20px var(--primary)', '0 0 0px var(--primary)'] } : {}}
                           disabled={!nextMissionReady}
                           onClick={advanceMission}
                           className="w-full h-[56px] rounded-xl gradient-cosmic text-white font-display font-black text-sm uppercase tracking-widest disabled:opacity-80 disabled:grayscale-[30%] transition-all overflow-hidden relative flex items-center justify-center gap-3 group hover:brightness-110"
                         >
                           {/* Small circular countdown spinner integrated into the button left of the text */}
                           {!nextMissionReady && (
                             <div className="relative w-6 h-6 flex justify-center items-center">
                               <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                                 <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
                                 <motion.circle 
                                   key={timerKey}
                                   cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="12" 
                                   strokeDasharray="251.2"
                                   initial={{ strokeDashoffset: 0 }}
                                   animate={{ strokeDashoffset: 251.2 }}
                                   transition={{ duration: 1.5, ease: "linear" }}
                                 />
                               </svg>
                             </div>
                           )}

                           <span className="relative z-10 pt-[2px]">
                             {current === missions.length - 1 ? t('claimVictory') : 
                              current === missions.length - 2 ? t('faceTheBoss') : 
                              t('nextMission')}
                           </span>
                         </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
