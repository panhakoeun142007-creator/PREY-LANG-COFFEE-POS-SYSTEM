# PREY LANG COFFEE POS SYSTEM Deployment Guide

## Recommended architecture

- Frontend: Vercel
- Backend API: AWS EC2 with Nginx + PHP-FPM + Laravel
- Database: MySQL on AWS EC2 or Amazon RDS
- Domain:
  - `panha-tech-web-code.site` -> Vercel frontend
  - `api.panha-tech-web-code.site` -> AWS backend API

This is the best fit for the current codebase. Your users open one main URL:

- `https://panha-tech-web-code.site`

The frontend then calls:

- `https://api.panha-tech-web-code.site/api`

## Important project facts

- Backend folder: `backend`
- Frontend folder: `frontend`
- Database name: `coffee_preylang`
- Frontend env must point to backend API
- Auth uses Bearer tokens stored in browser localStorage
- API tokens and password reset codes are stored in Laravel cache, so production must use a persistent cache store
- Product and profile images are served by Laravel from `/media/...`

## Important security warning

Before deploying, rotate any real email/app passwords that were placed in `.env.example` or committed anywhere. Use fresh production credentials only in the real server `.env`.

## 1. Prepare AWS

Create an Ubuntu EC2 instance with at least:

- 2 vCPU
- 2 GB RAM
- 20+ GB storage

Open these inbound ports in the EC2 Security Group:

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS

Do not open MySQL `3306` publicly unless you truly need remote access.

## 2. Connect with MobaXterm

Use your EC2 public IP and `.pem` key.

SSH user for Ubuntu:

```bash
ubuntu
```

After login:

```bash
sudo apt update && sudo apt upgrade -y
```

## 3. Install server packages

```bash
sudo apt install -y nginx mysql-server unzip curl git supervisor
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3 php8.3-cli php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
php -v
composer -V
```

## 4. Clone the repo

```bash
cd /var/www
sudo git clone https://github.com/panhakoeun142007-creator/PREY-LANG-COFFEE-POS-SYSTEM.git
sudo chown -R $USER:$USER /var/www/PREY-LANG-COFFEE-POS-SYSTEM
cd /var/www/PREY-LANG-COFFEE-POS-SYSTEM
```

## 5. Create MySQL database

Log in:

```bash
sudo mysql
```

Run:

```sql
CREATE DATABASE coffee_preylang CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'coffee_user'@'localhost' IDENTIFIED BY 'StrongPasswordHere123!';
GRANT ALL PRIVILEGES ON coffee_preylang.* TO 'coffee_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Configure Laravel backend

```bash
cd /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
```

Edit `.env`:

```env
APP_NAME="Prey Lang Coffee"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.panha-tech-web-code.site
FRONTEND_URL=https://panha-tech-web-code.site
CUSTOMER_APP_URL=https://panha-tech-web-code.site/menu

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=coffee_preylang
DB_USERNAME=coffee_user
DB_PASSWORD=StrongPasswordHere123!

CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=file

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-real-email@example.com
MAIL_PASSWORD=your-new-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-real-email@example.com
MAIL_FROM_NAME="Prey Lang"
```

Then run:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Set permissions:

```bash
sudo chown -R www-data:www-data /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/storage
sudo chown -R www-data:www-data /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/bootstrap/cache
sudo chmod -R 775 /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/storage
sudo chmod -R 775 /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/bootstrap/cache
```

## 7. Configure Laravel queue worker

Create Supervisor config:

```bash
sudo nano /etc/supervisor/conf.d/preylang-worker.conf
```

Paste:

```ini
[program:preylang-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/artisan queue:work --sleep=3 --tries=3 --timeout=120
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/storage/logs/worker.log
stopwaitsecs=3600
```

Enable it:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start preylang-worker:*
sudo supervisorctl status
```

## 8. Configure Nginx for Laravel API

Create site config:

```bash
sudo nano /etc/nginx/sites-available/preylang-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api.panha-tech-web-code.site;

    root /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/public;
    index index.php index.html;

    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/preylang-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 9. Add SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.panha-tech-web-code.site
```

Choose the redirect-to-HTTPS option when prompted.

## 10. Deploy frontend to Vercel

In Vercel:

1. Import the GitHub repo
2. Set the Root Directory to `frontend`
3. Framework preset: `Vite`
4. Build command: `npm run build`
5. Output directory: `dist`

Add these environment variables in Vercel Project Settings:

```env
VITE_BACKEND_URL=https://api.panha-tech-web-code.site
VITE_API_URL=https://api.panha-tech-web-code.site/api
```

Then deploy.

This repo now includes `frontend/vercel.json` so React BrowserRouter routes should work on refresh.

## 10A. Auto-deploy on updates (recommended)

Frontend (Vercel):

- If your Vercel project is connected to the GitHub repo, Vercel will automatically deploy on every push to the connected branch.

Backend (AWS EC2):

- This repo includes an optional GitHub Actions workflow: `.github/workflows/deploy-backend-ec2.yml`
- To enable auto-deploy on push, add these GitHub repo secrets:
  - `EC2_HOST` (example: `1.2.3.4`)
  - `EC2_USER` (example: `ubuntu`)
  - `EC2_SSH_KEY` (your private key contents)
  - `EC2_PORT` (optional; default `22`)
  - `EC2_REPO_DIR` (example: `/var/www/PREY-LANG-COFFEE-POS-SYSTEM`)

## 11. Connect GoDaddy domain

For the root frontend domain:

- Connect `panha-tech-web-code.site` in Vercel Domains
- Follow the DNS records shown by Vercel in the project

For the backend API subdomain in GoDaddy DNS:

- Type: `A`
- Name: `api`
- Value: your EC2 public IPv4
- TTL: default

After DNS propagation, test:

- `https://panha-tech-web-code.site`
- `https://api.panha-tech-web-code.site/api/health`

## 12. Production verification checklist

Run these on the server:

```bash
cd /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate:status
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
```

Browser/API checks:

```text
https://api.panha-tech-web-code.site/api/health
https://panha-tech-web-code.site
```

Login checks with seeded accounts:

- Admin email: `panha.koeun142007@gmail.com`
- Admin password: `panha123!@#`
- Staff email: `staff@preylang.com`
- Staff password: `staff123`

After login verify:

- dashboard loads
- categories load
- products load
- customer menu works at `/menu`
- order creation works
- order history works
- receipt page works
- uploaded images open from `/media/...`
- forgot password email works

## 13. Useful troubleshooting commands

Laravel logs:

```bash
tail -f /var/www/PREY-LANG-COFFEE-POS-SYSTEM/backend/storage/logs/laravel.log
```

Nginx logs:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

Check queue:

```bash
sudo supervisorctl status
```

Check MySQL login:

```bash
mysql -u coffee_user -p coffee_preylang
```

## 14. Important notes for this repo

- `api/health/db` returns 404 outside local/testing, so use `api/health` in production
- The frontend build could not be fully verified in this local sandbox because Node child-process spawning is blocked here
- Current backend tests are not fully green, so deployment can work, but you should still review and fix those failing tests before calling production fully complete

## 15. If you insist on one literal host only

If you want both frontend pages and backend API under the exact same host with no `api.` subdomain, do not use Vercel for the frontend. Host both frontend and Laravel behind the same Nginx server on AWS instead.
