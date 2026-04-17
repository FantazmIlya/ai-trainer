import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

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
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message based on language
  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].sender === 'ai')) {
      setMessages([
        { 
          id: 'welcome', 
          text: t('coach.welcome'), 
          sender: 'ai', 
          timestamp: new Date() 
        }
      ]);
    }
  }, [i18n.language, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
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

    try {
      // In a real app, this would be:
      // const response = await fetch('/api/chat', {
      //   method: 'POST',
      //   headers: { 
      //     'Content-Type': 'application/json',
      //     'Accept-Language': i18n.language 
      //   },
      //   body: JSON.stringify({ message: input })
      // });
      
      // Mocking the delay and response language
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: t('coach.mock_response'),
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden mb-6">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">{t('coach.title')}</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-green-600">{t('coach.online')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Sparkles size={18} className="text-blue-500" />
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex w-full",
                msg.sender === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex max-w-[85%] sm:max-w-[70%] items-end gap-2",
                msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                  msg.sender === 'user' ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                )}>
                  {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  msg.sender === 'user' 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                )}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start items-center gap-2 text-gray-400 text-sm italic ml-10"
            >
              <Loader2 size={14} className="animate-spin" />
              {t('coach.typing')}
            </motion.div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-6 py-2 bg-gray-50/50 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-400">
          <AlertCircle size={12} />
          {t('coach.disclaimer')}
        </div>

        {/* Input */}
        <div className="p-4 bg-white/80 backdrop-blur-sm">
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('coach.placeholder')}
              className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-5 pr-14 focus:ring-2 focus:ring-blue-500/20 transition-all text-[15px] outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-30 disabled:hover:bg-black active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
