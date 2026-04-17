import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, CreditCard, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    { label: t('admin.stat.users'), value: '1,284', change: '+12%', icon: <Users className="text-apple-blue" /> },
    { label: t('admin.stat.revenue'), value: '124,500₽', change: '+18%', icon: <CreditCard className="text-green-500" /> },
    { label: t('admin.stat.subs'), value: '412', change: '+5%', icon: <TrendingUp className="text-orange-500" /> },
  ];

  const recentPayments = [
    { id: '1', user: 'Иван Иванов', amount: '990₽', status: 'success', date: `10 ${t('admin.m')} ${t('admin.ago')}` },
    { id: '2', user: 'Мария Сидорова', amount: '990₽', status: 'pending', date: `25 ${t('admin.m')} ${t('admin.ago')}` },
    { id: '3', user: 'Алексей Петров', amount: '990₽', status: 'success', date: `1 ${t('admin.h')} ${t('admin.ago')}` },
    { id: '4', user: 'Елена Козлова', amount: '990₽', status: 'failed', date: `3 ${t('admin.h')} ${t('admin.ago')}` },
  ];

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6">
      <h1 className="text-3xl font-bold mb-10">{t('nav.admin')}</h1>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="apple-card flex items-center justify-between">
            <div>
              <p className="text-apple-silver text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <p className="text-green-500 text-xs mt-2 font-bold">{stat.change} <span className="text-apple-silver font-normal">{t('admin.vs_prev')}</span></p>
            </div>
            <div className="w-12 h-12 bg-apple-gray rounded-xl flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-20">
        {/* Recent Payments */}
        <div className="apple-card">
          <h2 className="text-xl font-bold mb-6">{t('admin.recent_pay')}</h2>
          <div className="space-y-4">
            {recentPayments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-apple-gray transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    pay.status === 'success' ? 'bg-green-100 text-green-600' : 
                    pay.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {pay.status === 'success' ? <CheckCircle2 size={20} /> : 
                     pay.status === 'pending' ? <Clock size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{pay.user}</p>
                    <p className="text-xs text-apple-silver">{pay.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{pay.amount}</p>
                  <p className={`text-[10px] font-bold uppercase ${
                    pay.status === 'success' ? 'text-green-500' : 
                    pay.status === 'pending' ? 'text-orange-500' : 'text-red-500'
                  }`}>{pay.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Management Mockup */}
        <div className="apple-card">
          <h2 className="text-xl font-bold mb-6">{t('admin.user_mgmt')}</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-apple-silver uppercase border-b border-apple-gray">
                <th className="pb-4 font-semibold">{t('admin.table.name')}</th>
                <th className="pb-4 font-semibold">{t('admin.table.status')}</th>
                <th className="pb-4 font-semibold">{t('admin.table.action')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-apple-gray last:border-0">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-apple-blue/10 text-apple-blue rounded-full flex items-center justify-center text-[10px] font-bold">
                        U{i}
                      </div>
                      <span>{t('admin.users')} {i}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-[10px] font-bold uppercase">{t('admin.status.active')}</span>
                  </td>
                  <td className="py-4">
                    <button className="text-apple-blue hover:underline font-medium">{t('admin.edit')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
