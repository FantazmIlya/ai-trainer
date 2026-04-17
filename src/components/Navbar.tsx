import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/exercises', label: t('nav.exercises') },
    { path: '/ai-coach', label: t('nav.ai_coach') },
    { path: '/dashboard', label: t('nav.dashboard') },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass py-3 shadow-sm' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-apple-dark">
          FitMy<span className="text-apple-blue">AI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-apple-blue ${
                location.pathname === link.path ? 'text-apple-blue' : 'text-apple-dark/70'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 ml-4">
            <LanguageSwitcher />
            <Link to="/login" className="apple-button-primary !py-1.5 !px-5 text-sm">
              {t('nav.login')}
            </Link>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-4">
          <LanguageSwitcher />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass absolute top-full left-0 right-0 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium"
            >
              {link.label}
            </Link>
          ))}
          <Link to="/login" className="apple-button-primary text-center">
            {t('nav.login')}
          </Link>
        </div>
      )}
    </nav>
  );
};
