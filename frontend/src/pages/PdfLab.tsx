import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser, getApiStyle } from '@/contexts/UserContext';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, FileText, Upload, Copy, Check, Loader2, Play, Pause, Headphones, Square } from 'lucide-react';
import { convertPdf } from '@/lib/api';

const methodsConfig = [
  { key: 'logical', icon: '🧩', labelKey: 'logical' },
  { key: 'visual', icon: '👁️', labelKey: 'visual' },
  { key: 'narrative', icon: '📖', labelKey: 'narrative' },
  { key: 'auditory', icon: '🔊', labelKey: 'auditory' },
];

const focusesConfig = ['fullSummary', 'keyConc', 'formulasOnly', 'examplesOnly'];

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

export default function PdfLab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, addXP } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const methods = methodsConfig.map(m => ({ ...m, label: t(m.labelKey) }));
  const focuses = focusesConfig.map(f => t(f));

  const defaultMethod = getApiStyle(profile.learningStyle);
  const [file, setFile] = useState<File | null>(null);
  const [method, setMethod] = useState(defaultMethod);
  const [focus, setFocus] = useState(focuses[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pagesProcessed, setPagesProcessed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(-1);
  const [speed, setSpeed] = useState(1.0);

  const chunks = useMemo(() => {
    if (!result) return [];
    return result.replace(/[#*`_>-]/g, '').split(/\n+/).filter(c => c.trim().length > 0);
  }, [result]);

  const playFromChunk = (startIndex = 0, overrideSpeed = speed) => {
    window.speechSynthesis.cancel();
    setPlaying(true);
    setPaused(false);
    setCurrentChunk(startIndex);

    // Get voice based on current language
    const currentLanguage = localStorage.getItem('neurolearn-lang') || 'en';
    const voice = getBestVoiceForLanguage(currentLanguage);

    for (let i = startIndex; i < chunks.length; i++) {
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.rate = overrideSpeed;
      
      // Set voice and language
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      
      u.onstart = () => setCurrentChunk(i);
      
      if (i === chunks.length - 1) {
        u.onend = () => { setPlaying(false); setPaused(false); setCurrentChunk(-1); };
        u.onerror = () => { setPlaying(false); setPaused(false); setCurrentChunk(-1); };
      }
      window.speechSynthesis.speak(u);
    }
  };

  const togglePause = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else if (playing) {
      window.speechSynthesis.pause();
      setPaused(true);
    } else {
      playFromChunk(currentChunk !== -1 ? currentChunk : 0);
    }
  };

  const stopAudio = () => {
     window.speechSynthesis.cancel();
     setPlaying(false);
     setPaused(false);
     setCurrentChunk(-1);
  };

  const changeSpeed = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (playing && !paused) {
      playFromChunk(currentChunk !== -1 ? currentChunk : 0, newSpeed);
    }
  };

  useEffect(() => {
    // Ensure voices are loaded before speaking
    window.speechSynthesis.onvoiceschanged = () => {
      // Voices have loaded
    };
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') setFile(f);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await convertPdf(file, method, focus);
      setResult(data.converted_content || '');
      setPagesProcessed(data.pages_processed || null);
      addXP(25);
    } catch (e: any) {
      setError(e.message || t('failedToGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen relative overflow-hidden pb-8 nebula-glow">
      <ParticleBackground />
      <TopControls />
      <motion.div className="relative z-10 max-w-2xl mx-auto px-4 pt-16" variants={container} initial="hidden" animate="show">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>

        <motion.div variants={item} className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-cosmic-cyan" />
          <h1 className="text-2xl font-display font-bold gradient-cosmic-text">{t('pdfLabTitle')}</h1>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          variants={item}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`glass-card rounded-2xl p-10 mb-6 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-all ${
            dragOver ? 'border-primary bg-primary/10' : 'border-primary/30'
          }`}
        >
          <Upload className="w-10 h-10 text-primary mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            {file ? file.name : t('dropYourPdf')}
          </p>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        </motion.div>

        {/* Method selector */}
        <motion.div variants={item} className="mb-4">
          <p className="text-xs font-display mb-2 text-muted-foreground">{t('learningMethod')}</p>
          <div className="grid grid-cols-4 gap-2">
            {methods.map(m => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`glass-card rounded-xl p-3 text-center text-sm font-body transition-all ${
                  method === m.key ? 'border-primary glow-primary' : ''
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <p className="text-xs mt-1">{m.label}</p>
                {m.key === defaultMethod && (
                  <span className="text-[10px] text-cosmic-gold">Recommended</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Focus */}
        <motion.div variants={item} className="mb-6">
          <p className="text-xs font-display mb-2 text-muted-foreground">{t('focus')}</p>
          <select
            value={focus}
            onChange={e => setFocus(e.target.value)}
            className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm font-body text-foreground"
          >
            {focuses.map(f => <option key={f}>{f}</option>)}
          </select>
        </motion.div>

        {/* Convert button */}
        <motion.button
          variants={item}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConvert}
          disabled={!file || loading}
          className="w-full py-3 rounded-xl gradient-cosmic text-primary-foreground font-display text-sm disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? t('converting') : t('convertPdf')}
        </motion.button>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 rounded-xl bg-destructive/20 border border-destructive text-sm font-body mb-4">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 relative mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {pagesProcessed && (
                    <span className="text-xs font-display text-muted-foreground">{pagesProcessed} pages processed</span>
                  )}
                  {method === 'auditory' && (
                    <div className="flex items-center gap-2 bg-secondary rounded-lg p-1 border border-border">
                      <button onClick={togglePause} className="p-1.5 rounded-md hover:bg-primary/20 text-primary transition-colors">
                         {playing && !paused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button onClick={stopAudio} className="p-1.5 rounded-md hover:bg-destructive/20 text-destructive transition-colors">
                         <Square className="w-4 h-4 fill-current" />
                      </button>
                      <div className="w-[1px] h-4 bg-border mx-1" />
                      <select 
                        value={speed} 
                        onChange={(e) => changeSpeed(parseFloat(e.target.value))}
                        className="bg-transparent text-xs font-display text-foreground outline-none cursor-pointer pr-1"
                      >
                         <option value={0.75}>0.75x</option>
                         <option value={1}>1x</option>
                         <option value={1.25}>1.25x</option>
                         <option value={1.5}>1.5x</option>
                         <option value={2}>2x</option>
                      </select>
                    </div>
                  )}
                </div>
                <button onClick={copyResult} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-cosmic-green" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              {method !== 'auditory' ? (
                <div className="prose prose-invert prose-sm max-w-none font-body">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col py-4 h-[400px] gap-6">
                  {/* Visualizer Top */}
                  <div className="flex justify-center">
                    <motion.div animate={playing && !paused ? { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 0.5 }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center relative">
                      <Headphones className={`w-8 h-8 ${playing && !paused ? 'text-primary' : 'text-primary/50'} relative z-10`} />
                      {playing && !paused && (
                         <motion.div
                           className="absolute inset-0 rounded-full border border-primary"
                           animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                           transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                         />
                      )}
                    </motion.div>
                  </div>
                  
                  {/* Interactive Subtitles */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                     {chunks.map((chunk, idx) => (
                       <div 
                         key={idx}
                         onClick={() => playFromChunk(idx)}
                         className={`p-4 rounded-xl cursor-pointer transition-all duration-300 font-body text-sm ${
                           idx === currentChunk 
                             ? 'bg-primary/20 border-l-4 border-primary text-white shadow-[0_0_15px_rgba(124,111,247,0.2)]'
                             : 'hover:bg-white/5 text-muted-foreground'
                         }`}
                       >
                         {chunk}
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
