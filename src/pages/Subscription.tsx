import { CheckCircle2, CreditCard, Zap, Crown } from 'lucide-react';
import { Card, Button } from '../components/ui/common';

export const Subscription = () => {
  const plans = [
    {
      name: 'Бесплатный',
      price: '0',
      icon: Zap,
      features: ['Доступ к AI-тренеру (лимит 5 вопр/день)', 'Базовая библиотека упражнений', 'Дневник тренировок'],
      current: true,
      buttonText: 'Ваш текущий план'
    },
    {
      name: 'Премиум',
      price: '490',
      icon: Crown,
      features: ['Безлимитный AI-тренер', 'Все упражнения (видео + техника)', 'Интеграция с Apple Health/Strava', 'Персональные рекомендации'],
      current: false,
      buttonText: 'Выбрать Премиум',
      popular: true
    }
  ];

  const handlePayment = async () => {
    // Интеграция ЮKassa:
    // 1. Отправляем запрос на ваш бэкенд: POST /api/payments/create
    // 2. Бэкенд создает платеж через ЮKassa API и возвращает confirmation_url
    // 3. Редиректим пользователя на этот URL
    alert('Перенаправление на ЮKassa...');
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Выберите свой уровень</h1>
        <p className="text-gray-500 text-lg">Ускорьте свой прогресс с премиум-возможностями AI Coach.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan, i) => (
          <Card 
            key={i} 
            className={`p-8 relative overflow-hidden flex flex-col border-none shadow-xl ${
              plan.popular ? 'ring-2 ring-[#0071E3] bg-white' : 'bg-white'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-[#0071E3] text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
                Популярный
              </div>
            )}
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
              plan.popular ? 'bg-[#0071E3] text-white' : 'bg-black text-white'
            }`}>
              <plan.icon size={28} />
            </div>

            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-bold">₽{plan.price}</span>
              <span className="text-gray-400">/мес</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button 
              variant={plan.popular ? 'secondary' : 'outline'} 
              className="w-full py-4 font-bold"
              disabled={plan.current}
              onClick={handlePayment}
            >
              <CreditCard className="mr-2" size={18} />
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
