import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ChevronRight, Apple, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const AuthPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth
    login({
      id: '1',
      email: formData.email,
      name: formData.name || 'Alex Johnson',
      role: formData.email.includes('admin') ? 'admin' : 'user'
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gray-50/50">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Illustration & Info */}
        <div className="hidden lg:block space-y-12">
          <div className="space-y-6">
            <h1 className="text-6xl font-extrabold tracking-tighter leading-tight text-gray-900">
              {t('auth.transform')} <br />
              <span className="text-blue-600">{t('auth.journey')}</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-md leading-relaxed">
              {t('auth.join_msg')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <Globe size={20} className="text-green-500" />
              </div>
              <p className="font-bold text-2xl">24/7</p>
              <p className="text-sm text-gray-400 font-medium">{t('auth.ai_support')}</p>
            </div>
            <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Apple size={20} className="text-blue-500" />
              </div>
              <p className="font-bold text-2xl">Pro</p>
              <p className="text-sm text-gray-400 font-medium">{t('auth.integrations')}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 md:p-14 rounded-[48px] shadow-2xl border border-gray-100 w-full max-w-xl mx-auto"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-3">
              {isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h2>
            <p className="text-gray-400">
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-black font-bold hover:underline"
              >
                {isLogin ? t('auth.signUp') : t('auth.signIn')}
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                      type="text"
                      required
                      placeholder={t('auth.name')}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black/5 transition-all outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email"
                required
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black/5 transition-all outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="password"
                required
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black/5 transition-all outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-xl shadow-black/10 active:scale-95"
            >
              {isLogin ? t('auth.signIn') : t('auth.signUp')}
              <ChevronRight size={20} />
            </button>
          </form>

          <div className="mt-10">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative px-4 bg-white text-xs font-bold text-gray-300 uppercase tracking-widest">{t('auth.or_continue')}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors font-medium">
                <Apple size={20} />
                <span>Apple</span>
              </button>
              <button className="flex items-center justify-center gap-3 py-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors font-medium">
                <div className="w-5 h-5 bg-red-500 rounded-full" />
                <span>Google</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
