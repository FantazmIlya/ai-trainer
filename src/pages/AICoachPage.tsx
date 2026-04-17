import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, Info, History, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AICoachPage = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([{ 
      id: '1', 
      role: 'assistant', 
      content: t('coach.welcome'),
      timestamp: new Date()
    }]);
  }, [i18n.language, t]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulated AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: i18n.language === 'ru' 
          ? "Основываясь на ваших целях, я рекомендую сфокусироваться на технике приседаний. Главное — держать спину прямо и распределять вес на пятки. Хотите, я подберу программу на сегодня?"
          : "Based on your goals, I recommend focusing on your squat technique. The key is to keep your back straight and distribute your weight on your heels. Would you like me to suggest a workout program for today?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="pt-24 max-w-5xl mx-auto px-6 h-[calc(100vh-80px)] flex flex-col pb-6">
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* Sidebar Info - Desktop */}
        <div className="hidden lg:flex flex-col gap-6 w-80">
          <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Sparkles className="text-blue-500" size={20} />
              </div>
              <h3 className="font-bold">AI Coach Pro</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              {t('features.ai_desc')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <History size={14} />
                <span>Recent Topics</span>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                Leg Day Technique
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                Keto Diet Plan
              </button>
            </div>
          </div>

          <div className="p-6 bg-orange-50 rounded-[32px] border border-orange-100">
            <div className="flex items-center gap-3 mb-2 text-orange-600">
              <Info size={18} />
              <h3 className="font-bold text-sm">Safety First</h3>
            </div>
            <p className="text-xs text-orange-700/70 leading-relaxed">
              {t('coach.disclaimer')}
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 bg-white rounded-[40px] border border-gray-100 shadow-xl flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{t('coach.title')}</h2>
                <p className="text-xs text-green-500 font-bold uppercase tracking-widest">{t('coach.active')}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-6 py-4 rounded-[28px] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-2 opacity-40 font-bold uppercase ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-100 px-6 py-4 rounded-[28px] rounded-tl-none flex items-center gap-3 text-gray-400 text-sm shadow-sm">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="font-medium">{t('coach.typing')}</span>
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-50">
            <div className="relative flex items-center gap-3">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('coach.placeholder')}
                  className="w-full pl-6 pr-14 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black/5 transition-all outline-none"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 disabled:opacity-20 disabled:hover:scale-100 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICoachPage;
