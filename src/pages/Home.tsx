import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, Shield, Activity, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Zap className="text-orange-500" />,
      title: t('features.ai.title'),
      desc: t('features.ai.desc'),
    },
    {
      icon: <Activity className="text-apple-blue" />,
      title: t('features.exercises.title'),
      desc: t('features.exercises.desc'),
    },
    {
      icon: <Shield className="text-green-500" />,
      title: t('features.tracking.title'),
      desc: t('features.tracking.desc'),
    },
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 lg:py-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="bg-apple-blue/10 text-apple-blue px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-block">
            {t('hero.badge')}
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 max-w-4xl leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-apple-silver mb-10 max-w-2xl mx-auto font-normal">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="apple-button-primary !px-10 !py-4 text-lg flex items-center justify-center gap-2">
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="apple-button-secondary !px-10 !py-4 text-lg flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              {t('hero.demo')}
            </button>
          </div>
        </motion.div>

        {/* Hero Image Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-white p-4"
        >
          <img 
            src="https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=2000" 
            alt="Dashboard Preview" 
            className="rounded-2xl w-full object-cover aspect-video lg:aspect-auto"
          />
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-apple-gray rounded-2xl flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{f.title}</h3>
                <p className="text-apple-silver leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-apple-silver">{t('pricing.subtitle')}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="apple-card flex flex-col items-start">
            <h3 className="text-xl font-bold mb-2">{t('pricing.free')}</h3>
            <div className="text-4xl font-bold mb-4">0₽ <span className="text-lg font-normal text-apple-silver">{t('pricing.month')}</span></div>
            <ul className="space-y-3 mb-8 text-apple-dark/70">
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-apple-blue" /> {t('pricing.free.f1')}</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-apple-blue" /> {t('pricing.free.f2')}</li>
            </ul>
            <button className="apple-button-secondary w-full mt-auto">{t('pricing.selected')}</button>
          </div>
          
          {/* Premium Plan */}
          <div className="apple-card border-2 border-apple-blue relative overflow-hidden flex flex-col items-start">
            <div className="absolute top-4 right-4 bg-apple-blue text-white text-xs font-bold px-2 py-1 rounded">
              {t('pricing.popular')}
            </div>
            <h3 className="text-xl font-bold mb-2">{t('pricing.premium')}</h3>
            <div className="text-4xl font-bold mb-4">990₽ <span className="text-lg font-normal text-apple-silver">{t('pricing.month')}</span></div>
            <ul className="space-y-3 mb-8 text-apple-dark/70">
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-apple-blue" /> {t('pricing.premium.f1')}</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-apple-blue" /> {t('pricing.premium.f2')}</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-apple-blue" /> {t('pricing.premium.f3')}</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-apple-blue" /> {t('pricing.premium.f4')}</li>
            </ul>
            <button className="apple-button-primary w-full mt-auto">{t('pricing.buy')}</button>
          </div>
        </div>
      </section>
    </div>
  );
};
