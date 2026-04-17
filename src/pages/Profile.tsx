import { User, Settings, Shield, Bell, ChevronRight, Apple, Heart } from 'lucide-react';
import { Card, Button, Input } from '../components/ui/common';

export const Profile = () => {
  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Профиль</h1>
        <p className="text-gray-500 mt-2 text-lg">Управляйте своими данными и интеграциями.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-sm bg-white p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <User size={20} className="text-[#0071E3]" />
              Личные данные
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Имя</label>
                <Input defaultValue="Александр" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Фамилия</label>
                <Input defaultValue="Иванов" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                <Input defaultValue="alex@example.com" disabled />
              </div>
            </div>
            <Button className="mt-8 px-8">Сохранить изменения</Button>
          </Card>

          <Card className="border-none shadow-sm bg-white p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Settings size={20} className="text-[#0071E3]" />
              Интеграции
            </h3>
            <p className="text-gray-500 text-sm mb-6">Подключите свои устройства для автоматического импорта тренировок.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-2xl hover:bg-black/5 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center">
                    <Apple size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Apple Health</p>
                    <p className="text-xs text-gray-400">Синхронизация шагов и калорий</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-[#0071E3] font-bold">Подключить</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-2xl hover:bg-black/5 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FC4C02] text-white rounded-xl flex items-center justify-center font-black">
                    S
                  </div>
                  <div>
                    <p className="font-bold">Strava</p>
                    <p className="text-xs text-gray-400">Импорт беговых тренировок</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-gray-400 font-bold" disabled>Подключено</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white p-6">
            <h4 className="font-bold mb-4">Настройки</h4>
            <div className="space-y-1">
              {[
                { icon: Shield, label: 'Безопасность', color: 'text-blue-500' },
                { icon: Bell, label: 'Уведомления', color: 'text-orange-500' },
                { icon: Heart, label: 'Цели здоровья', color: 'text-red-500' },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between p-3 hover:bg-black/5 rounded-xl transition-all group">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={item.color} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-black transition-colors" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-black text-white p-6 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Статус</p>
              <h4 className="text-xl font-bold mb-4">Базовый план</h4>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">Получите Премиум, чтобы открыть все функции AI-тренера.</p>
              <Button variant="secondary" className="w-full py-3 text-sm bg-white text-black hover:bg-gray-100">Улучшить</Button>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[#0071E3]/20 rounded-full blur-3xl" />
          </Card>
        </div>
      </div>
    </div>
  );
};
