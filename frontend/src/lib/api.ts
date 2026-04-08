/**
 * NeuroLearn API Client
 * Centralized API configuration and typed helper functions.
 */

export const API_BASE = 'http://localhost:5000';

// ── Types ─────────────────────────────────────────────────────

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface QuizAnswer {
  question: string;
  answer: string;
}

export interface StyleProfile {
  style: 'visual' | 'narrative' | 'logical' | 'auditory';
  confidence: number;
  secondary_style: string;
  description: string;
  strengths: string[];
  study_tips: string[];
  avoid: string;
}

export interface LogicalStep {
  step: number;
  title: string;
  content: string;
  formula: string | null;
  question?: string;
  options?: string[];
}

export interface CommonMistake {
  mistake: string;
  correction: string;
}

export interface LogicalData {
  format: 'logical';
  title: string;
  introduction: string;
  steps: LogicalStep[];
  common_mistakes: CommonMistake[];
  summary: string;
  practice_question: string;
}

export interface Slide {
  slide: number;
  title: string;
  content: string;
  visual_hint: string;
  key_term: string;
  color: string;
}

export interface SlidesData {
  format: 'slides';
  title: string;
  slides: Slide[];
  summary: string;
  key_takeaway: string;
}

export interface NarrativeData {
  format: 'narrative';
  title: string;
  hook: string;
  story: string;
  analogy: string;
  explanation: string;
  real_world_connection: string;
  key_takeaway: string;
  practice_question: string;
}

export interface AuditorySegment {
  segment: number;
  title: string;
  text: string;
}

export interface AuditoryData {
  format: 'auditory';
  title: string;
  greeting: string;
  segments: AuditorySegment[];
  analogy: string;
  memory_trick: string;
  check_in: string;
  encouragement: string;
}

export interface InteractiveData {
  format: 'interactive';
  title: string;
  explanation: string;
  canvas_code: string;
  controls: string[];
  key_takeaway: string;
}

export type ExplainData = LogicalData | SlidesData | NarrativeData | AuditoryData | InteractiveData;

export interface ChatResponse {
  question: string;
  response: string;
  style: string;
}

export interface PdfResult {
  success: boolean;
  style: string;
  focus: string;
  pages_processed: number;
  original_length: number;
  converted_content: string;
}

export interface TranscribeResult {
  success: boolean;
  text: string;
}

// ── API Helpers ───────────────────────────────────────────────

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.error || 'Unknown error');
  }
  return json.data as T;
}

function getCurrentLanguage(): string {
  // Get language from localStorage, default to 'en'
  if (typeof window !== 'undefined') {
    return localStorage.getItem('neurolearn-lang') || 'en';
  }
  return 'en';
}

/** GET /api/quiz-questions */
export async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  const language = getCurrentLanguage();
  return apiRequest<QuizQuestion[]>(`/api/quiz-questions?language=${language}`);
}

/** POST /api/analyze-style */
export async function analyzeStyle(answers: QuizAnswer[]): Promise<StyleProfile> {
  const language = getCurrentLanguage();
  return apiRequest<StyleProfile>('/api/analyze-style', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_answers: answers, language }),
  });
}

/** POST /api/explain */
export async function explainTopic(
  topic: string,
  style: string,
  subject: string = 'general'
): Promise<ExplainData> {
  const language = getCurrentLanguage();
  return apiRequest<ExplainData>('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, style, subject, language }),
  });
}

/** POST /api/chat */
export async function chatFollowup(
  topic: string,
  style: string,
  question: string,
  conversation_history: { role: string; content: string }[] = []
): Promise<ChatResponse> {
  const language = getCurrentLanguage();
  return apiRequest<ChatResponse>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, style, question, conversation_history, language }),
  });
}

/** POST /api/convert-pdf — uses raw fetch because FormData */
export async function convertPdf(
  file: File,
  style: string,
  focus: string
): Promise<PdfResult> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('style', style);
  fd.append('focus', focus);
  return apiRequest<PdfResult>('/api/convert-pdf', {
    method: 'POST',
    body: fd,
  });
}

/** POST /api/transcribe — uses raw fetch because FormData */
export async function transcribeAudio(blob: Blob, filename = 'question.webm'): Promise<TranscribeResult> {
  const fd = new FormData();
  fd.append('file', blob, filename);
  return apiRequest<TranscribeResult>('/api/transcribe', {
    method: 'POST',
    body: fd,
  });
}
