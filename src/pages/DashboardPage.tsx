import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Flame, 
  Clock, 
  Smartphone, 
  Heart, 
  ChevronRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../App';

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const stats = [
    { label: t('dashboard.calories'), value: '1,240', unit: 'kcal', icon: <Flame className="text-orange-500" />, color: 'bg-orange-50' },
    { label: t('dashboard.workouts'), value: '12', unit: '', icon: <Activity className="text-blue-500" />, color: 'bg-blue-50' },
    { label: t('dashboard.activeMinutes'), value: '420', unit: 'min', icon: <Clock className="text-green-500" />, color: 'bg-green-50' },
  ];

  return (
    <div className="pt-24 max-w-7xl mx-auto px-6 pb-20">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome')} {user?.name || 'User'}
        </h2>
        <p className="text-gray-500 mt-2">{t('dashboard.overview')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm"
          >
            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
              {stat.icon}
            </div>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{stat.value}</span>
              <span className="text-gray-400 font-medium">{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Integrations */}
        <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">{t('dashboard.integrations')}</h3>
            <div className="p-2 bg-gray-50 rounded-xl">
              <Smartphone size={20} className="text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl group cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <div className="w-6 h-6 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-md" />
                </div>
                <div>
                  <p className="font-bold">{t('dashboard.strava')}</p>
                  <p className="text-xs text-gray-400">{t('dashboard.strava_desc')}</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white rounded-full text-xs font-bold text-gray-900 shadow-sm">
                {t('dashboard.connect')}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl group cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <Heart className="text-red-500" size={24} fill="currentColor" />
                </div>
                <div>
                  <p className="font-bold">{t('dashboard.appleHealth')}</p>
                  <p className="text-xs text-green-500 font-medium">{t('dashboard.connected')}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={20} />
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="p-8 bg-black text-white rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <ShieldCheck size={200} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-2">{t('dashboard.subscription')}</h3>
              <p className="text-gray-400 text-sm">{t('dashboard.sub_desc')}</p>
            </div>
            
            <div className="mt-auto">
              <div className="p-6 bg-white/10 backdrop-blur rounded-3xl border border-white/10 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <CreditCard className="text-black" size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{t('dashboard.plan')}</p>
                    <p className="font-bold">{t('dashboard.premium_name')}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t('dashboard.next_billing')}</span>
                  <span className="font-bold">{t('pricing.price_premium')}/{t('pricing.monthly').toLowerCase()}</span>
                </div>
              </div>
              
              <button className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                {t('dashboard.manage')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
