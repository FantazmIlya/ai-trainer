import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        exercises: 'Exercises',
        coach: 'AI Coach',
        dashboard: 'Account',
        admin: 'Admin',
        login: 'Login',
        getStarted: 'Get Started',
        logout: 'Logout'
      },
      hero: {
        title: 'Your AI Personal Trainer',
        subtitle: 'Experience the future of fitness with personalized workouts and real-time AI guidance, designed in Apple aesthetic.',
        cta: 'Start Training Free',
        secondary: 'Watch Video',
        badge: 'FitMyAI.ru — Start Training'
      },
      features: {
        ai: 'AI Coach',
        ai_desc: 'Smart assistant available 24/7 to help with your training and nutrition.',
        tracking: 'Progress Tracking',
        tracking_desc: 'Detailed analytics of your workouts and physical activity.',
        workouts: 'Workout Library',
        workouts_desc: 'Hundreds of exercises with detailed technique and video instructions.'
      },
      pricing: {
        title: 'Choose Your Plan',
        free: 'Free',
        free_desc: 'Basic access',
        premium: 'Premium',
        premium_desc: 'Full access to AI and all exercises',
        monthly: 'Monthly',
        forever: 'Forever',
        popular: 'MOST POPULAR',
        save: 'Save with yearly plan',
        buy: 'Upgrade to Premium',
        price_0: '₽0',
        price_premium: '₽499'
      },
      auth: {
        loginTitle: 'Welcome Back',
        registerTitle: 'Join FitMyAI',
        email: 'Email Address',
        password: 'Password',
        name: 'Full Name',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        transform: 'Transform your',
        journey: 'Health Journey',
        join_msg: 'Join thousands of users who have optimized their fitness with the power of AI.',
        ai_support: 'AI Support',
        integrations: 'Integrations',
        or_continue: 'or continue with'
      },
      dashboard: {
        welcome: 'Welcome back,',
        stats: 'Your Stats',
        overview: 'Here is your fitness overview for today.',
        calories: 'Calories',
        workouts: 'Workouts',
        activeMinutes: 'Active Min',
        integrations: 'Integrations',
        connect: 'Connect',
        connected: 'Connected',
        strava: 'Strava',
        strava_desc: 'Sync activities',
        appleHealth: 'Apple Health',
        subscription: 'Subscription',
        sub_desc: 'Manage your premium access',
        plan: 'Current Plan',
        manage: 'Manage Subscription',
        active: 'Active',
        next_billing: 'Next billing: June 15, 2026',
        premium_name: 'FitMyAI Premium'
      },
      exercises: {
        title: 'Workout Library',
        subtitle: 'Expert-led movements for your fitness journey.',
        filter: 'Filter',
        muscle: 'Muscle Group',
        difficulty: 'Difficulty',
        all: 'All',
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        technique: 'Execution Technique',
        start: 'Start Exercise',
        calories_label: 'Calories',
        duration_label: 'Duration',
        legs: 'Legs',
        chest: 'Chest',
        back: 'Back',
        arms: 'Arms',
        core: 'Core',
        fullbody: 'Full Body'
      },
      coach: {
        title: 'AI Fitness Coach',
        welcome: 'Hello! I am your AI Coach. How can I help you today?',
        placeholder: 'Ask about exercises, nutrition...',
        typing: 'Coach is thinking...',
        disclaimer: 'AI advice is for informational purposes only. Consult a doctor before starting.',
        online: 'Online',
        mock_response: 'That is a great question! For this type of workout, I recommend focusing on correct technique and breathing. Would you like me to show you specific exercises?'
      },
      admin: {
        title: 'Admin Dashboard',
        subtitle: 'Platform management and analytics.',
        users: 'Total Users',
        revenue: 'Revenue',
        active: 'Active Now',
        manage: 'Manage Users',
        name: 'Name',
        email: 'Email',
        status: 'Status',
        role: 'Role',
        actions: 'Actions',
        block: 'Block',
        unblock: 'Unblock',
        stats_overview: 'Platform Statistics',
        download: 'Download Report',
        search: 'Search users...',
        status_active: 'ACTIVE',
        status_blocked: 'BLOCKED'
      }
    }
  },
  ru: {
    translation: {
      nav: {
        home: 'Главная',
        exercises: 'Упражнения',
        coach: 'AI Тренер',
        dashboard: 'Кабинет',
        admin: 'Админ',
        login: 'Войти',
        getStarted: 'Начать',
        logout: 'Выйти'
      },
      hero: {
        title: 'Твой Персональный AI-Тренер',
        subtitle: 'Будущее фитнеса с персонализированными тренировками и поддержкой ИИ в реальном времени.',
        cta: 'Начать бесплатно',
        secondary: 'Смотреть видео',
        badge: 'FitMyAI.ru — Начни тренировку'
      },
      features: {
        ai: 'AI Тренер',
        ai_desc: 'Умный ассистент доступен 24/7, чтобы помочь с тренировками и питанием.',
        tracking: 'Отслеживание прогресса',
        tracking_desc: 'Детальная аналитика ваших тренировок и физической активности.',
        workouts: 'Библиотека тренировок',
        workouts_desc: 'Сотни упражнений с детальной техникой и видео-инструкциями.'
      },
      pricing: {
        title: 'Выберите свой план',
        free: 'Бесплатный',
        free_desc: 'Базовый доступ',
        premium: 'Премиум',
        premium_desc: 'Полный доступ к ИИ и всем упражнениям',
        monthly: 'Месяц',
        forever: 'Навсегда',
        popular: 'САМЫЙ ПОПУЛЯРНЫЙ',
        save: 'Экономьте с годовым планом',
        buy: 'Стать Premium',
        price_0: '₽0',
        price_premium: '₽499'
      },
      auth: {
        loginTitle: 'С возвращением',
        registerTitle: 'Присоединиться',
        email: 'Электронная почта',
        password: 'Пароль',
        name: 'Полное имя',
        signIn: 'Войти',
        signUp: 'Регистрация',
        noAccount: 'Нет аккаунта?',
        hasAccount: 'Уже есть аккаунт?',
        transform: 'Преобразите свой',
        journey: 'Путь к Здоровью',
        join_msg: 'Присоединяйтесь к тысячам пользователей, которые оптимизировали свой фитнес с помощью ИИ.',
        ai_support: 'ИИ Поддержка',
        integrations: 'Интеграции',
        or_continue: 'или продолжите через'
      },
      dashboard: {
        welcome: 'С возвращением,',
        stats: 'Твоя статистика',
        overview: 'Вот твой обзор активности на сегодня.',
        calories: 'Калории',
        workouts: 'Тренировки',
        activeMinutes: 'Мин. активности',
        integrations: 'Интеграции',
        connect: 'Подключить',
        connected: 'Подключено',
        strava: 'Strava',
        strava_desc: 'Синхронизация активностей',
        appleHealth: 'Apple Health',
        subscription: 'Подписка',
        sub_desc: 'Управляйте вашим премиум-доступом',
        plan: 'Текущий план',
        manage: 'Управление подпиской',
        active: 'Активна',
        next_billing: 'След. списание: 15 июня 2026',
        premium_name: 'FitMyAI Премиум'
      },
      exercises: {
        title: 'Библиотека тренировок',
        subtitle: 'Профессиональные упражнения для вашего прогресса.',
        filter: 'Фильтр',
        muscle: 'Группа мышц',
        difficulty: 'Сложность',
        all: 'Все',
        beginner: 'Новичок',
        intermediate: 'Средний',
        advanced: 'Продвинутый',
        technique: 'Техника выполнения',
        start: 'Начать упражнение',
        calories_label: 'Калории',
        duration_label: 'Время',
        legs: 'Ноги',
        chest: 'Грудь',
        back: 'Спина',
        arms: 'Руки',
        core: 'Кор',
        fullbody: 'Все тело'
      },
      coach: {
        title: 'AI Тренер',
        welcome: 'Привет! Я твой AI-тренер. Чем могу помочь сегодня?',
        placeholder: 'Спроси об упражнениях, питании...',
        typing: 'Тренер думает...',
        disclaimer: 'Советы ИИ носят информационный характер. Проконсультируйтесь с врачом.',
        online: 'В сети',
        active: 'В сети сейчас',
        pro: 'AI Тренер Pro',
        topics: 'Недавние темы',
        topic1: 'Техника тренировки ног',
        topic2: 'План Кето-диеты',
        safety: 'Безопасность прежде всего',
        mock_response: 'Это отличный вопрос! Для такого типа тренировки я рекомендую сосредоточиться на правильной технике и дыхании. Хотите, я подберу конкретные упражнения?'
      },
      admin: {
        title: 'Панель управления',
        subtitle: 'Управление платформой и аналитика.',
        users: 'Всего пользователей',
        revenue: 'Выручка',
        active: 'Активны сейчас',
        manage: 'Управление пользователями',
        name: 'Имя',
        email: 'Email',
        status: 'Статус',
        role: 'Роль',
        actions: 'Действия',
        block: 'Блок',
        unblock: 'Разблокир.',
        stats_overview: 'Статистика платформы',
        download: 'Скачать отчет',
        search: 'Поиск пользователей...',
        status_active: 'АКТИВЕН',
        status_blocked: 'ЗАБЛОКИРОВАН',
        premium: 'Премиум',
        free: 'Бесплатный',
        admin: 'Админ'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
