import { motion } from 'framer-motion';
import { Activity, Flame, Timer, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '../components/ui/common';

const StatCard = ({ icon: Icon, label, value, unit, color }: { icon: any, label: string, value: string, unit: string, color: string }) => (
  <Card className="flex flex-col gap-2 border-none bg-white">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 mb-2`}>
      <Icon className={color.replace('bg-', 'text-')} size={24} />
    </div>
    <span className="text-gray-500 text-sm font-medium">{label}</span>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-gray-400 text-xs">{unit}</span>
    </div>
  </Card>
);

export const Dashboard = () => {
  return (
    <div className="space-y-8 pb-12">
      <header>
        <p className="text-[#0071E3] font-semibold text-sm mb-1 uppercase tracking-wider">Обзор</p>
        <h1 className="text-4xl font-bold tracking-tight">Привет, Александр!</h1>
        <p className="text-gray-500 mt-2 text-lg">Ваш план на сегодня почти выполнен.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Flame} label="Калории" value="1,842" unit="ккал" color="bg-orange-500" />
        <StatCard icon={Timer} label="Время" value="45" unit="мин" color="bg-blue-500" />
        <StatCard icon={Activity} label="Активность" value="84" unit="%" color="bg-green-500" />
        <StatCard icon={TrendingUp} label="Прогресс" value="+12" unit="%" color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <Card className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold">Рекомендованная тренировка</h3>
            <span className="bg-[#0071E3]/10 text-[#0071E3] px-3 py-1 rounded-full text-xs font-bold">25 мин</span>
          </div>
          <div className="space-y-4">
            <div className="relative h-64 rounded-3xl overflow-hidden mb-6 group cursor-pointer">
              <img 
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
                alt="Workout" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-sm font-medium opacity-80 mb-1">Фулбоди</p>
                <h4 className="text-2xl font-bold">Силовая тренировка А</h4>
              </div>
            </div>
            <button className="w-full bg-[#1D1D1F] text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">
              Начать тренировку
            </button>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-[#0071E3] to-[#0077ED] border-none text-white">
          <div className="flex items-start justify-between mb-8">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Следующая тренировка</p>
              <p className="font-bold">Завтра, 09:00</p>
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-4 italic">"Постоянство — это ключ к успеху."</h3>
          <p className="text-white/80 mb-8 leading-relaxed">
            Вы на правильном пути. Последние 3 дня вы закрывали свои кольца активности. Продолжайте в том же духе!
          </p>
          <div className="mt-auto pt-8 border-t border-white/20">
            <div className="flex justify-between text-sm mb-2">
              <span>Цель недели: 5 тренировок</span>
              <span>80%</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-white h-full"
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
