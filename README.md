# 💅 Beauty Studio — Telegram WebApp

Полнофункциональная система управления салоном красоты, работающая как Telegram Web App.

## 🏗️ Архитектура

```
beautybot/
├── backend/          # Node.js + Express API (порт 3001)
│   ├── src/
│   │   ├── database/ # sql.js (pure JS SQLite — без C++ компилятора!)
│   │   ├── middleware/ # Auth (HMAC SHA256) + RBAC
│   │   ├── routes/   # REST API endpoints
│   │   └── services/ # Планировщик уведомлений
│   └── .env          # Конфигурация
├── bot/              # Telegram Bot launcher
├── frontend/         # Vanilla JS WebApp (HTML/CSS/JS)
├── start-backend.ps1 # Запуск backend (PowerShell)
├── start-bot.ps1     # Запуск бота (PowerShell)
└── start-frontend.ps1 # Запуск frontend (PowerShell)
```

## ⚡ Быстрый старт (Windows PowerShell)

### 1. Создайте Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Сохраните полученный **BOT_TOKEN**

### 2. Настройте окружение

Отредактируйте [`backend/.env`](backend/.env):

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
WEBAPP_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
DB_PATH=./data/beauty_salon.db
UPLOADS_PATH=./uploads
ADMIN_TELEGRAM_ID=123456789
```

> **ADMIN_TELEGRAM_ID** — ваш Telegram ID. Узнать можно у [@userinfobot](https://t.me/userinfobot)

### 3. Установите зависимости

В PowerShell (каждая команда отдельно):

```powershell
# Backend
Set-Location backend
npm install
Set-Location ..

# Bot
Set-Location bot
npm install
Set-Location ..
```

### 4. Запустите сервисы

Откройте **3 отдельных окна PowerShell** в папке проекта:

**Окно 1 — Backend API:**
```powershell
.\start-backend.ps1
```
или:
```powershell
Set-Location backend
node src/index.js
```

**Окно 2 — Telegram Bot:**
```powershell
.\start-bot.ps1
```
или:
```powershell
Set-Location bot
node src/index.js
```

**Окно 3 — Frontend:**
```powershell
.\start-frontend.ps1
```
или:
```powershell
Set-Location frontend
npx serve -s . -l 3000
```

### 5. Откройте приложение

- **Прямо в браузере** (для разработки): http://localhost:3000?user_id=ВАШ_TELEGRAM_ID
- **Через Telegram**: настройте Menu Button в BotFather → WebApp URL = ваш HTTPS URL

---

## 🌐 Деплой на сервер (Linux/VPS)

```bash
# Клонируйте репозиторий
git clone <repo>
cd beautybot

# Настройте .env
cp backend/.env.example backend/.env
nano backend/.env

# Установите зависимости
cd backend && npm install
cd ../bot && npm install

# Запустите через PM2
npm install -g pm2
pm2 start backend/src/index.js --name "beauty-backend"
pm2 start bot/src/index.js --name "beauty-bot"
pm2 save
pm2 startup
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/beautybot/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
```

```bash
# SSL сертификат
certbot --nginx -d your-domain.com
```

---

## 🔐 Система ролей

| Роль | Возможности |
|------|-------------|
| **ADMIN** | Полный доступ: управление мастерами, услугами, CRM, аналитика |
| **MASTER** | Своё расписание, записи клиентов, портфолио |
| **CLIENT** | Запись на услуги, просмотр своих записей |

### Как стать мастером

1. ADMIN создаёт код доступа в **Профиль → Администратор → Коды**
2. Передаёт код мастеру
3. Мастер вводит код в **Профиль → Активировать код**

---

## 📡 API Endpoints

### Авторизация
```
POST /api/auth              — Вход / регистрация
GET  /api/auth/me           — Текущий пользователь
PUT  /api/auth/profile      — Обновить профиль
POST /api/auth/activate-code — Активировать код мастера
```

### Услуги
```
GET    /api/services        — Список услуг
GET    /api/services/:id    — Детали услуги
POST   /api/services        — Создать (admin)
PUT    /api/services/:id    — Обновить (admin)
DELETE /api/services/:id    — Удалить (admin)
```

### Мастера
```
GET  /api/masters           — Список мастеров
GET  /api/masters/me        — Мой профиль (master)
GET  /api/masters/:id       — Профиль мастера
PUT  /api/masters/me        — Обновить профиль (master)
POST /api/masters/me/services — Добавить услугу (master)
```

### Расписание
```
GET  /api/schedule/slots              — Доступные слоты
GET  /api/schedule/master/:id         — Расписание мастера
PUT  /api/schedule/master/:id         — Обновить расписание
POST /api/schedule/master/:id/breaks  — Добавить перерыв
POST /api/schedule/master/:id/exceptions — Выходной день
```

### Записи
```
GET  /api/bookings/my           — Мои записи (client)
GET  /api/bookings/master       — Записи мастера
GET  /api/bookings/:id          — Детали записи
POST /api/bookings              — Создать запись
PUT  /api/bookings/:id/status   — Изменить статус
POST /api/bookings/:id/review   — Оставить отзыв
```

### Портфолио
```
GET    /api/portfolio           — Все работы
GET    /api/portfolio/master/:id — Работы мастера
POST   /api/portfolio           — Добавить работу (master)
DELETE /api/portfolio/:id       — Удалить работу (master)
```

### Коды доступа
```
GET    /api/access-codes        — Список кодов (admin)
POST   /api/access-codes        — Создать код (admin)
DELETE /api/access-codes/:id    — Деактивировать (admin)
```

### Администратор
```
GET /api/admin/dashboard        — Статистика
GET /api/admin/users            — Все пользователи
PUT /api/admin/users/:id        — Управление пользователем
GET /api/admin/crm              — CRM клиентов
PUT /api/admin/crm/:userId      — Обновить CRM
GET /api/admin/analytics        — Аналитика
```

---

## 🔧 Разработка без Telegram

В режиме `NODE_ENV=development` можно тестировать без Telegram:

```
http://localhost:3000?user_id=123456789
```

Параметр `user_id` задаёт Telegram ID пользователя.
Для тестирования как admin укажите тот же ID что в `ADMIN_TELEGRAM_ID`.

---

## 🗄️ База данных

Используется **sql.js** — чистый JavaScript SQLite (работает без Visual Studio / C++ компилятора на Windows).

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи (все роли) |
| `masters_profiles` | Профили мастеров |
| `services` | Услуги салона |
| `master_services` | Связь мастер-услуга |
| `schedules` | Рабочие дни мастеров |
| `schedule_breaks` | Перерывы |
| `schedule_exceptions` | Выходные/особые дни |
| `bookings` | Записи клиентов |
| `clients` | CRM профили клиентов |
| `access_codes` | Коды доступа для мастеров |
| `portfolio_items` | Портфолио работ |
| `notifications_log` | Лог уведомлений |
| `reviews` | Отзывы клиентов |

---

## 🔔 Уведомления

Система автоматически отправляет:
- **За 24 часа** до записи — напоминание с кнопками подтверждения/отмены
- **За 2 часа** до записи — финальное напоминание

Планировщик запускается каждые 30 минут.

---

## 🎨 Дизайн

Премиум UI в стиле luxury beauty brand:
- Цветовая палитра: белый/молочный + золото (#C9A96E) + графит
- Типографика: Inter
- Анимации: плавные fade/slide переходы, skeleton loading
- Mobile-first, оптимизировано для Telegram WebApp

---

## 🆘 Частые проблемы

**PowerShell: `&&` не работает**
→ Используйте `;` вместо `&&` или запускайте команды по одной:
```powershell
Set-Location backend; node src/index.js
```

**"Invalid Telegram initData"**
→ Убедитесь что BOT_TOKEN правильный в `backend/.env`

**"Cannot connect to server"**
→ Проверьте что backend запущен: `node src/index.js` в папке `backend`

**Бот не отвечает**
→ Проверьте BOT_TOKEN, убедитесь что нет другого запущенного экземпляра бота

**WebApp не открывается через Telegram**
→ URL должен быть HTTPS. Для разработки используйте [ngrok](https://ngrok.com):
```powershell
ngrok http 3000
```

**База данных пустая после перезапуска**
→ Данные сохраняются автоматически в `backend/data/beauty_salon.db`. При первом запуске seed выполняется автоматически.

---

## 📋 Чеклист запуска

- [ ] Создан Telegram бот через BotFather
- [ ] Настроен `backend/.env` с BOT_TOKEN
- [ ] Указан ADMIN_TELEGRAM_ID (ваш Telegram ID)
- [ ] Установлены зависимости (`npm install` в `backend/` и `bot/`)
- [ ] Запущен backend (`node src/index.js` в `backend/`)
- [ ] Запущен bot (`node src/index.js` в `bot/`)
- [ ] Frontend доступен по URL
- [ ] В BotFather настроена кнопка меню с WebApp URL
- [ ] Протестирована запись через приложение

---

## 📄 Лицензия

MIT License — используйте свободно для коммерческих проектов.
#   b e a u t y _ s a l o n _ w e b  
 