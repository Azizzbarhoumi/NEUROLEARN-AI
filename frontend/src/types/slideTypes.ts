/**
 * Visual Slide Types
 * Strict TypeScript interfaces for the visual learning slide system.
 */

export interface Slide {
  slide?: number;
  slide_number?: string;
  title: string;
  content?: string;
  visual_hint?: string;
  key_term?: string;
  color?: 'purple' | 'blue' | 'green' | 'yellow' | 'coral';
  html_content?: string;
  speaker_notes?: string;
  diagram_prompt?: string;
  diagram_image_url?: string;
  diagram_svg?: string;
  diagram_mermaid_code?: string;
}

export interface SlidesData {
  format: 'slides';
  title: string;
  slides: Slide[];
  summary: string;
  key_takeaway: string;
}

export interface ColorConfig {
  accent: string;
  tint: string;
}

export const COLOR_MAP: Record<Slide['color'], ColorConfig> = {
  purple: { accent: '#7C6FF7', tint: 'rgba(124,111,247,0.12)' },
  blue:   { accent: '#60B8FF', tint: 'rgba(96,184,255,0.12)' },
  green:  { accent: '#4ECBA0', tint: 'rgba(78,203,160,0.12)' },
  yellow: { accent: '#FFD966', tint: 'rgba(255,217,102,0.12)' },
  coral:  { accent: '#FF6B6B', tint: 'rgba(255,107,107,0.12)' },
};
