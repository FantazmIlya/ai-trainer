import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

export const AICoach: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  // Re-initialize or update the first message when language changes
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: '1', text: t('chat.welcome'), sender: 'ai', timestamp: new Date() }
      ]);
    } else if (messages.length === 1 && messages[0].sender === 'ai') {
      // Update the welcome message if it's the only one
      setMessages([
        { id: '1', text: t('chat.welcome'), sender: 'ai', timestamp: new Date() }
      ]);
    }
  }, [i18n.language, t]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Mock AI response
    setTimeout(() => {
      // In a real app, you would send i18n.language to the backend
      // so the AI knows which language to respond in.
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: t('chat.mock_response'),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="pt-24 h-screen flex flex-col bg-apple-gray">
      <div className="container mx-auto px-6 flex-1 flex flex-col max-w-4xl overflow-hidden">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-apple-blue rounded-full flex items-center justify-center text-white">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">{t('chat.title')}</h1>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {t('chat.online')}
              </p>
            </div>
          </div>
          <button className="text-apple-silver hover:text-apple-dark transition-colors">
            <Sparkles size={20} />
          </button>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pb-6 pr-2 custom-scrollbar"
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.sender === 'user' ? 'bg-apple-dark text-white' : 'bg-white shadow-sm text-apple-blue'
                  }`}>
                    {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-apple-blue text-white rounded-tr-none' 
                      : 'bg-white text-apple-dark shadow-sm rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] opacity-50 mt-1 block">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-apple-blue" />
                  <span className="text-sm text-apple-silver">{t('chat.typing')}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="py-6">
          <div className="glass rounded-full p-2 flex items-center gap-2 shadow-lg border border-apple-dark/5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chat.placeholder')}
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-apple-blue text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-[10px] text-apple-silver mt-3">
            {t('chat.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};
