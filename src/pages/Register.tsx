import { Link } from 'react-router-dom';
import { Dumbbell, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../components/ui/common';

export const Register = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F5F7]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#0071E3] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#0071E3]/20">
            <Dumbbell className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('auth.register_title')}</h1>
          <p className="text-gray-500 mt-2">{t('auth.register_subtitle')}</p>
        </div>

        <Card className="p-8 border-none shadow-2xl bg-white/80 backdrop-blur-xl">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">{t('auth.name')}</label>
              <Input type="text" placeholder="..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">{t('auth.email')}</label>
              <Input type="email" placeholder="alex@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">{t('auth.password')}</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            
            <Link to="/dashboard" className="block pt-4">
              <Button variant="secondary" className="w-full py-4 text-lg font-bold group">
                {t('auth.register_now')}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
            </Link>
          </form>

          <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <p className="text-gray-500 text-sm">
              {t('auth.have_account')}{' '}
              <Link to="/login" className="text-[#0071E3] font-bold hover:underline">
                {t('nav.login')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
