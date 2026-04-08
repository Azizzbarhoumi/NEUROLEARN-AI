import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useUser, getApiStyle } from '@/contexts/UserContext';
import { getCharacterImage } from '@/data/characterImages';
import { getCharacter } from '@/data/characters';
import ParticleBackground from '@/components/ParticleBackground';
import { TopControls } from '@/components/TopControls';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { explainTopic, chatFollowup, type ExplainData } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
        let logical = `📐 **${data.title}**\n\n${data.introduction}\n\n`;
        data.steps?.forEach(s => {
          logical += `**Step ${s.step}: ${s.title}**\n${s.content}\n`;
          if (s.formula) logical += `\`${s.formula}\`\n`;
          logical += '\n';
        });
        if (data.common_mistakes?.length) {
          logical += '⚠️ **Common Mistakes:**\n';
          data.common_mistakes.forEach(m => {
            logical += `• ${m.mistake} → ${m.correction}\n`;
          });
          logical += '\n';
        }
        logical += `📝 **Summary:** ${data.summary}\n\n❓ **Practice:** ${data.practice_question}`;
        return logical;
      case 'slides':
        let slides = `👁️ **${data.title}**\n\n`;
        data.slides?.forEach(s => {
          slides += `🎨 **Slide ${s.slide}: ${s.title}**\n${s.content}\n`;
          if (s.visual_hint) slides += `_Draw: ${s.visual_hint}_\n`;
          if (s.key_term) slides += `🏷️ Key: ${s.key_term}\n`;
          slides += '\n';
        });
        slides += `📝 **Summary:** ${data.summary}\n⭐ **Takeaway:** ${data.key_takeaway}`;
        return slides;
      case 'narrative':
        return `📖 **${data.title}**\n\n_"${data.hook}"_\n\n**The Story:**\n${data.story}\n\n💡 **Analogy:**\n${data.analogy}\n\n🧠 **Explanation:**\n${data.explanation}\n\n🌍 **Real World:**\n${data.real_world_connection}\n\n⭐ **Key Takeaway:** ${data.key_takeaway}\n\n❓ **Practice:** ${data.practice_question}`;
      case 'auditory':
        let aud = `🎧 **${data.title}**\n\n${data.greeting}\n\n`;
        data.segments?.forEach(s => {
          aud += `**${s.title}:**\n${s.text}\n\n`;
        });
        if (data.analogy) aud += `💡 **Analogy:** ${data.analogy}\n\n`;
        if (data.memory_trick) aud += `🧠 **Memory Trick:** ${data.memory_trick}\n\n`;
        aud += `${data.encouragement}`;
        return aud;
      default:
        return JSON.stringify(data, null, 2);
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
      let responseText: string;

      if (!currentTopic) {
        // First message = topic → call /api/explain
        setCurrentTopic(text);
        addTopicExplored(text);
        const data = await explainTopic(text, style, 'general');
        responseText = formatExplainResponse(data);

        // Seed conversation history
        const newHistory = [
          { role: 'user', content: text },
          { role: 'assistant', content: responseText },
        ];
        setConversationHistory(newHistory);
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

        responseText = typeof chatData.response === 'object'
          ? JSON.stringify(chatData.response)
          : chatData.response;

        const newHistory = [
          ...updatedHistory,
          { role: 'assistant', content: responseText },
        ];
        setConversationHistory(newHistory);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
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
              <img src={getCharacterImage(profile.character)} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1" width={28} height={28} />
            )}
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-body ${
              msg.role === 'user'
                ? 'gradient-cosmic text-primary-foreground whitespace-pre-wrap'
                : 'bg-card border border-border text-foreground overflow-hidden'
            }`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-strong:text-cosmic-gold">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
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
