import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import './i18n';

// Components
import { Navbar } from './components/Navbar';

// Pages
import { Home } from './pages/Home';
import { AICoach } from './pages/AICoach';
import { Exercises } from './pages/Exercises';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-white py-12 border-t border-apple-gray">
      <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <span className="text-xl font-bold tracking-tight text-apple-dark">
            FitMy<span className="text-apple-blue">AI</span>
          </span>
          <p className="text-sm text-apple-silver mt-2">{t('footer.rights')}</p>
        </div>
        <div className="flex gap-8 text-sm font-medium text-apple-silver">
          <a href="#" className="hover:text-apple-dark transition-colors">{t('footer.privacy')}</a>
          <a href="#" className="hover:text-apple-dark transition-colors">{t('footer.terms')}</a>
          <a href="#" className="hover:text-apple-dark transition-colors">{t('footer.contacts')}</a>
        </div>
      </div>
    </footer>
  );
};

const App: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ai-coach" element={<AICoach />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<div className="pt-32 text-center h-screen font-medium">{t('dash.in_dev')}</div>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
