import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser, getApiStyle } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import { getCharacter } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, Send, Loader2, BookOpen, ListOrdered, Presentation, Sparkles, Image } from 'lucide-react';
import { explainTopic, chatFollowup, type ExplainData } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  format?: string;
  richContent?: any;
}

// Slideshow component for chat
function ChatSlideshow({ slides, title, summary, key_takeaway }: { slides: any[]; title?: string; summary?: string; key_takeaway?: string }) {
  const [current, setCurrent] = useState(0);
  if (!slides || slides.length === 0) return null;
  
  const currentSlide = slides[current];
  const goNext = () => setCurrent(c => Math.min(c + 1, slides.length - 1));
  const goPrev = () => setCurrent(c => Math.max(c - 1, 0));
  
  return (
    <div className="rounded-xl overflow-hidden border border-primary/20 bg-card/90">
      <div className="px-4 py-2.5 bg-gradient-to-r from-primary/20 to-transparent border-b border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">👁️</span>
          <span className="text-xs font-display font-semibold text-primary">{title || 'Visual Explanation'}</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{current + 1}/{slides.length}</span>
      </div>
      <div className="p-4">
        <div 
          className="text-sm font-bold text-foreground mb-2 font-display"
          dangerouslySetInnerHTML={{ __html: currentSlide?.title || '' }}
        />
        <div 
          className="text-xs text-muted-foreground leading-relaxed space-y-2"
          dangerouslySetInnerHTML={{ __html: currentSlide?.html_content || currentSlide?.content || '' }}
        />
        {currentSlide?.key_term && (
          <div className="mt-2 inline-block px-2 py-1 rounded-full text-[10px] font-mono bg-primary/10 text-primary">
            🏷️ {currentSlide.key_term}
          </div>
        )}
        {/* Napkin diagram image */}
        {currentSlide?.diagram_image_url && (
          <div className="mt-4 rounded-lg overflow-hidden border border-primary/20">
            <div className="px-3 py-1.5 text-[10px] font-display font-bold uppercase tracking-widest bg-primary/10 text-primary">
              📊 Educational Diagram
            </div>
            <div className="p-3 bg-card/50">
              <img 
                src={currentSlide.diagram_image_url} 
                alt="Diagram" 
                className="w-full rounded-lg"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            onClick={goPrev}
            disabled={current === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          <div className="flex justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-muted hover:bg-muted-foreground/50'}`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            disabled={current === slides.length - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-semibold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
      {(summary || key_takeaway) && (
        <div className="px-4 py-3 border-t border-primary/10 space-y-1">
          {summary && <p className="text-xs text-muted-foreground">📝 {summary}</p>}
          {key_takeaway && <p className="text-xs font-bold text-cosmic-gold">⭐ {key_takeaway}</p>}
        </div>
      )}
    </div>
  );
}

// Steps component for chat
function ChatSteps({ steps, title }: { steps: any[]; title: string }) {
  if (!steps || steps.length === 0) return null;
  
  return (
    <div className="rounded-xl border border-cosmic-cyan/20 bg-card/90 overflow-hidden">
      <div className="px-4 py-2.5 bg-gradient-to-r from-cosmic-cyan/20 to-transparent border-b border-cosmic-cyan/10 flex items-center gap-2">
        <ListOrdered className="w-4 h-4 text-cosmic-cyan" />
        <span className="text-xs font-display font-semibold text-cosmic-cyan">{title}</span>
      </div>
      <div className="p-3 space-y-2">
        {steps.map((step: any, i: number) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-cosmic-cyan/20 flex items-center justify-center text-xs font-bold text-cosmic-cyan flex-shrink-0 border border-cosmic-cyan/30">
              {step.step || i + 1}
            </div>
            <div className="flex-1 bg-cosmic-cyan/5 rounded-lg p-2">
              <div className="text-sm font-bold text-foreground font-display">{step.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{step.content}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Story component for chat
function ChatStory({ data, title }: { data: any; title: string }) {
  if (!data) return null;
  
  return (
    <div className="rounded-xl border border-cosmic-gold/20 bg-card/90 overflow-hidden">
      <div className="px-4 py-2.5 bg-gradient-to-r from-cosmic-gold/20 to-transparent border-b border-cosmic-gold/10 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-cosmic-gold" />
        <span className="text-xs font-display font-semibold text-cosmic-gold">📖 {title}</span>
      </div>
      <div className="p-4 space-y-3">
        {data.hook && (
          <p className="text-sm italic text-cosmic-gold/80 border-l-2 border-cosmic-gold/30 pl-3">"{data.hook}"</p>
        )}
        {data.story && (
          <div className="text-sm text-foreground leading-relaxed bg-cosmic-gold/5 rounded-lg p-3">
            {data.story}
          </div>
        )}
        {data.analogy && (
          <div className="p-3 rounded-lg bg-cosmic-gold/10 border border-cosmic-gold/20">
            <span className="text-xs font-bold text-cosmic-gold">💡 Insight: </span>
            <span className="text-sm text-foreground">{data.analogy}</span>
          </div>
        )}
        {data.explanation && (
          <div className="text-xs text-muted-foreground">
            <span className="font-bold">🧠 Explanation:</span> {data.explanation}
          </div>
        )}
        {data.real_world_connection && (
          <div className="text-xs text-muted-foreground">
            <span className="font-bold">🌍 Real World:</span> {data.real_world_connection}
          </div>
        )}
        {data.key_takeaway && (
          <div className="text-sm font-bold text-cosmic-gold flex items-center gap-2 bg-cosmic-gold/10 rounded-lg p-3">
            <span>⭐</span> {data.key_takeaway}
          </div>
        )}
        {data.practice_question && (
          <div className="text-xs text-muted-foreground border-t border-cosmic-gold/10 pt-2 mt-2">
            <span className="font-bold">❓ Practice:</span> {data.practice_question}
          </div>
        )}
      </div>
    </div>
  );
}

// Diagram component for chat
function ChatDiagram({ description, imageUrl }: { description?: string; imageUrl?: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/90 overflow-hidden">
      {imageUrl && (
        <div className="p-2 bg-card/50">
          <img src={imageUrl} alt="Diagram" className="w-full max-h-56 object-contain rounded-lg" />
        </div>
      )}
      {description && (
        <div className="px-4 py-2 text-xs text-muted-foreground border-t border-primary/10">
          {description}
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, addXP, addTopicExplored } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const char = getCharacter(profile.character);
  const style = getApiStyle(profile.learningStyle);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Redirect if no style profile
  useEffect(() => {
    if (!profile.learningStyle && profile.setupComplete) {
      navigate('/learning-quiz');
    }
  }, [profile.learningStyle]);

  const suggestions = [
    'Explain fractions',
    'Help me with algebra',
    'How does photosynthesis work?',
  ];

  const formatExplainResponse = (data: ExplainData): string => {
    switch (data.format) {
      case 'logical':
        let logical = `📐 **${data.title || 'Topic'}**\n\n${data.introduction || ''}\n\n`;
        data.steps?.forEach(s => {
          logical += `**Step ${s.step}: ${s.title || 'Step'}**\n${s.content || ''}\n`;
          if (s.formula) logical += `\`${s.formula}\`\n`;
          logical += '\n';
        });
        if (data.common_mistakes?.length) {
          logical += '⚠️ **Common Mistakes:**\n';
          data.common_mistakes.forEach(m => {
            logical += `• ${m.mistake || ''} → ${m.correction || ''}\n`;
          });
          logical += '\n';
        }
        logical += `📝 **Summary:** ${data.summary || ''}\n\n❓ **Practice:** ${data.practice_question || ''}`;
        return logical;
      case 'slides':
        // Don't return formatted text for slides - richContent component handles it
        return '';
      case 'narrative':
        return '';
      case 'auditory':
        let aud = `🎧 **${data.title || 'Topic'}**\n\n${data.greeting || ''}\n\n`;
        data.segments?.forEach(s => {
          aud += `**${s.title || 'Segment'}:**\n${s.text || ''}\n\n`;
        });
        if (data.analogy) aud += `💡 **Analogy:** ${data.analogy}\n\n`;
        if (data.memory_trick) aud += `🧠 **Memory Trick:** ${data.memory_trick}\n\n`;
        if (data.encouragement) aud += `${data.encouragement}`;
        return aud;
      default:
        return data.title || '';
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    addXP(5);

    try {
      let responseData: any;
      let responseText: string = '';
      let richContent: any = null;
      let messageFormat: string = 'text';

      if (!currentTopic) {
        // First message = topic → call /api/explain
        setCurrentTopic(text);
        addTopicExplored(text);
        const data = await explainTopic(text, style, 'general');
        messageFormat = data.format;
        richContent = data;
        // Only set responseText for text/auditory, not for rich content formats
        responseText = (data.format === 'text' || data.format === 'auditory') 
          ? formatExplainResponse(data) 
          : '';
      } else {
        // Follow-up → call /api/chat
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: text },
        ];

        const chatData = await chatFollowup(
          currentTopic,
          style,
          text,
          updatedHistory
        );

        // Handle different response formats
        
        if (chatData.format === 'steps') {
          messageFormat = 'steps';
          richContent = chatData;
          responseText = '';
        } else if (chatData.format === 'slides') {
          messageFormat = 'slides';
          // Slides might be in response.slides or directly in chatData
          richContent = chatData.response?.slides ? chatData.response : chatData;
          responseText = '';
        } else if (chatData.format === 'narrative') {
          messageFormat = 'narrative';
          richContent = chatData.response || chatData;
          responseText = '';
        } else if (chatData.format === 'diagram') {
          messageFormat = 'diagram';
          richContent = chatData;
          responseText = '';
        } else if (chatData.format === 'text') {
          messageFormat = 'text';
          responseText = chatData.response || '';
        } else {
          // Default to text response
          messageFormat = 'text';
          responseText = typeof chatData.response === 'object'
            ? JSON.stringify(chatData.response)
            : (chatData.response || '');
        }

        const newHistory = [
          ...updatedHistory,
          { role: 'assistant', content: responseText },
        ];
        setConversationHistory(newHistory);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText,
        format: messageFormat,
        richContent: richContent
      }]);
    } catch (e: any) {
      setError(e.message || t('failedToGetResponse'));
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${t('sorry')}, ${t('couldNotProcess')} ${e.message || t('failedToGetResponse')}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <ParticleBackground />
      <TopControls />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-4 border-b border-border bg-card/80 backdrop-blur">
        <button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <img
          src={getCharacterImage(profile.character)}
          alt={char?.name}
          className="w-8 h-8 rounded-full object-cover"
          width={32}
          height={32}
        />
        <div>
          <h2 className="font-display text-sm font-bold">{t('chatExplain')}</h2>
          <p className="text-xs text-cosmic-gold font-body">+5 XP per question • {style} mode</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto relative z-10 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <motion.img
              src={getCharacterImage(profile.character)}
              alt={char?.name}
              className="w-20 h-20 rounded-full object-cover"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              width={80}
              height={80}
            />
            <p className="text-muted-foreground font-body text-sm">{t('askAnything')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-xs font-body hover:bg-primary/20 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <img src={getCharacterImage(profile.character)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1 border-2 border-primary/20" width={32} height={32} />
            )}
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-body ${
              msg.role === 'user'
                ? 'gradient-cosmic text-primary-foreground whitespace-pre-wrap'
                : 'bg-card/90 border border-border/50 text-foreground overflow-hidden'
            }`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="space-y-3">
                  {/* Show rich content based on format */}
                  {msg.format === 'slides' && msg.richContent?.slides && (
                    <ChatSlideshow 
                      slides={msg.richContent.slides} 
                      title={msg.richContent.title || 'Visual Explanation'}
                      summary={msg.richContent.summary}
                      key_takeaway={msg.richContent.key_takeaway}
                    />
                  )}
                  
                  {msg.format === 'steps' && msg.richContent?.steps && (
                    <ChatSteps steps={msg.richContent.steps} title={msg.richContent.title || 'Steps'} />
                  )}
                  
                  {msg.format === 'narrative' && msg.richContent?.story && (
                    <ChatStory data={msg.richContent} title={msg.richContent.title || 'Story'} />
                  )}
                  
                  {msg.format === 'diagram' && msg.richContent && (
                    <ChatDiagram 
                      description={msg.richContent.description || msg.richContent.text} 
                      imageUrl={msg.richContent.image_url} 
                    />
                  )}
                  
                  {/* Text content - show for text format or when no rich content */}
                  {(msg.format === 'text' || !msg.format || msg.format === 'logical' || msg.format === 'auditory') && msg.content && msg.content.trim() && (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-strong:text-cosmic-gold">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <motion.div className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <img src={getCharacterImage(profile.character)} alt="" className="w-7 h-7 rounded-full object-cover" width={28} height={28} />
            <div className="bg-card border border-border rounded-2xl p-3 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 p-4 border-t border-border bg-card/80 backdrop-blur">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder={currentTopic ? 'Ask a follow-up question...' : t('typeMessage')}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-foreground font-body text-sm border border-border focus:border-primary focus:outline-none transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl gradient-cosmic text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
