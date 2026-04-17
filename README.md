# AI Personal Trainer - Полная инструкция по развертыванию

Приложение создано в стиле Apple (Apple Design Language) с использованием React, Tailwind и Node.js.

## 1. Технологический стек
- **Frontend**: Vite + React + Tailwind CSS + Framer Motion
- **Backend**: Node.js (Express)
- **Database**: PostgreSQL
- **Сервер**: Beget VPS (Ubuntu 22.04)
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2

## 2. Подготовка VPS на Beget.com
1.  Зайдите в панель Beget -> **VPS**.
2.  Выберите тариф (минимум 1 ГБ RAM).
3.  ОС: **Ubuntu 22.04**.
4.  После создания сервера получите IP и пароль от root.

## 3. Настройка сервера (через SSH)
Подключитесь к серверу: `ssh root@ваш_ip`

### Установка зависимостей:
```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib
# Настройка пароля БД:
sudo -u postgres psql
# ALTER USER postgres WITH PASSWORD 'ваш_пароль';
# \q

# Установка Nginx и PM2
apt install -y nginx
npm install -g pm2
```

## 4. Развертывание кода
1.  Склонируйте ваш репозиторий: `git clone https://github.com/your-username/ai-coach.git /var/www/ai-coach`
2.  **Frontend (Build)**:
    ```bash
    cd /var/www/ai-coach
    npm install
    npm run build
    ```
3.  **Backend**:
    ```bash
    cd /var/www/ai-coach/server
    npm install
    # Создайте .env файл в папке server
    touch .env
    # Вставьте туда ключи: AI_API_KEY, YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY, PORT=3001
    pm2 start index.js --name "ai-coach-api"
    ```

## 5. Настройка Nginx
Отредактируйте конфиг: `nano /etc/nginx/sites-available/default`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (Static files)
    root /var/www/ai-coach/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Перезапустите Nginx: `systemctl restart nginx`

## 6. Настройка SSL (HTTPS)
Бесплатный сертификат через Certbot:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## 7. Интеграция ЮKassa
1.  В кабинете ЮKassa создайте **ShopID** и **SecretKey**.
2.  Вставьте их в `.env` на сервере.
3.  Укажите URL вебхука: `https://your-domain.com/api/payments/webhook`.

## 8. Интеграция с AI (GigaChat / OpenAI)
Для РФ лучше использовать GigaChat или проксировать запросы через ваш бэкенд на сервере Beget, так как запросы с сервера (не из РФ IP) к OpenAI проходят напрямую.
Ключ API храните только на бэкенде в `.env` файле!
