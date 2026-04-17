# FitMyAI.ru - Deployment Guide for Beget.com

## 1. Local Build
```bash
npm run build
```
This will create a `dist` folder.

## 2. Server Preparation (Ubuntu 22.04 VPS)
Connect via SSH and run:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx nodejs npm certbot python3-certbot-nginx
sudo npm install -g pm2
```

## 3. Upload Files
Upload the contents of your project to `/var/www/fitmyai.ru/` (using SFTP or FileZilla).
Structure should be:
- `/var/www/fitmyai.ru/dist/` (contains index.html, assets)
- `/var/www/fitmyai.ru/server/` (contains index.js, package.json)

## 4. Fix Folder Name & Permissions (VERY IMPORTANT)
If your folder is named `fitmyai`, rename it to `fitmyai.ru`:
```bash
# Rename the folder
sudo mv /var/www/fitmyai /var/www/fitmyai.ru

# Fix Permissions (Ensures Nginx can read the files)
sudo chown -R www-data:www-data /var/www/fitmyai.ru
sudo chmod -R 755 /var/www/fitmyai.ru
```

## 5. Nginx Configuration
Edit the config:
```bash
sudo nano /etc/nginx/sites-available/fitmyai.ru
```
Paste this (replace `YOUR_SERVER_IP` with your actual IP):
```nginx
server {
    listen 80;
    server_name fitmyai.ru www.fitmyai.ru YOUR_SERVER_IP;

    root /var/www/fitmyai.ru/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Activate and Restart:
```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/fitmyai.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Run Backend (PM2)
```bash
cd /var/www/fitmyai.ru/server
npm install
pm2 start index.js --name "fitmyai-api"
pm2 save
pm2 startup
```

## 7. SSL (HTTPS) - Essential for YooKassa
```bash
sudo certbot --nginx -d fitmyai.ru -d www.fitmyai.ru
```

---
**Troubleshooting 500 Error:**
1. Check the error log: `sudo tail -n 20 /var/log/nginx/error.log`
2. If it says "Permission denied", double check step 4.
3. Ensure the `root` path in Nginx matches the actual folder on disk exactly.
