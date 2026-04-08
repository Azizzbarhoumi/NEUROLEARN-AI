import { CharacterKey } from '@/contexts/UserContext';

export interface CharacterInfo {
  key: CharacterKey;
  name: string;
  emoji: string;
  color: string;
  personality: string;
}

export const CHARACTERS: CharacterInfo[] = [
  { key: 'hiro', name: 'Hiro', emoji: '⚡', color: 'cosmic-blue', personality: 'Brave and curious explorer' },
  { key: 'sakura', name: 'Sakura', emoji: '🌸', color: 'cosmic-pink', personality: 'Creative and imaginative dreamer' },
  { key: 'kai', name: 'Kai', emoji: '🔥', color: 'cosmic-gold', personality: 'Energetic and bold challenger' },
  { key: 'luna', name: 'Luna', emoji: '🌙', color: 'cosmic-purple', personality: 'Wise and thoughtful thinker' },
  { key: 'ren', name: 'Ren', emoji: '🍃', color: 'cosmic-green', personality: 'Calm and steady learner' },
  { key: 'mika', name: 'Mika', emoji: '✨', color: 'cosmic-cyan', personality: 'Quick and clever problem solver' },
  { key: 'leo', name: 'Leo', emoji: '🦁', color: 'cosmic-gold', personality: 'Confident and strong leader' },
  { key: 'yuki', name: 'Yuki', emoji: '❄️', color: 'cosmic-blue', personality: 'Cool and focused strategist' },
];

export function getCharacter(key: CharacterKey): CharacterInfo | undefined {
  return CHARACTERS.find(c => c.key === key);
}
