export interface Exercise {
  id: string;
  name: {
    ru: string;
    en: string;
  };
  category: 'legs' | 'chest' | 'back' | 'arms' | 'core' | 'fullbody';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  calories: number;
  image: string;
  videoUrl?: string;
  description: {
    ru: string;
    en: string;
  };
  technique: {
    ru: string[];
    en: string[];
  };
}

export const exercises: Exercise[] = [
  {
    id: '1',
    name: { ru: 'Приседания с собственным весом', en: 'Bodyweight Squats' },
    category: 'legs',
    difficulty: 'beginner',
    duration: '15 min',
    calories: 120,
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&q=80&w=800',
    description: {
      ru: 'Фундаментальное упражнение для развития мышц ног и ягодиц.',
      en: 'A fundamental exercise for developing leg and gluteal muscles.'
    },
    technique: {
      ru: [
        'Встаньте прямо, ноги на ширине плеч.',
        'Держите спину ровно, смотрите перед собой.',
        'Медленно опускайтесь, отводя таз назад, как будто садитесь на стул.',
        'Колени не должны выходить за линию носков.',
        'Вернитесь в исходное положение.'
      ],
      en: [
        'Stand straight, feet shoulder-width apart.',
        'Keep your back straight, look straight ahead.',
        'Slowly lower yourself by pushing your hips back as if sitting on a chair.',
        'Knees should not go beyond the line of your toes.',
        'Return to the starting position.'
      ]
    }
  },
  {
    id: '2',
    name: { ru: 'Отжимания от пола', en: 'Push-Ups' },
    category: 'chest',
    difficulty: 'intermediate',
    duration: '10 min',
    calories: 80,
    image: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&q=80&w=800',
    description: {
      ru: 'Отличное упражнение для укрепления груди, плеч и трицепсов.',
      en: 'An excellent exercise for strengthening the chest, shoulders, and triceps.'
    },
    technique: {
      ru: [
        'Примите упор лежа.',
        'Руки чуть шире плеч, тело в одну прямую линию.',
        'Опускайтесь, пока грудь не окажется в нескольких сантиметрах от пола.',
        'Мощно вытолкните себя наверх.'
      ],
      en: [
        'Start in a plank position.',
        'Hands slightly wider than shoulders, body in a straight line.',
        'Lower yourself until your chest is a few inches from the floor.',
        'Powerfully push yourself back up.'
      ]
    }
  },
  {
    id: '3',
    name: { ru: 'Планка', en: 'Plank' },
    category: 'core',
    difficulty: 'beginner',
    duration: '5 min',
    calories: 30,
    image: 'https://images.unsplash.com/photo-1566241134883-13eb2393a3cc?auto=format&fit=crop&q=80&w=800',
    description: {
      ru: 'Статическое упражнение для укрепления мышц кора.',
      en: 'A static exercise for strengthening core muscles.'
    },
    technique: {
      ru: [
        'Встаньте в упор на предплечья.',
        'Тело должно образовывать прямую линию от головы до пяток.',
        'Напрягите пресс и ягодицы.',
        'Удерживайте положение.'
      ],
      en: [
        'Hold yourself up on your forearms.',
        'Body should form a straight line from head to heels.',
        'Tense your abs and glutes.',
        'Hold the position.'
      ]
    }
  },
  {
    id: '4',
    name: { ru: 'Выпады', en: 'Lunges' },
    category: 'legs',
    difficulty: 'intermediate',
    duration: '12 min',
    calories: 100,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=800',
    description: {
      ru: 'Эффективное упражнение для ног и баланса.',
      en: 'Effective exercise for legs and balance.'
    },
    technique: {
      ru: [
        'Сделайте широкий шаг вперед.',
        'Опускайтесь, пока оба колена не образуют угол 90 градусов.',
        'Спина прямая.',
        'Вернитесь в исходное положение и поменяйте ногу.'
      ],
      en: [
        'Take a wide step forward.',
        'Lower your body until both knees form a 90-degree angle.',
        'Keep your back straight.',
        'Return to start and switch legs.'
      ]
    }
  }
];
