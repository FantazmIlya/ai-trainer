import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreVertical,
  ShieldAlert,
  CheckCircle2,
  Ban
} from 'lucide-react';

const AdminPage = () => {
  const { t } = useTranslation();

  const stats = [
    { label: t('admin.users'), value: '2,842', change: '+12.5%', icon: <Users size={20} />, color: 'bg-blue-50 text-blue-600' },
    { label: t('admin.revenue'), value: '₽1.4M', change: '+8.2%', icon: <CreditCard size={20} />, color: 'bg-green-50 text-green-600' },
    { label: t('admin.active'), value: '412', change: '+24%', icon: <TrendingUp size={20} />, color: 'bg-purple-50 text-purple-600' },
  ];

  const users = [
    { id: 1, name: 'Dmitry Ivanov', email: 'dmitry@example.com', role: 'Premium', status: 'Active', avatar: 'DI' },
    { id: 2, name: 'Sarah Wilson', email: 'sarah.w@fitness.com', role: 'Free', status: 'Blocked', avatar: 'SW' },
    { id: 3, name: 'Michael Chen', email: 'mchen@tech.cn', role: 'Premium', status: 'Active', avatar: 'MC' },
    { id: 4, name: 'Elena Petrova', email: 'elena@sport.ru', role: 'Admin', status: 'Active', avatar: 'EP' },
  ];

  return (
    <div className="pt-24 max-w-7xl mx-auto px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('admin.title')}</h2>
          <p className="text-gray-500 mt-1">{t('admin.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-gray-800 transition-all">
            {t('admin.download')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-extrabold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-xl font-bold">{t('admin.manage')}</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t('admin.search')} 
                className="pl-12 pr-6 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-black/5 outline-none w-full md:w-64"
              />
            </div>
            <button className="p-2.5 bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5 font-bold">{t('admin.name')}</th>
                <th className="px-8 py-5 font-bold">{t('admin.role')}</th>
                <th className="px-8 py-5 font-bold">{t('admin.status')}</th>
                <th className="px-8 py-5 font-bold text-right">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500 text-xs">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-xs font-bold ${user.role === 'Admin' ? 'text-red-500' : user.role === 'Premium' ? 'text-blue-600' : 'text-gray-500'}`}>
                      {user.role === 'Admin' ? t('admin.admin') : user.role === 'Premium' ? t('admin.premium') : t('admin.free')}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {user.status === 'Active' ? (
                        <CheckCircle2 size={14} className="text-green-500" />
                      ) : (
                        <ShieldAlert size={14} className="text-red-500" />
                      )}
                      <span className={`text-xs font-bold ${user.status === 'Active' ? 'text-green-600' : 'text-red-500'}`}>
                        {user.status === 'Active' ? t('admin.status_active') : t('admin.status_blocked')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500" title={t('admin.block')}>
                        <Ban size={18} />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black">
                        <MoreVertical size={18} />
                      </button>
                    </div>
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

export default AdminPage;
