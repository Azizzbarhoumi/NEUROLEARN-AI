import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, Shield, Users, Flame } from 'lucide-react';
import '../styles/social-animations.css';

// ─── MOCK DATA ─────────────────────────────────────────────────────

interface Friend {
  id: number;
  name: string;
  emoji: string;
  xp: number;
  topic: string;
  subject: 'Physics' | 'Math' | 'Biology' | 'Chemistry';
  streak: number;
  level: number;
  online: boolean;
}

interface Activity {
  friend: string;
  emoji: string;
  action: string;
  xp: number;
  time: string;
  icon: string;
  type: 'xp' | 'game' | 'pdf' | 'levelup' | 'quiz' | 'badge' | 'visual' | 'boss';
}

interface Achievement {
  icon: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  friend: string;
  new: boolean;
}

const mockFriends: Friend[] = [
  { id: 1, name: 'Naruto', emoji: '🦊', xp: 1240, topic: 'Newton\'s Laws', subject: 'Physics', streak: 5, level: 8, online: true },
  { id: 2, name: 'Pikachu', emoji: '⚡', xp: 980, topic: 'Algebra Basics', subject: 'Math', streak: 3, level: 6, online: true },
  { id: 3, name: 'Totoro', emoji: '🌿', xp: 1550, topic: 'Photosynthesis', subject: 'Biology', streak: 7, level: 10, online: true },
  { id: 4, name: 'Goku', emoji: '🔥', xp: 2100, topic: 'Thermodynamics', subject: 'Physics', streak: 12, level: 14, online: true },
  { id: 5, name: 'Sailor Moon', emoji: '🌙', xp: 870, topic: 'Geometry', subject: 'Math', streak: 2, level: 5, online: false },
  { id: 6, name: 'Luffy', emoji: '⚓', xp: 1430, topic: 'Chemical Bonds', subject: 'Chemistry', streak: 6, level: 9, online: true },
];

const mockActivities: Activity[] = [
  { friend: 'Naruto', emoji: '🦊', action: 'just mastered Newton\'s Laws', xp: 50, time: '2m ago', icon: '⚡', type: 'xp' },
  { friend: 'Pikachu', emoji: '⚡', action: 'completed Game Zone level 3', xp: 40, time: '5m ago', icon: '🎮', type: 'game' },
  { friend: 'Totoro', emoji: '🌿', action: 'converted a Physics PDF', xp: 25, time: '12m ago', icon: '📄', type: 'pdf' },
  { friend: 'Goku', emoji: '🔥', action: 'reached Level 14!', xp: 100, time: '18m ago', icon: '🏆', type: 'levelup' },
  { friend: 'Sailor Moon', emoji: '🌙', action: 'aced the Biology quiz', xp: 60, time: '25m ago', icon: '✅', type: 'quiz' },
  { friend: 'Luffy', emoji: '⚓', action: 'unlocked Epic badge', xp: 80, time: '31m ago', icon: '🎖️', type: 'badge' },
  { friend: 'Naruto', emoji: '🦊', action: 'started a Visual Lab session', xp: 15, time: '40m ago', icon: '👁️', type: 'visual' },
  { friend: 'Goku', emoji: '🔥', action: 'beat the Thermodynamics boss', xp: 120, time: '1h ago', icon: '👾', type: 'boss' },
];

const mockAchievements: Achievement[] = [
  { icon: '🔥', name: 'On Fire', rarity: 'epic', friend: 'Goku', new: true },
  { icon: '🎯', name: 'Perfect Score', rarity: 'legendary', friend: 'Totoro', new: true },
  { icon: '⚡', name: 'Speed Learner', rarity: 'rare', friend: 'Pikachu', new: false },
  { icon: '📚', name: 'Bookworm', rarity: 'common', friend: 'Naruto', new: false },
  { icon: '🌟', name: 'Rising Star', rarity: 'epic', friend: 'Sailor Moon', new: false },
  { icon: '👾', name: 'Boss Slayer', rarity: 'legendary', friend: 'Luffy', new: true },
];

// ─── HELPERS ───────────────────────────────────────────────────────

function getSubjectColor(subject: string): string {
  switch (subject) {
    case 'Physics': return '#60B8FF';
    case 'Math': return '#B366FF';
    case 'Biology': return '#7CF7B5';
    case 'Chemistry': return '#FFB366';
    default: return '#7C6FF7';
  }
}

function getActivityBorderColor(type: string): string {
  switch (type) {
    case 'xp': return '#B366FF';
    case 'game': return '#60B8FF';
    case 'pdf': return '#7CF7B5';
    case 'levelup': return '#FFD700';
    case 'quiz': return '#20C997';
    case 'badge': return '#FF8C8C';
    default: return '#B366FF';
  }
}

function getRarityGlow(rarity: string): string {
  switch (rarity) {
    case 'rare': return 'shadow-[0_0_15px_rgba(96,184,255,0.5)]';
    case 'epic': return 'shadow-[0_0_20px_rgba(179,102,255,0.6)]';
    case 'legendary': return 'shadow-[0_0_25px_rgba(255,215,0,0.7)]';
    default: return '';
  }
}

// ─── COMPONENTS ────────────────────────────────────────────────────

function OrbitDisplay({ friends }: { friends: Friend[] }) {
  const onlineFriends = friends.filter(f => f.online);
  const offlineFriends = friends.filter(f => !f.online);
  const innerOrbit = onlineFriends.slice(0, 3);
  const outerOrbit = onlineFriends.slice(3);

  return (
    <div className="relative w-full h-[420px] flex items-center justify-center">
      {/* Planet Center */}
      <motion.div
        className="absolute w-32 h-32 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #7C6FF7 0%, #B366FF 100%)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-center">
          <p className="text-xs font-display font-bold text-primary-foreground">Study Planet</p>
          <p className="text-2xl font-bold text-primary-foreground">{onlineFriends.length}</p>
        </div>
      </motion.div>

      {/* Inner Orbit Container */}
      <div className="absolute w-96 h-96 rounded-full border-2 border-dashed border-primary/30" />
      <div className="absolute w-96 h-96 orbit-inner">
        {innerOrbit.map((friend, i) => (
          <FriendAvatar
            key={friend.id}
            friend={friend}
            angle={(i / innerOrbit.length) * 360}
          />
        ))}
      </div>

      {/* Outer Orbit Container */}
      <div className="absolute w-[560px] h-[560px] rounded-full border-2 border-dashed border-primary/20" />
      <div className="absolute w-[560px] h-[560px] orbit-outer">
        {outerOrbit.map((friend, i) => (
          <FriendAvatar
            key={friend.id}
            friend={friend}
            angle={(i / outerOrbit.length) * 360}
          />
        ))}
      </div>

      {/* Offline Friends Below */}
      {offlineFriends.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 mt-4">
          {offlineFriends.map(friend => (
            <OfflineFriendAvatar key={friend.id} friend={friend} />
          ))}
        </div>
      )}
    </div>
  );
}

function FriendAvatar({ friend, angle }: { friend: Friend; angle: number }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const radius = angle <= 120 ? 180 : 280;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.div
      className="absolute"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      }}
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
    >
      <motion.div
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer border-3 transition-all"
        style={{ borderColor: getSubjectColor(friend.subject) }}
        whileHover={{ scale: 1.15, zIndex: 50 }}
        animate={{ opacity: 1 }}
      >
        {friend.emoji}
        {friend.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-cosmic-green border-2 border-card" />
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -80 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-50 glass-card rounded-xl p-3 w-max whitespace-nowrap bottom-full mb-2"
            >
              <p className="text-xs font-display font-bold">{friend.name}</p>
              <p className="text-[10px] text-muted-foreground">{friend.xp} XP • Level {friend.level}</p>
              <p className="text-[10px] text-cosmic-cyan mt-1">📚 {friend.topic}</p>
              <p className="text-[10px] text-cosmic-gold">🔥 {friend.streak} streak</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function OfflineFriendAvatar({ friend }: { friend: Friend }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      className="relative w-12 h-12 rounded-full flex items-center justify-center text-xl cursor-pointer border-2 border-muted-foreground/50 opacity-60 transition-all"
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      whileHover={{ opacity: 1 }}
    >
      {friend.emoji}

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -60 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 glass-card rounded-xl p-2 w-max whitespace-nowrap bottom-full mb-2"
          >
            <p className="text-xs font-display font-bold">{friend.name}</p>
            <p className="text-[10px] text-muted-foreground">Offline</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LiveActivityFeed({ activities }: { activities: Activity[] }) {
  const [displayedActivities, setDisplayedActivities] = useState(activities.slice(0, 6));
  const [activityKey, setActivityKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedActivities(prev => {
        const newActivities = [...prev, activities[(activityKey + 1) % activities.length]];
        if (newActivities.length > 6) newActivities.shift();
        setActivityKey(prev => (prev + 1) % activities.length);
        return newActivities;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activityKey, activities]);

  return (
    <div className="space-y-2 max-h-[380px] overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-display">
          <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
          LIVE
        </span>
      </div>

      <AnimatePresence mode="popLayout">
        {displayedActivities.map((activity, i) => (
          <motion.div
            key={`${activity.friend}-${i}-${activity.time}`}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="glass-card rounded-xl p-3 border-l-4"
            style={{ borderColor: getActivityBorderColor(activity.type) }}
          >
            <div className="flex gap-3">
              <span className="text-xl flex-shrink-0">{activity.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-display font-bold truncate">{activity.friend}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                <div className="flex justify-between gap-2 mt-1">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-cosmic-gold/20 text-cosmic-gold text-[10px] font-display">
                    +{activity.xp} XP
                  </span>
                  <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                </div>
              </div>
              <span className="text-2xl flex-shrink-0">{activity.icon}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function XPRaceLeaderboard({ friends }: { friends: Friend[] }) {
  const [leaderboard, setLeaderboard] = useState(friends.sort((a, b) => b.xp - a.xp));
  const [animatingIndices, setAnimatingIndices] = useState(new Set<number>());

  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        const updated = prev.map(f => ({
          ...f,
          xp: f.xp + Math.floor(Math.random() * 40) + 10,
        }));
        const sorted = updated.sort((a, b) => b.xp - a.xp);

        const changing = new Set<number>();
        sorted.forEach((f) => {
          changing.add(f.id);
        });
        setAnimatingIndices(changing);
        setTimeout(() => setAnimatingIndices(new Set()), 600);

        return sorted;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-bold">🏁 Weekly XP Race</h3>
      {leaderboard.slice(0, 3).map((friend, i) => (
        <motion.div
          key={friend.id}
          layout
          transition={{ duration: 0.6, type: 'spring' }}
          className="space-y-1"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{['🥇', '🥈', '🥉'][i]}</span>
            <span className="text-lg">{friend.emoji}</span>
            <div className="flex-1">
              <p className="text-xs font-display font-bold">{friend.name}</p>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #B366FF 0%, #FF1493 50%, #FFD700 100%)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(friend.xp / 2500) * 100}%` }}
                  transition={{
                    duration: 1.2,
                    ease: 'easeOut',
                    delay: i * 0.15,
                  }}
                />
              </div>
            </div>
            <motion.span
              className="text-sm font-display text-cosmic-gold font-bold"
              key={friend.xp}
              initial={{ scale: 1 }}
              animate={{ scale: animatingIndices.has(friend.id) ? 1.2 : 1 }}
            >
              {friend.xp}
            </motion.span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function StreakFlames({ friends }: { friends: Friend[] }) {
  const sorted = friends.sort((a, b) => b.streak - a.streak);
  const topStreaker = sorted[0];

  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-bold flex items-center gap-2">
        <Flame className="w-4 h-4" /> Streak Battle
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sorted.map(friend => (
          <motion.div
            key={friend.id}
            className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl glass-card transition-all ${
              friend.id === topStreaker.id ? 'border-2 border-cosmic-gold' : ''
            }`}
            whileHover={{ y: -8, scale: 1.05 }}
          >
            {friend.id === topStreaker.id && (
              <span className="text-xs font-display text-cosmic-gold font-bold">🏆 Top Streak</span>
            )}

            <div className="relative h-32 flex items-end justify-center">
              {/* Flame */}
              <motion.div
                className="w-6 rounded-t-full bg-gradient-to-t from-orange-600 to-yellow-400 relative"
                style={{
                  height:
                    friend.streak <= 3 ? 60 : friend.streak <= 6 ? 90 : friend.streak <= 10 ? 120 : 160,
                }}
                animate={{
                  opacity: [0.9, 1, 0.9],
                  scaleX: [0.95, 1, 0.95],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {friend.streak}
                </span>
              </motion.div>
            </div>

            <div className="text-center">
              <p className="text-2xl">{friend.emoji}</p>
              <p className="text-xs font-display font-bold mt-1">{friend.name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-bold">🎖️ Recent Achievements</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {achievements.map((badge, i) => (
          <motion.div
            key={i}
            className={`flex-shrink-0 w-24 h-24 rounded-xl glass-card flex flex-col items-center justify-center p-2 text-center transition-all relative ${getRarityGlow(
              badge.rarity
            )}`}
            whileHover={{ y: -8, scale: 1.1 }}
          >
            {badge.new && (
              <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cosmic-gold text-card font-display font-bold">
                NEW
              </span>
            )}
            <span className="text-3xl mb-1">{badge.icon}</span>
            <p className="text-[10px] font-display font-bold truncate">{badge.name}</p>
            <p className="text-[8px] text-muted-foreground truncate">{badge.friend}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StudyMap({ friends }: { friends: Friend[] }) {
  const mapPositions: Record<string, { top: string; left: string }> = {
    Naruto: { top: '35%', left: '72%' },
    Pikachu: { top: '30%', left: '68%' },
    Totoro: { top: '38%', left: '70%' },
    Goku: { top: '32%', left: '74%' },
    'Sailor Moon': { top: '45%', left: '20%' },
    Luffy: { top: '50%', left: '30%' },
  };

  const onlineFriends = friends.filter(f => f.online);

  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="glass-card rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="font-display text-sm font-bold flex items-center gap-2">
          🌍 Global Study Network
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{onlineFriends.length} active learners</p>
      </div>

      <div className="relative w-full h-60 bg-gradient-to-b from-secondary/50 to-card rounded-xl overflow-hidden">
        {/* Simple world map outline */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 960 600">
          <path
            d="M 100 150 L 150 120 L 180 140 L 200 100 L 250 110 L 280 130 L 300 100 L 350 120 L 400 140 L 450 130 L 500 110 L 550 120 L 600 100 L 650 130 L 700 140 L 750 120 L 800 150 L 850 140 L 900 160 Z"
            fill="none"
            stroke="#7C6FF7"
            strokeWidth="2"
          />
          <path
            d="M 120 300 L 180 280 L 200 320 L 250 340 L 300 330 L 350 320 L 400 340 Z"
            fill="none"
            stroke="#7C6FF7"
            strokeWidth="2"
          />
        </svg>

        {/* Friend dots */}
        {onlineFriends.map(friend => (
          <motion.div
            key={friend.id}
            className="absolute group cursor-pointer"
            style={mapPositions[friend.name] || { top: '50%', left: '50%' }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: friend.id * 0.2 }}
          >
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{
                backgroundColor: getSubjectColor(friend.subject),
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  borderColor: getSubjectColor(friend.subject),
                  borderWidth: '1px',
                }}
                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Tooltip */}
            <motion.div
              className="absolute left-full ml-2 glass-card rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
              initial={{ pointerEvents: 'none' }}
            >
              <p className="font-display font-bold">{friend.emoji} {friend.name}</p>
              <p className="text-muted-foreground text-[10px]">{friend.topic}</p>
              <p className="text-cosmic-gold text-[10px]">{friend.xp} XP</p>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ChallengeBattleModal({ isOpen, onClose, friends }: { isOpen: boolean; onClose: () => void; friends: Friend[] }) {
  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [step, setStep] = useState<'select' | 'battle'>('select');

  const handleStartBattle = (topic: string) => {
    if (selectedFriend) {
      navigate('/game-zone', { state: { topic, opponent: selectedFriend.name } });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full mx-4"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>

            {step === 'select' ? (
              <div className="p-8">
                <h2 className="text-2xl font-display font-bold text-center mb-2">⚔️ Challenge Battle</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">Select an opponent</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {friends
                    .filter(f => f.online)
                    .map(friend => (
                      <motion.button
                        key={friend.id}
                        onClick={() => {
                          setSelectedFriend(friend);
                          setStep('battle');
                        }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl glass-card transition-all border-2 hover:border-primary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-3xl">{friend.emoji}</span>
                        <p className="text-xs font-display font-bold">{friend.name}</p>
                        <p className="text-[10px] text-muted-foreground">Lvl {friend.level}</p>
                      </motion.button>
                    ))}
                </div>
              </div>
            ) : (
              <BattleCard
                friend={selectedFriend!}
                onStart={handleStartBattle}
                onBack={() => setStep('select')}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BattleCard({ friend, onStart, onBack }: { friend: Friend; onStart: (topic: string) => void; onBack: () => void }) {
  const [topic, setTopic] = useState(friend.topic);
  const [battleStarting, setBattleStarting] = useState(false);

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        ← Back
      </button>

      {/* Vs Section */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="text-center">
          <p className="text-5xl mb-2">😎</p>
          <p className="text-xs font-display font-bold">YOU</p>
        </div>

        <motion.div
          className="text-2xl font-display font-bold text-destructive"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ⚔️ VS ⚔️
        </motion.div>

        <div className="text-center">
          <p className="text-5xl mb-2">{friend.emoji}</p>
          <p className="text-xs font-display font-bold">{friend.name}</p>
        </div>
      </div>

      {/* Health Bars */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs font-display font-bold mb-2">Your Health</p>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500"
              animate={{ width: '100%' }}
              initial={{ width: 0 }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-display font-bold mb-2">Opponent Health</p>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500"
              animate={{ width: '100%' }}
              initial={{ width: 0 }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Topic Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-display font-bold block mb-2">Choose your battle topic:</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Start Battle Button */}
      <motion.button
        onClick={() => {
          setBattleStarting(true);
          setTimeout(() => onStart(topic), 1500);
        }}
        disabled={battleStarting}
        className="w-full py-3 rounded-lg gradient-cosmic text-primary-foreground font-display font-bold disabled:opacity-50 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {battleStarting ? 'LOADING... 3...2...1...' : '🎮 Start Battle!'}
      </motion.button>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────

export default function Social() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showChallenge, setShowChallenge] = useState(false);
  const [showStudySession, setShowStudySession] = useState(false);

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-12 nebula-glow">
      <ParticleBackground />
      <TopControls />

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 pt-16"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Users className="w-7 h-7 text-cosmic-cyan" />
            <h1 className="text-3xl font-display font-bold gradient-cosmic-text">{t('studyCrew')}</h1>
          </div>

          <div className="flex items-center gap-2 glass-card rounded-xl p-3">
            <Shield className="w-5 h-5 text-cosmic-green flex-shrink-0" />
            <p className="text-xs font-body text-muted-foreground">{t('safeSpaceDesc')}</p>
          </div>
        </motion.div>

        {/* Orbit + Activity Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-card rounded-2xl p-6">
            <OrbitDisplay friends={mockFriends} />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <LiveActivityFeed activities={mockActivities} />
          </div>
        </motion.div>

        {/* Study Map */}
        <motion.div variants={itemVariants} className="mb-8">
          <StudyMap friends={mockFriends} />
        </motion.div>

        {/* Three Column Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <XPRaceLeaderboard friends={mockFriends} />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <StreakFlames friends={mockFriends} />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <AchievementBadges achievements={mockAchievements} />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4">
          <motion.button
            onClick={() => setShowStudySession(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 rounded-xl gradient-cosmic text-primary-foreground font-display font-bold text-lg"
          >
            📚 Study Together
          </motion.button>

          <motion.button
            onClick={() => setShowChallenge(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors font-display font-bold text-lg"
          >
            ⚔️ Challenge Friend
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Study Session Modal */}
      <AnimatePresence>
        {showStudySession && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStudySession(false)}
          >
            <motion.div
              className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-2xl font-display font-bold mb-4">📚 Study Session</h2>
              <p className="text-sm text-muted-foreground mb-6">Share this code with friends to study together:</p>

              <div className="glass-card rounded-xl p-4 mb-6 text-center">
                <p className="text-3xl font-display font-bold tracking-wider">STU-4K2</p>
              </div>

              <motion.button
                onClick={() => {
                  navigator.clipboard.writeText('STU-4K2');
                  setShowStudySession(false);
                }}
                whileHover={{ scale: 1.02 }}
                className="w-full py-2 rounded-lg gradient-cosmic text-primary-foreground font-display font-bold"
              >
                📋 Copy Code
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge Battle Modal */}
      <ChallengeBattleModal isOpen={showChallenge} onClose={() => setShowChallenge(false)} friends={mockFriends} />
    </div>
  );
}
