import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-20">
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-6 inline-block">
            {t('hero.badge')}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-8">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link 
              to="/coach" 
              className="px-8 py-4 bg-black text-white rounded-full font-medium transition-all duration-300 flex items-center gap-2 hover:bg-gray-800 shadow-xl hover:shadow-black/20"
            >
              {t('hero.cta')} <ChevronRight size={20} />
            </Link>
            <Link 
              to="/auth" 
              className="px-8 py-4 bg-white text-black border border-gray-200 rounded-full font-medium transition-all duration-300 hover:bg-gray-50"
            >
              {t('pricing.buy')}
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {[
            { 
              icon: <Zap className="text-orange-500" />, 
              title: t('features.ai'), 
              desc: t('features.ai_desc') 
            },
            { 
              icon: <TrendingUp className="text-green-500" />, 
              title: t('features.tracking'), 
              desc: t('features.tracking_desc') 
            },
            { 
              icon: <ShieldCheck className="text-blue-500" />, 
              title: t('features.workouts'), 
              desc: t('features.workouts_desc') 
            }
          ].map((item, i) => (
            <div 
              key={i} 
              className="p-8 text-left bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-[24px] hover:scale-[1.02] transition-transform"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50/50 py-32">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">{t('pricing.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-10 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">{t('pricing.free')}</h3>
                <p className="text-gray-500 mb-8">{t('pricing.free_desc')}</p>
                <p className="text-4xl font-bold mb-1">{t('pricing.price_0')}</p>
                <p className="text-sm text-gray-400 mb-8">{t('pricing.forever')}</p>
              </div>
              <Link to="/auth" className="w-full py-4 border border-gray-200 rounded-2xl font-semibold text-center hover:bg-gray-50 transition-colors">
                {t('nav.getStarted')}
              </Link>
            </div>
            <div className="p-10 bg-black text-white rounded-[32px] shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-6 right-6 px-4 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur">
                {t('pricing.popular')}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{t('pricing.premium')}</h3>
                <p className="text-gray-400 mb-8">{t('pricing.premium_desc')}</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-bold">{t('pricing.price_premium')}</p>
                  <p className="text-gray-400 text-sm">/ {t('pricing.monthly').toLowerCase()}</p>
                </div>
                <p className="text-sm text-gray-400 mb-8">{t('pricing.save')}</p>
              </div>
              <Link to="/auth" className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-center hover:bg-gray-200 transition-colors">
                {t('pricing.buy')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
