const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { YooCheckout } = require('@a6s/yookassa-sdk'); // Или аналогичная библиотека

const app = express();
app.use(cors());
app.use(express.json());

const checkout = new YooCheckout({
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET_KEY
});

// Создание платежа
app.post('/api/payments/create', async (req, res) => {
    try {
        const { amount, description } = req.body;
        const payment = await checkout.createPayment({
            amount: {
                value: amount.toFixed(2),
                currency: 'RUB'
            },
            payment_method_data: {
                type: 'bank_card'
            },
            confirmation: {
                type: 'redirect',
                return_url: 'https://fitmyai.ru/dashboard'
            },
            description: description || 'Подписка FitMyAI Premium',
            capture: true
        });

        res.json({ confirmation_url: payment.confirmation.confirmation_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при создании платежа' });
    }
});

// Вебхук от ЮKassa
app.post('/api/payments/webhook', (req, res) => {
    const event = req.body;
    if (event.event === 'payment.succeeded') {
        const paymentId = event.object.id;
        // Логика активации подписки для пользователя
        console.log(`Платеж ${paymentId} успешно завершен`);
    }
    res.sendStatus(200);
});

// Прокси для AI (пример для GigaChat/OpenAI)
app.post('/api/ai/chat', async (req, res) => {
    const { message, lang } = req.body;
    
    // В запросе к LLM укажите системный промпт в зависимости от языка
    // Например: "Ты — профессиональный фитнес-тренер. Отвечай только на языке: ${lang === 'ru' ? 'русский' : 'английский'}."
    
    // Здесь должна быть логика обращения к LLM
    res.json({ message: lang === 'ru' ? "Это отличный вопрос!..." : "That's a great question!..." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
