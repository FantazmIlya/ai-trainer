import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, Zap, Info } from 'lucide-react';
import { exercises, Exercise } from '../data/exercises';

const ExercisesPage = () => {
  const { t, i18n } = useTranslation();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'legs' | 'chest' | 'back' | 'core'>('all');

  const filteredExercises = exercises.filter(ex => 
    activeFilter === 'all' ? true : ex.category === activeFilter
  );

  const lang = i18n.language as 'ru' | 'en';

  return (
    <div className="pt-24 max-w-7xl mx-auto px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h2 className="text-4xl font-bold mb-4 tracking-tight">{t('exercises.title')}</h2>
          <p className="text-gray-500">{t('exercises.subtitle')}</p>
        </div>
        
        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 no-scrollbar">
          {(['all', 'legs', 'chest', 'back', 'core'] as const).map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === cat 
                  ? 'bg-black text-white shadow-lg' 
                  : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cat === 'all' ? t('exercises.all') : t(`exercises.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredExercises.map((ex, i) => (
          <motion.div 
            key={ex.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
            onClick={() => setSelectedExercise(ex)}
          >
            <div className="h-60 overflow-hidden relative">
              <img 
                src={ex.image} 
                alt={ex.name[lang]} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-black">
                {t(`exercises.${ex.difficulty}`)}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-3">
                <span className="text-blue-600">{t(`exercises.${ex.category}`)}</span>
                <span>•</span>
                <span>{ex.duration}</span>
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-blue-600 transition-colors">{ex.name[lang]}</h3>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Zap size={14} className="text-orange-400" />
                  <span>{ex.calories} kcal</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Play size={14} fill="currentColor" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Exercise Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedExercise(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedExercise(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-black hover:text-white transition-all"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={selectedExercise.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{t(`exercises.${selectedExercise.category}`)}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur">{t(`exercises.${selectedExercise.difficulty}`)}</span>
                  </div>
                  <h2 className="text-3xl font-bold">{selectedExercise.name[lang]}</h2>
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                    <Clock className="text-blue-500" size={20} />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{t('exercises.duration_label')}</p>
                      <p className="font-bold">{selectedExercise.duration}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                    <Zap className="text-orange-500" size={20} />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{t('exercises.calories_label')}</p>
                      <p className="font-bold">{selectedExercise.calories} kcal</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 text-gray-900">
                    <Info size={18} />
                    <h3 className="font-bold">{t('exercises.technique')}</h3>
                  </div>
                  <ul className="space-y-4">
                    {selectedExercise.technique[lang].map((step, idx) => (
                      <li key={idx} className="flex gap-4 items-start">
                        <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-gray-600 leading-relaxed text-sm">{step}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <button className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
                  {t('exercises.start')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExercisesPage;
