import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, Headphones, Play, Pause, Mic, MicOff, Loader2 } from 'lucide-react';
import { explainTopic, chatFollowup, transcribeAudio, type AuditoryData } from '@/lib/api';

const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'CS'];

// Get best voice for language
function getBestVoiceForLanguage(language: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  
  // Map languages to voice language codes
  const voiceLangMap: Record<string, string[]> = {
    en: ['en-US', 'en-GB', 'en-AU', 'en'],
    fr: ['fr-FR', 'fr-CA', 'fr'],
    ar: ['ar-SA', 'ar-AE', 'ar'],
  };
  
  const targetLangs = voiceLangMap[language] || ['en-US', 'en'];
  
  // Try to find exact match
  for (const targetLang of targetLangs) {
    const exactMatch = voices.find(v => v.lang.includes(targetLang));
    if (exactMatch) return exactMatch;
  }
  
  // Fallback to first voice that starts with the language code
  const langCode = language.substring(0, 2);
  const fallback = voices.find(v => v.lang.startsWith(langCode));
  if (fallback) return fallback;
  
  // Default to first available voice
  return voices[0];
}

export default function VoiceMode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, addXP, addTopicExplored } = useUser();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditoryData | null>(null);

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [highlightWord, setHighlightWord] = useState(-1);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [aiReply, setAiReply] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const fetchLesson = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await explainTopic(topic, 'auditory', subject);
      setData(result as AuditoryData);
      addXP(10);
      addTopicExplored(topic);
    } catch (e: any) {
      setError(e.message || t('failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  // Build full text array from data
  const allTexts = useCallback(() => {
    if (!data) return [];
    const texts: string[] = [data.greeting];
    data.segments?.forEach(s => texts.push(`${s.title}. ${s.text}`));
    if (data.analogy) texts.push(`Here's an analogy: ${data.analogy}`);
    if (data.encouragement) texts.push(data.encouragement);
    if (data.check_in) texts.push(data.check_in);
    return texts;
  }, [data]);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    setSpokenText(text);
    const u = new SpeechSynthesisUtterance(text);
    u.rate = speed;
    
    // Get current language and set voice
    const currentLanguage = localStorage.getItem('neurolearn-lang') || 'en';
    const voice = getBestVoiceForLanguage(currentLanguage);
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    
    const words = text.split(' ');
    u.onboundary = (e) => {
      if (e.name === 'word') {
        const charIdx = e.charIndex;
        let wordIdx = 0;
        let count = 0;
        for (let i = 0; i < words.length; i++) {
          if (count >= charIdx) { wordIdx = i; break; }
          count += words[i].length + 1;
        }
        setHighlightWord(wordIdx);
      }
    };
    u.onend = () => { setHighlightWord(-1); onEnd?.(); };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }, [speed]);

  const playAll = useCallback(() => {
    const texts = allTexts();
    if (!texts.length) return;

    const playSegment = (idx: number) => {
      if (idx >= texts.length) {
        setPlaying(false);
        setCurrentSegment(0);
        return;
      }
      setCurrentSegment(idx);
      speakText(texts[idx], () => playSegment(idx + 1));
    };

    setPlaying(true);
    playSegment(currentSegment);
  }, [allTexts, currentSegment, speakText]);

  const togglePlay = () => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    } else {
      playAll();
    }
  };

  useEffect(() => {
    // Ensure voices are loaded before speaking
    window.speechSynthesis.onvoiceschanged = () => {
      // Voices have loaded
    };
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  // Recording
  const toggleRecord = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const transcription = await transcribeAudio(blob, 'question.webm');
          const questionText = transcription.text || '';
          if (!questionText.trim()) {
            setError(t('failedToUnderstand'));
            setTranscribing(false);
            return;
          }
          // Chat with AI
          const chatData = await chatFollowup(topic, 'auditory', questionText, []);
          const reply = typeof chatData.response === 'string' ? chatData.response : JSON.stringify(chatData.response);
          setAiReply(reply);
          speakText(reply);
        } catch (e: any) {
          setError(e.message || 'Failed to process your question.');
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setError('Microphone access denied.');
    }
  };

  const speeds = [0.75, 1, 1.25];
  const texts = allTexts();
  const progress = texts.length > 0 ? ((currentSegment + 1) / texts.length) * 100 : 0;

  if (!data) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-8 nebula-glow">
        <ParticleBackground />
        <TopControls />
        <div className="relative z-10 max-w-xl mx-auto px-4 pt-16">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>
          <div className="flex items-center gap-2 mb-6">
            <Headphones className="w-6 h-6 text-cosmic-gold" />
            <h1 className="text-2xl font-display font-bold gradient-cosmic-text">{t('voiceMode')}</h1>
          </div>
          <div className="space-y-4">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder={t('askLearnByListening')}
              className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground" />
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm font-body text-foreground">
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
            <motion.button whileTap={{ scale: 0.97 }} onClick={fetchLesson} disabled={loading || !topic.trim()} className="w-full py-3 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Headphones className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate Lesson'}
            </motion.button>
            {error && <div className="p-4 rounded-xl bg-destructive/20 border border-destructive text-sm font-body">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-8 nebula-glow">
      <ParticleBackground />
      <TopControls />
      <div className="relative z-10 max-w-xl mx-auto px-4 pt-16">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        {/* Character with sound waves */}
        <div className="flex justify-center mb-6 relative">
          {playing && [1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-primary/30"
              style={{ width: 112 + i * 30, height: 112 + i * 30 }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
          <motion.img
            src={getCharacterImage(profile.character)}
            className="w-28 h-28 rounded-full object-cover glow-primary relative z-10"
            animate={playing ? { opacity: [0.8, 1, 0.8] } : {}}
            transition={{ duration: 0.8, repeat: Infinity }}
            width={112} height={112}
          />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
          <motion.div className="h-full gradient-cosmic rounded-full" animate={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-center gap-1.5 mb-4">
          {texts.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= currentSegment ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="flex gap-1">
            {speeds.map(s => (
              <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 rounded text-xs font-display ${speed === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{s}x</button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={togglePlay} className="p-5 rounded-full gradient-cosmic text-primary-foreground glow-primary">
            {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleRecord}
            className={`p-3 rounded-full ${recording ? 'bg-destructive animate-pulse' : 'bg-secondary'}`}
          >
            {transcribing ? <Loader2 className="w-5 h-5 animate-spin" /> : recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-destructive/20 border border-destructive text-sm font-body mb-4">
            {error}
          </div>
        )}

        {/* Transcript with word highlighting */}
        <div className="glass-card rounded-2xl p-5 space-y-2 max-h-60 overflow-y-auto mb-4">
          {spokenText ? (
            <p className="text-sm font-body leading-relaxed">
              {spokenText.split(' ').map((w, i) => (
                <span key={i} className={`${i === highlightWord ? 'bg-cosmic-gold/30 text-cosmic-gold rounded px-0.5' : ''} transition-colors`}>{w} </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground font-body">{t('pressPlayToStart')}</p>
          )}
        </div>

        {/* AI reply */}
        {aiReply && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 mb-4">
            <p className="text-xs font-display text-cosmic-cyan mb-1">{t('aiResponse')}</p>
            <p className="text-sm font-body">{aiReply}</p>
          </motion.div>
        )}

        {/* Memory trick */}
        {data.memory_trick && (
          <div className="px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-center">
            <span className="text-xs font-display text-primary">🧠 {data.memory_trick}</span>
          </div>
        )}
      </div>
    </div>
  );
}
