# Инструкция по развертыванию FitMyAI.ru на Beget.com

Данная инструкция поможет вам развернуть проект на VPS (Virtual Private Server).

## 1. Аренда сервера
1. Зайдите в панель Beget -> VPS.
2. Выберите ОС: **Ubuntu 22.04**.
3. Тариф: Минимальный подойдет для начала.
4. После создания сервера вы получите IP-адрес и пароль root.

## 2. Настройка сервера
Подключитесь по SSH (используйте терминал или Putty):
```bash
ssh root@your_server_ip
```

Обновите пакеты и установите Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
```

## 3. Подготовка кода
Клонируйте ваш репозиторий:
```bash
git clone https://github.com/yourusername/fitmyai.git /var/www/fitmyai
cd /var/www/fitmyai
```

Установите зависимости и соберите фронтенд:
```bash
npm install
npm run build
```

## 4. Настройка Nginx
Создайте конфигурацию для вашего домена `fitmyai.ru`:
```bash
nano /etc/nginx/sites-available/fitmyai.ru
```

Вставьте следующий конфиг:
```nginx
server {
    listen 80;
    server_name fitmyai.ru www.fitmyai.ru;
    root /var/www/fitmyai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Если есть бэкенд на порту 3000
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфиг:
```bash
ln -s /etc/nginx/sites-available/fitmyai.ru /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 5. Установка SSL (HTTPS)
Бесплатный сертификат от Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d fitmyai.ru -d www.fitmyai.ru
```

## 6. Запуск Бэкенда
Если у вас есть серверная часть (папка `server`):
```bash
cd /var/www/fitmyai/server
npm install
sudo npm install -g pm2
pm2 start index.js --name "fitmyai-api"
pm2 save
pm2 startup
```

## 7. Переменные окружения (.env)
Не забудьте создать файл `.env` на сервере для API ключей:
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `GIGACHAT_API_KEY` или `OPENAI_API_KEY`
- `JWT_SECRET`

## Готово!
Теперь ваше приложение доступно по адресу https://fitmyai.ru
