import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'logical' | 'narrative' | null;
export type CharacterKey = 'hiro' | 'sakura' | 'kai' | 'luna' | 'ren' | 'mika' | 'leo' | 'yuki' | null;

export interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface StyleProfile {
  style: string;
  confidence: number;
  secondary_style: string;
  description: string;
  strengths: string[];
  study_tips: string[];
  avoid: string;
}

export interface UserProfile {
  character: CharacterKey;
  activeEvolution: string | null;
  pinHash: string | null;
  learningStyle: LearningStyle;
  styleProfile: StyleProfile | null;
  xp: number;
  level: number;
  streak: number;
  badges: Badge[];
  completedLessons: string[];
  weeklyXP: number[];
  quizAnswers: number[];
  topicsExplored: string[];
  setupComplete: boolean;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-quest', name: 'First Quest', icon: '🌟', earned: false },
  { id: 'streak-3', name: '3-Day Streak', icon: '🔥', earned: false },
  { id: 'quiz-master', name: 'Quiz Master', icon: '🧠', earned: false },
  { id: 'visual-pro', name: 'Visual Pro', icon: '🎨', earned: false },
  { id: 'logic-hero', name: 'Logic Hero', icon: '🚀', earned: false },
  { id: 'chat-explorer', name: 'Chat Explorer', icon: '💬', earned: false },
];

const defaultProfile: UserProfile = {
  character: null,
  activeEvolution: null,
  pinHash: null,
  learningStyle: null,
  styleProfile: null,
  xp: 0,
  level: 1,
  streak: 0,
  badges: DEFAULT_BADGES,
  completedLessons: [],
  weeklyXP: [0, 0, 0, 0, 0, 0, 0],
  quizAnswers: [],
  topicsExplored: [],
  setupComplete: false,
};

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addXP: (amount: number) => void;
  earnBadge: (id: string) => void;
  addTopicExplored: (topic: string) => void;
  resetProfile: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('neurolearn-profile');
      return saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile;
    } catch { return defaultProfile; }
  });

  useEffect(() => {
    localStorage.setItem('neurolearn-profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const addXP = (amount: number) => {
    setProfile(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 200) + 1;
      const newWeekly = [...prev.weeklyXP];
      const today = new Date().getDay();
      newWeekly[today] = (newWeekly[today] || 0) + amount;
      return { ...prev, xp: newXP, level: newLevel, weeklyXP: newWeekly };
    });
  };

  const earnBadge = (id: string) => {
    setProfile(prev => ({
      ...prev,
      badges: prev.badges.map(b => b.id === id ? { ...b, earned: true, earnedAt: new Date().toISOString() } : b),
    }));
  };

  const addTopicExplored = (topic: string) => {
    setProfile(prev => {
      if (prev.topicsExplored.includes(topic)) return prev;
      return { ...prev, topicsExplored: [...prev.topicsExplored, topic] };
    });
  };

  const resetProfile = () => setProfile(defaultProfile);

  return (
    <UserContext.Provider value={{ profile, updateProfile, addXP, earnBadge, addTopicExplored, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}

/** Map backend style names to API-compatible style string */
export function getApiStyle(learningStyle: LearningStyle): string {
  const map: Record<string, string> = {
    visual: 'visual',
    auditory: 'auditory',
    kinesthetic: 'logical',
    reading: 'logical',
    logical: 'logical',
    narrative: 'narrative',
  };
  return map[learningStyle || 'visual'] || 'visual';
}
