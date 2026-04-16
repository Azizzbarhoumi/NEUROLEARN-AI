import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/contexts/UserContext';
import { CHARACTERS } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft } from 'lucide-react';
import '../styles/social-animations.css';

// ─── TYPES ────────────────────────────────────────────────────────

type Subject = 'Physics' | 'Math' | 'Biology' | 'Chemistry' | 'CS';

interface FriendData {
  characterKey: string;
  name: string;
  emoji: string;
  xp: number;
  level: number;
  streak: number;
  subject: Subject;
  online: boolean;
  currentTopic: string;
}

interface Fact {
  text: string;
  icon: string;
  bgColor: string;
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────

const SUBJECTS: Subject[] = ['Physics', 'Math', 'Biology', 'Chemistry', 'CS'];
const TOPICS: Record<Subject, string[]> = {
  Physics: ['Newton\'s Laws', 'Thermodynamics', 'Quantum Mechanics', 'Relativity'],
  Math: ['Algebra', 'Calculus', 'Geometry', 'Number Theory'],
  Biology: ['Photosynthesis', 'Cell Biology', 'Evolution', 'Genetics'],
  Chemistry: ['Chemical Bonds', 'Reactions', 'Equilibrium', 'Catalysis'],
  CS: ['Algorithms', 'Data Structures', 'Web Dev', 'Machine Learning'],
};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSubjectColor(subject: Subject): string {
  switch (subject) {
    case 'Physics': return '#60B8FF';
    case 'Math': return '#7C6FF7';
    case 'Biology': return '#4ECBA0';
    case 'Chemistry': return '#FF8C42';
    case 'CS': return '#FF6B6B';
    default: return '#7C6FF7';
  }
}

function buildMockFriends(currentUserKey: string | null): FriendData[] {
  // Find current user character
  const currentUserChar = currentUserKey 
    ? CHARACTERS.find(c => c.key === currentUserKey)
    : CHARACTERS[0];

  if (!currentUserChar) return [];

  // Get remaining characters as friends
  const friendCharacters = CHARACTERS.filter(c => c.key !== currentUserChar.key);

  return friendCharacters.map((char, idx) => {
    const isOnline = idx < 5; // First 5 friends are online
    const subject = getRandom(SUBJECTS);
    
    return {
      characterKey: char.key,
      name: char.name,
      emoji: char.emoji,
      xp: Math.floor(Math.random() * 1900) + 600,
      level: Math.floor(Math.random() * 13) + 3,
      streak: Math.floor(Math.random() * 15) + 1,
      subject,
      online: isOnline,
      currentTopic: getRandom(TOPICS[subject]),
    };
  });
}


// ─── SECTION 1: ACTIVE FRIENDS & CHALLENGE ────────────────────────

interface ChallengeFriendCardProps {
  friend: FriendData;
  onChallenge: (friend: FriendData) => void;
}

function ChallengeFriendCard({ friend, onChallenge }: ChallengeFriendCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: `0 20px 40px rgba(${parseInt(getSubjectColor(friend.subject).slice(1, 3), 16)}, ${parseInt(getSubjectColor(friend.subject).slice(3, 5), 16)}, ${parseInt(getSubjectColor(friend.subject).slice(5, 7), 16)}, 0.3)` }}
      className="glass-card rounded-[20px] p-4 w-[160px] flex flex-col items-center justify-center text-center relative flex-shrink-0 transition-all"
    >
      {/* Online pulse indicator */}
      {friend.online && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cosmic-green"
          animate={{ boxShadow: ['0 0 0 0px rgba(124, 247, 181, 0.7)', '0 0 0 8px rgba(124, 247, 181, 0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Large emoji */}
      <div className="text-[52px] mb-2">{friend.emoji}</div>

      {/* Name */}
      <p className="font-display font-bold text-white text-sm mb-2 truncate w-full">{friend.name}</p>

      {/* Subject pill */}
      <div
        className="px-2 py-1 rounded-full text-[10px] font-display font-bold mb-2 text-white"
        style={{ backgroundColor: `${getSubjectColor(friend.subject)}40` }}
      >
        {friend.subject}
      </div>

      {/* Current topic - italic muted */}
      <p className="text-[10px] italic text-muted-foreground mb-2 truncate w-full">
        {friend.currentTopic}
      </p>

      {/* Streak */}
      <p className="text-[10px] text-cosmic-gold mb-3">🔥 {friend.streak} days</p>

      {/* Challenge button */}
      <motion.button
        onClick={() => onChallenge(friend)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full px-3 py-1 rounded-lg border-2 border-primary/60 text-primary hover:border-primary hover:bg-primary/10 text-[10px] font-display font-bold transition-all"
      >
        ⚔️ Challenge
      </motion.button>
    </motion.div>
  );
}

function ActiveFriendsSection({ friends, onChallenge }: { friends: FriendData[]; onChallenge: (friend: FriendData) => void }) {
  const onlineFriends = friends.filter(f => f.online);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-display font-bold text-white">Online Now 🟢</h2>
          <span className="px-3 py-1 rounded-full bg-cosmic-green/20 text-cosmic-green text-xs font-display font-bold">
            {onlineFriends.length}
          </span>
        </div>
      </div>

      {/* Horizontal scrollable row */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4 min-w-min">
          {onlineFriends.map(friend => (
            <ChallengeFriendCard key={friend.characterKey} friend={friend} onChallenge={onChallenge} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── SECTION 2: WEEKLY LEADERBOARD ────────────────────────────────

interface LeaderboardRowProps {
  rank: number;
  friend: FriendData;
  maxXP: number;
  isCurrentUser: boolean;
  animatingXP?: number;
}

function LeaderboardRow({ rank, friend, maxXP, isCurrentUser, animatingXP }: LeaderboardRowProps) {
  const [displayXP, setDisplayXP] = useState(friend.xp);
  const [showFloatingXP, setShowFloatingXP] = useState(false);
  const xpPercentage = (displayXP / maxXP) * 100;

  useEffect(() => {
    if (animatingXP && animatingXP !== displayXP) {
      setShowFloatingXP(true);
      const duration = 500;
      const start = displayXP;
      const diff = animatingXP - start;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setDisplayXP(Math.floor(start + diff * progress));

        if (progress < 1) requestAnimationFrame(animate);
      };

      animate();
      const timeout = setTimeout(() => setShowFloatingXP(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [animatingXP, displayXP]);

  const getRankBadge = () => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}`;
    }
  };

  return (
    <motion.div
      layout
      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
        isCurrentUser ? 'border-2 border-primary/60 bg-primary/5' : 'bg-secondary/30'
      }`}
    >
      {/* Rank badge */}
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        {rank <= 3 ? (
          <motion.span
            className="text-2xl"
            animate={{ scale: rank === 1 ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getRankBadge()}
          </motion.span>
        ) : (
          <span className="w-6 h-6 rounded-full bg-secondary text-xs font-display font-bold flex items-center justify-center text-muted-foreground">
            {rank}
          </span>
        )}
      </div>

      {/* Character emoji with colored border */}
      <span
        className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg border-2 flex-shrink-0"
        style={{ borderColor: getSubjectColor(friend.subject), backgroundColor: `${getSubjectColor(friend.subject)}20` }}
      >
        {friend.emoji}
      </span>

      {/* Name and YOU tag */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-display font-bold text-white truncate">{friend.name}</span>
        {isCurrentUser && (
          <span className="px-2 py-0.5 rounded-full bg-primary/40 text-primary text-[10px] font-display font-bold flex-shrink-0">
            YOU
          </span>
        )}
      </div>

      {/* XP progress bar */}
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7C6FF7 0%, #FF1493 50%, #FFD700 100%)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: rank * 0.1 }}
          />
        </div>
      </div>

      {/* XP number */}
      <motion.span className="text-sm font-display font-bold text-cosmic-gold flex-shrink-0 w-14 text-right">
        {displayXP}
      </motion.span>

      {/* Floating +XP text */}
      {showFloatingXP && animatingXP && animatingXP > displayXP && (
        <motion.span
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -20 }}
          transition={{ duration: 1 }}
          className="absolute text-sm font-display font-bold text-cosmic-gold pointer-events-none"
        >
          +{animatingXP - displayXP}
        </motion.span>
      )}
    </motion.div>
  );
}

function WeeklyLeaderboardSection({ friends, currentUserKey }: { friends: FriendData[]; currentUserKey: string | null }) {
  // Build full leaderboard including current user
  const currentUserChar = currentUserKey ? CHARACTERS.find(c => c.key === currentUserKey) : CHARACTERS[0];
  const currentUser: FriendData = {
    characterKey: currentUserChar?.key || 'hiro',
    name: currentUserChar?.name || 'You',
    emoji: currentUserChar?.emoji || '⚡',
    xp: 1800,
    level: 12,
    streak: 8,
    subject: 'Math',
    online: true,
    currentTopic: 'Calculus',
  };

  const [leaderboard, setLeaderboard] = useState<(FriendData & { rank: number })[]>([
    { ...currentUser, rank: 3 },
    ...friends.map((f, i) => ({ ...f, rank: i + 2 })).sort((a, b) => b.xp - a.xp).slice(0, 4),
  ].sort((a, b) => b.xp - a.xp).map((f, i) => ({ ...f, rank: i + 1 })));

  const [liveUpdates, setLiveUpdates] = useState<Record<string, number>>({});
  const maxXP = Math.max(...leaderboard.map(f => f.xp)) + 300;

  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        const updated = prev.map(f => {
          if (f.online && Math.random() > 0.5) {
            const newXP = f.xp + Math.floor(Math.random() * 25) + 15;
            setLiveUpdates(old => ({ ...old, [f.characterKey]: newXP }));
            return { ...f, xp: newXP };
          }
          return f;
        });
        return updated.sort((a, b) => b.xp - a.xp).map((f, i) => ({ ...f, rank: i + 1 }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 mb-8"
    >
      <div className="mb-6">
        <h2 className="text-lg font-display font-bold text-white">Weekly XP Race 🏆</h2>
        <p className="text-xs text-muted-foreground mt-1">Resets every Monday</p>
      </div>

      <div className="space-y-2">
        {leaderboard.map((friend) => (
          <LeaderboardRow
            key={friend.characterKey}
            rank={friend.rank}
            friend={friend}
            maxXP={maxXP}
            isCurrentUser={friend.characterKey === currentUserChar?.key}
            animatingXP={liveUpdates[friend.characterKey]}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── SECTION 3: STUDY DASHBOARD ────────────────────────────────────

function YourStandingCard({ currentUserRank, totalFriends }: { currentUserRank: number; totalFriends: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 text-center"
    >
      <h3 className="text-sm font-display font-bold text-muted-foreground mb-4">Your Standing</h3>

      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        className="text-5xl font-display font-bold text-primary mb-2"
      >
        #{currentUserRank}
      </motion.div>

      <p className="text-xs text-muted-foreground mb-4">out of {totalFriends} learners</p>

      <p className="text-sm font-display font-bold text-cosmic-green mb-4">↑ 2 this week</p>

      {/* 7 bars for weekly growth */}
      <div className="flex items-end justify-center gap-1">
        {[45, 60, 35, 80, 50, 70, 65].map((height, i) => (
          <motion.div
            key={i}
            className="w-2 rounded-t-full bg-primary"
            style={{ height: `${height}%` }}
            initial={{ height: 0 }}
            whileInView={{ height: `${height}%` }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function StreakBattleCard({ friends, currentUserKey }: { friends: FriendData[]; currentUserKey: string | null }) {
  const sorted = [...friends].sort((a, b) => b.streak - a.streak).slice(0, 3);
  const currentUserChar = CHARACTERS.find(c => c.key === currentUserKey);
  const currentUserStreak = 8;

  const needsFor1st = sorted[0]?.streak ? Math.max(0, sorted[0].streak - currentUserStreak + 3) : 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-sm font-display font-bold text-white mb-4">Streak Battle</h3>

      <div className="flex items-end justify-center gap-4 h-40">
        {sorted.map((friend, idx) => (
          <div key={friend.characterKey} className="flex flex-col items-center">
            <div className="relative h-24 flex items-end">
              {/* Flame column */}
              <motion.div
                className="w-8 rounded-t-full bg-gradient-to-t from-orange-600 to-yellow-400 relative overflow-hidden"
                style={{ height: `${Math.min((friend.streak * 10), 140)}px` }}
                animate={{
                  opacity: [0.85, 1, 0.85],
                  scaleX: [0.92, 1, 0.92],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold text-white">
                  {friend.streak}
                </span>
              </motion.div>
            </div>

            <p className="text-xl mt-2">{friend.emoji}</p>
            <p className="text-[10px] font-display font-bold mt-1 text-center">{friend.name}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-yellow-400 text-center mt-4">
        You need {needsFor1st} more days to beat {sorted[0]?.name}!
      </p>
    </motion.div>
  );
}

function SubjectBreakdownCard({ friends }: { friends: FriendData[] }) {
  const subjectCounts = SUBJECTS.reduce((acc, subject) => {
    acc[subject] = friends.filter(f => f.subject === subject).length;
    return acc;
  }, {} as Record<Subject, number>);

  const total = Object.values(subjectCounts).reduce((a, b) => a + b, 0);
  let currentAngle = 0;

  const stops = Object.entries(subjectCounts).map(([subject, count]) => {
    const percentage = (count / total) * 100;
    const start = currentAngle;
    const end = (currentAngle += percentage);
    return { subject: subject as Subject, count, percentage, start, end };
  });

  const conicGradient = stops
    .map(s => `${getSubjectColor(s.subject)} ${s.start}% ${s.end}%`)
    .join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-sm font-display font-bold text-white mb-4">Subject Breakdown</h3>

      <div className="flex flex-col items-center">
        <motion.div
          className="w-24 h-24 rounded-full"
          style={{
            background: `conic-gradient(${conicGradient})`,
          }}
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
            rotateZ: [0, 360],
          }}
          transition={{ duration: 1.5 }}
        />

        <div className="mt-4 space-y-1">
          {stops.map(s => (
            <div key={s.subject} className="flex items-center gap-2 text-[10px]">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSubjectColor(s.subject) }}
              />
              <span className="text-muted-foreground">{s.subject}</span>
              <span className="text-white font-display font-bold">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DidYouKnowCard({ friends }: { friends: FriendData[] }) {
  const facts: Fact[] = [
    {
      text: `${friends.sort((a, b) => b.xp - a.xp)[0]?.name} is leading with ${friends.sort((a, b) => b.xp - a.xp)[0]?.xp} XP!`,
      icon: '👑',
      bgColor: 'bg-cosmic-gold/10',
    },
    {
      text: `${friends.sort((a, b) => b.streak - a.streak)[0]?.name} has been studying ${friends.sort((a, b) => b.streak - a.streak)[0]?.streak} days straight!`,
      icon: '🔥',
      bgColor: 'bg-orange-500/10',
    },
    {
      text: `Most popular subject: ${Object.entries(SUBJECTS.reduce((acc, s) => {
        acc[s] = friends.filter(f => f.subject === s).length;
        return acc;
      }, {} as Record<Subject, number>)).sort((a, b) => b[1] - a[1])[0]?.[0]}`,
      icon: '📚',
      bgColor: 'bg-primary/10', },
    {
      text: `Average XP this week: ${Math.round(friends.reduce((a, b) => a + b.xp, 0) / friends.length)}`,
      icon: '📊',
      bgColor: 'bg-cyan-500/10',
    },
    {
      text: `${friends.filter(f => f.online)[0]?.name} is studying right now!`,
      icon: '🌟',
      bgColor: 'bg-green-500/10',
    },
  ];

  const [currentFactIdx, setCurrentFactIdx] = useState(0);
  const fact = facts[currentFactIdx];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIdx(prev => (prev + 1) % facts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-sm font-display font-bold text-white mb-4">Did You Know?</h3>

      <div className="h-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFactIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`text-center ${fact.bgColor} rounded-lg p-4 w-full`}
          >
            <span className="text-2xl block mb-2">{fact.icon}</span>
            <p className="text-xs text-white font-body">{fact.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── CHALLENGE BATTLE MODAL ────────────────────────────────────────

interface BattleModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendData | null;
  currentUser: { emoji: string; name: string; xp: number };
}

function BattleModal({ isOpen, onClose, friend, currentUser }: BattleModalProps) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(friend?.currentTopic || 'Physics');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(friend?.subject || 'Physics');

  const handleStartBattle = () => {
    navigate('/game-zone', { state: { topic, opponent: friend?.name } });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && friend && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-card border border-primary/30 rounded-3xl shadow-2xl w-full max-w-lg mx-4"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="p-8">
              {/* Title */}
              <motion.h2 className="text-3xl font-display font-bold text-center mb-2">
                <span className="text-red-500">⚔️</span> CHALLENGE BATTLE
              </motion.h2>

              {/* VS Section */}
              <div className="flex items-center justify-center gap-6 my-8">
                {/* Current user */}
                <motion.div className="text-center">
                  <motion.div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mx-auto mb-2 border-2 border-primary/60"
                    style={{ background: 'rgba(124, 111, 247, 0.1)' }}
                  >
                    {currentUser.emoji}
                  </motion.div>
                  <p className="text-xs font-display font-bold">YOU</p>
                  <p className="text-xs text-muted-foreground">{currentUser.xp} XP</p>
                </motion.div>

                {/* VS text */}
                <motion.div
                  className="text-3xl font-display font-bold text-red-500"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  VS
                </motion.div>

                {/* Friend */}
                <motion.div className="text-center">
                  <motion.div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mx-auto mb-2 border-2"
                    style={{
                      borderColor: getSubjectColor(friend.subject),
                      background: `${getSubjectColor(friend.subject)}20`,
                    }}
                  >
                    {friend.emoji}
                  </motion.div>
                  <p className="text-xs font-display font-bold">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">{friend.xp} XP</p>
                </motion.div>
              </div>

              {/* Topic input */}
              <div className="mb-6">
                <label className="text-xs font-display font-bold block mb-2">Choose your battle topic:</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Enter topic..."
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-primary/30 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Subject selector */}
              <div className="mb-6">
                <label className="text-xs font-display font-bold block mb-2">Subject:</label>
                <div className="flex gap-2 flex-wrap">
                  {SUBJECTS.map(subj => (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-3 py-1 rounded-lg text-xs font-display font-bold transition-all border-2 ${
                        selectedSubject === subj
                          ? 'border-primary bg-primary/20 text-white'
                          : 'border-primary/30 bg-transparent text-muted-foreground hover:text-white'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-sm font-display font-bold transition-all"
                >
                  Cancel
                </motion.button>

                <motion.button
                  onClick={handleStartBattle}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg gradient-cosmic text-white text-sm font-display font-bold transition-all"
                >
                  🚀 Start Battle!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── STUDY TOGETHER MODAL ──────────────────────────────────────────

interface StudyTogetherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function StudyTogetherModal({ isOpen, onClose }: StudyTogetherModalProps) {
  const [code, setCode] = useState('STU-4K2');
  const [timeLeft, setTimeLeft] = useState(589);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 589));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-card border border-primary/30 rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              ✕
            </button>

            <h2 className="text-2xl font-display font-bold mb-2">📚 Study Together</h2>
            <p className="text-sm text-muted-foreground mb-6">Share this code with friends to study the same topic:</p>

            {/* Code display */}
            <motion.div
              className="glass-card rounded-xl p-5 mb-6 text-center border border-primary/40"
              whileHover={{ borderColor: 'rgba(124, 111, 247, 0.8)' }}
            >
              <p className="text-4xl font-display font-bold tracking-widest text-primary">{code}</p>
            </motion.div>

            {/* Copy button */}
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg gradient-cosmic text-white font-display font-bold mb-4 transition-all"
            >
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </motion.button>

            {/* Expiry countdown */}
            <p className="text-center text-xs text-muted-foreground">
              Expires in {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────

export default function Social() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useUser();
  
  const friends = buildMockFriends(profile.character);
  const currentUserChar = profile.character 
    ? CHARACTERS.find(c => c.key === profile.character)
    : CHARACTERS[0];

  const [selectedFriend, setSelectedFriend] = useState<FriendData | null>(null);
  const [showBattleModal, setShowBattleModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);

  const handleChallenge = (friend: FriendData) => {
    setSelectedFriend(friend);
    setShowBattleModal(true);
  };

  const maxXP = Math.max(...friends.map(f => f.xp), 2500);
  const onlineFriendsCount = friends.filter(f => f.online).length;

  return (
    <div className="min-h-screen relative overflow-hidden pb-12 nebula-glow">
      <ParticleBackground />
      <TopControls />

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 pt-16"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl font-display font-bold gradient-cosmic-text">Study Crew 🪐</h1>
          </div>

          <div className="glass-card rounded-xl p-3 inline-block">
            <p className="text-xs text-muted-foreground">
              Safe space — no personal info, only avatars
            </p>
          </div>
        </motion.div>

        {/* SECTION 1: Active Friends & Challenge */}
        <ActiveFriendsSection friends={friends} onChallenge={handleChallenge} />

        {/* SECTION 2: Weekly Leaderboard */}
        <WeeklyLeaderboardSection friends={friends} currentUserKey={profile.character} />

        {/* SECTION 3: Study Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <YourStandingCard currentUserRank={3} totalFriends={friends.length + 1} />
          <StreakBattleCard friends={friends} currentUserKey={profile.character} />
          <SubjectBreakdownCard friends={friends} />
          <DidYouKnowCard friends={friends} />
        </motion.div>

        {/* Study Together Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 border-2 border-primary/60 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-display font-bold text-white">📚 Start a Group Session</h3>
              <p className="text-xs text-muted-foreground mt-1">Share with your crew to study the same topic together</p>
            </div>
            <motion.button
              onClick={() => setShowStudyModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-lg gradient-cosmic text-white font-display font-bold flex-shrink-0"
            >
              Generate Code
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Battle Modal */}
      <BattleModal
        isOpen={showBattleModal}
        onClose={() => setShowBattleModal(false)}
        friend={selectedFriend}
        currentUser={
          currentUserChar
            ? {
                emoji: currentUserChar.emoji,
                name: currentUserChar.name,
                xp: 1800,
              }
            : { emoji: '⚡', name: 'You', xp: 1800 }
        }
      />

      {/* Study Together Modal */}
      <StudyTogetherModal isOpen={showStudyModal} onClose={() => setShowStudyModal(false)} />
    </div>
  );
}
