import { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Dumbbell, 
  Menu, 
  X, 
  Globe, 
  LogOut,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import './i18n';
import HomePage from './pages/HomePage';
import ExercisesPage from './pages/ExercisesPage';
import AICoachPage from './pages/AICoachPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import AuthPage from './pages/AuthPage';

// --- Auth Context ---
interface AuthContextType {
  user: any;
  login: (data: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => useContext(AuthContext)!;

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Protected Route ---
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

// --- Navigation ---
const Navigation = () => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.exercises'), path: '/exercises' },
    { name: t('nav.coach'), path: '/coach' },
    ...(isAuthenticated ? [{ name: t('nav.dashboard'), path: '/dashboard' }] : []),
    ...(user?.role === 'admin' ? [{ name: t('nav.admin'), path: '/admin' }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Dumbbell className="text-white" size={18} />
          </div>
          <span className="font-bold text-xl tracking-tight">FitMyAI</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-black' : 'text-gray-500 hover:text-black'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors gap-1"
          >
            <Globe size={18} />
            <span className="text-[10px] font-bold uppercase">{i18n.language}</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={20} />
              </button>
              <Link to="/dashboard" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <User size={20} />
              </Link>
            </div>
          ) : (
            <Link 
              to="/auth" 
              className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-black/20"
            >
              {t('nav.login')}
            </Link>
          )}

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b md:hidden overflow-hidden"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map(link => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-medium"
                >
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="px-6 py-3 bg-black text-white rounded-xl text-center font-medium">
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] selection:bg-black selection:text-white font-sans">
          <Navigation />
          
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/exercises" element={<ExercisesPage />} />
              <Route path="/coach" element={<AICoachPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {/* Background decoration */}
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full z-[-1]" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100/30 blur-[120px] rounded-full z-[-1]" />
        </div>
      </Router>
    </AuthProvider>
  );
}
