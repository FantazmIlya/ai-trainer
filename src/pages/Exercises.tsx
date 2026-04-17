import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Play, Clock, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';

const EXERCISES = [
  {
    id: 1,
    titleKey: 'ex.squats',
    categoryKey: 'cat.legs',
    difficulty: 'beginner',
    duration: 15,
    image: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    titleKey: 'ex.pushups',
    categoryKey: 'cat.chest',
    difficulty: 'intermediate',
    duration: 10,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    titleKey: 'ex.plank',
    categoryKey: 'cat.abs',
    difficulty: 'beginner',
    duration: 5,
    image: 'https://images.unsplash.com/photo-1548690312-e3b507d8d110?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 4,
    titleKey: 'ex.lunges',
    categoryKey: 'cat.legs',
    difficulty: 'beginner',
    duration: 12,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 5,
    titleKey: 'ex.pullups',
    categoryKey: 'cat.back',
    difficulty: 'advanced',
    duration: 20,
    image: 'https://images.unsplash.com/photo-1598971639058-aba7c12af93a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 6,
    titleKey: 'ex.burpees',
    categoryKey: 'cat.cardio',
    difficulty: 'advanced',
    duration: 15,
    image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&q=80&w=800'
  }
];

export const Exercises: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredExercises = EXERCISES.filter(ex => {
    const title = t(ex.titleKey).toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || ex.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'beginner': return t('exercises.beginner');
      case 'intermediate': return t('exercises.intermediate');
      case 'advanced': return t('exercises.advanced');
      default: return diff;
    }
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-6">{t('nav.exercises')}</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-silver w-5 h-5" />
            <input
              type="text"
              placeholder={t('exercises.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-none shadow-sm focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all font-medium ${
                  filter === lvl 
                    ? 'bg-apple-dark text-white' 
                    : 'bg-white text-apple-dark hover:bg-apple-dark/5'
                }`}
              >
                {lvl === 'all' ? t('exercises.all') : getDifficultyLabel(lvl)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {filteredExercises.map((ex) => (
          <motion.div
            key={ex.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="apple-card !p-0 overflow-hidden group"
          >
            <div className="relative aspect-video">
              <img src={ex.image} alt={t(ex.titleKey)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-colors">
                  <Play fill="currentColor" size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-apple-blue">{t(ex.categoryKey)}</span>
              </div>
              <h3 className="text-xl font-bold mb-4">{t(ex.titleKey)}</h3>
              <div className="flex items-center gap-6 text-sm text-apple-silver">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} />
                  <span>{ex.duration} {t('exercises.min')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart size={16} />
                  <span>{getDifficultyLabel(ex.difficulty)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
