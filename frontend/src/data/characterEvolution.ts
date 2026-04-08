import { CharacterKey } from '@/contexts/UserContext';

export interface EvolvedCharacter {
  key: string;
  baseCharacter: CharacterKey;
  name: string;
  emoji: string;
  tier: 'base' | 'ascended' | 'legendary';
  requiredLevel: number;
  color: string;
  personality: string;
  glowColor: string;
}

export const EVOLVED_CHARACTERS: EvolvedCharacter[] = [
  // Base characters (level 1)
  { key: 'hiro', baseCharacter: 'hiro', name: 'Hiro', emoji: '⚡', tier: 'base', requiredLevel: 1, color: 'cosmic-blue', personality: 'Brave explorer', glowColor: '220 90% 60%' },
  { key: 'sakura', baseCharacter: 'sakura', name: 'Sakura', emoji: '🌸', tier: 'base', requiredLevel: 1, color: 'cosmic-pink', personality: 'Creative dreamer', glowColor: '320 80% 60%' },
  { key: 'kai', baseCharacter: 'kai', name: 'Kai', emoji: '🔥', tier: 'base', requiredLevel: 1, color: 'cosmic-gold', personality: 'Bold challenger', glowColor: '45 100% 60%' },
  { key: 'luna', baseCharacter: 'luna', name: 'Luna', emoji: '🌙', tier: 'base', requiredLevel: 1, color: 'cosmic-purple', personality: 'Wise thinker', glowColor: '270 80% 65%' },
  { key: 'ren', baseCharacter: 'ren', name: 'Ren', emoji: '🍃', tier: 'base', requiredLevel: 1, color: 'cosmic-green', personality: 'Steady learner', glowColor: '140 70% 50%' },
  { key: 'mika', baseCharacter: 'mika', name: 'Mika', emoji: '✨', tier: 'base', requiredLevel: 1, color: 'cosmic-cyan', personality: 'Clever solver', glowColor: '190 90% 55%' },
  { key: 'leo', baseCharacter: 'leo', name: 'Leo', emoji: '🦁', tier: 'base', requiredLevel: 1, color: 'cosmic-gold', personality: 'Strong leader', glowColor: '45 100% 60%' },
  { key: 'yuki', baseCharacter: 'yuki', name: 'Yuki', emoji: '❄️', tier: 'base', requiredLevel: 1, color: 'cosmic-blue', personality: 'Focused strategist', glowColor: '220 90% 60%' },

  // Ascended characters (level 5)
  { key: 'golden-hiro', baseCharacter: 'hiro', name: 'Golden Hiro', emoji: '⚡👑', tier: 'ascended', requiredLevel: 5, color: 'cosmic-gold', personality: 'Champion explorer', glowColor: '45 100% 65%' },
  { key: 'cyber-sakura', baseCharacter: 'sakura', name: 'Cyber Sakura', emoji: '🌸💎', tier: 'ascended', requiredLevel: 5, color: 'cosmic-cyan', personality: 'Digital dreamer', glowColor: '190 90% 60%' },
  { key: 'inferno-kai', baseCharacter: 'kai', name: 'Inferno Kai', emoji: '🔥💫', tier: 'ascended', requiredLevel: 5, color: 'cosmic-pink', personality: 'Flame master', glowColor: '0 90% 60%' },
  { key: 'astral-luna', baseCharacter: 'luna', name: 'Astral Luna', emoji: '🌙⭐', tier: 'ascended', requiredLevel: 5, color: 'cosmic-blue', personality: 'Star sage', glowColor: '220 90% 70%' },
  { key: 'storm-ren', baseCharacter: 'ren', name: 'Storm Ren', emoji: '🍃⚡', tier: 'ascended', requiredLevel: 5, color: 'cosmic-cyan', personality: 'Nature force', glowColor: '160 80% 55%' },
  { key: 'prisma-mika', baseCharacter: 'mika', name: 'Prisma Mika', emoji: '✨🔮', tier: 'ascended', requiredLevel: 5, color: 'cosmic-purple', personality: 'Prism genius', glowColor: '280 85% 65%' },
  { key: 'royal-leo', baseCharacter: 'leo', name: 'Royal Leo', emoji: '🦁👑', tier: 'ascended', requiredLevel: 5, color: 'cosmic-gold', personality: 'King of learners', glowColor: '40 100% 55%' },
  { key: 'frost-yuki', baseCharacter: 'yuki', name: 'Frost Yuki', emoji: '❄️💠', tier: 'ascended', requiredLevel: 5, color: 'cosmic-cyan', personality: 'Ice commander', glowColor: '200 90% 65%' },

  // Legendary characters (level 10)
  { key: 'omega-hiro', baseCharacter: 'hiro', name: 'Omega Hiro', emoji: '⚡🌟', tier: 'legendary', requiredLevel: 10, color: 'cosmic-purple', personality: 'Cosmic conqueror', glowColor: '270 90% 70%' },
  { key: 'nova-sakura', baseCharacter: 'sakura', name: 'Nova Sakura', emoji: '🌸🌟', tier: 'legendary', requiredLevel: 10, color: 'cosmic-pink', personality: 'Supernova artist', glowColor: '330 90% 65%' },
  { key: 'phoenix-kai', baseCharacter: 'kai', name: 'Phoenix Kai', emoji: '🔥🌟', tier: 'legendary', requiredLevel: 10, color: 'cosmic-gold', personality: 'Eternal flame', glowColor: '30 100% 60%' },
  { key: 'celestial-luna', baseCharacter: 'luna', name: 'Celestial Luna', emoji: '🌙🌟', tier: 'legendary', requiredLevel: 10, color: 'cosmic-purple', personality: 'Cosmic oracle', glowColor: '260 90% 70%' },
];

export function getAvailableCharacters(level: number): EvolvedCharacter[] {
  return EVOLVED_CHARACTERS.filter(c => c.requiredLevel <= level);
}

export function getLockedCharacters(level: number): EvolvedCharacter[] {
  return EVOLVED_CHARACTERS.filter(c => c.requiredLevel > level);
}

export function getEvolutionsForCharacter(baseKey: CharacterKey): EvolvedCharacter[] {
  return EVOLVED_CHARACTERS.filter(c => c.baseCharacter === baseKey && c.tier !== 'base');
}

export const TIER_LABELS: Record<string, { label: string; badge: string; borderClass: string }> = {
  base: { label: 'Base', badge: '⭐', borderClass: 'border-border' },
  ascended: { label: 'Ascended', badge: '💎', borderClass: 'border-cosmic-cyan' },
  legendary: { label: 'Legendary', badge: '🌟', borderClass: 'border-cosmic-gold' },
};
