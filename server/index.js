const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// --- YooKassa Setup (Mock) ---
app.post('/api/payments/create', (req, res) => {
  const { amount, description } = req.body;
  // В реальном приложении здесь вызов YooKassa API
  console.log(`Creating payment for ${amount} RUB: ${description}`);
  res.json({
    id: 'pay_' + Math.random().toString(36).substr(2, 9),
    confirmation_url: 'https://yookassa.ru/confirmation-mock',
    status: 'pending'
  });
});

app.post('/api/payments/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  res.status(200).send('OK');
});

// --- AI Proxy (Mock) ---
app.post('/api/ai/chat', (req, res) => {
  const { message, language } = req.body;
  const lang = language || req.headers['accept-language'] || 'ru';
  
  console.log(`AI Query (${lang}): ${message}`);

  // Здесь был бы вызов GigaChat или OpenAI
  const responses = {
    ru: "Привет! Я твой AI тренер. Чтобы достичь результатов, рекомендую начать с регулярных тренировок и сбалансированного питания.",
    en: "Hello! I'm your AI trainer. To achieve results, I recommend starting with regular workouts and a balanced diet."
  };

  const reply = lang.includes('ru') ? responses.ru : responses.en;

  setTimeout(() => {
    res.json({ reply });
  }, 1000);
});

// --- Auth (Basic) ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // Мок проверки пользователя
  const token = jwt.sign({ email, role: 'user' }, JWT_SECRET);
  res.json({ token, user: { email, role: 'user' } });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
