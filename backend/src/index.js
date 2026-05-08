require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { initDb, closeDb } = require('./database/db');
const { startNotificationScheduler } = require('./services/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // In production allow WEBAPP_URL and localhost
    const allowed = [
      process.env.WEBAPP_URL,
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000'
    ].filter(Boolean);
    if (!origin || allowed.some(a => origin.startsWith(a))) {
      return callback(null, true);
    }
    callback(null, true); // Allow all for now
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data', 'X-Dev-User-Id'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many auth requests' }
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// ============================================
// BODY PARSING
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// STATIC FILES
// ============================================

const uploadsPath = path.resolve(process.env.UPLOADS_PATH || './uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.resolve(__dirname, '../../frontend');
  app.use(express.static(frontendPath));
}

// ============================================
// REQUEST LOGGING
// ============================================

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/masters', require('./routes/masters'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/access-codes', require('./routes/access-codes'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================
// SPA FALLBACK (production)
// ============================================

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend/index.html'));
  });
}

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB' });
  }

  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================
// START SERVER
// ============================================

async function seedIfEmpty(db) {
  // Check if services table has data
  const servicesCount = db.prepare('SELECT COUNT(*) as c FROM services').get();
  if (servicesCount && servicesCount.c > 0) return;

  console.log('🌱 Seeding initial data...');

  // Seed categories first
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (key, name, emoji, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const categories = [
    ['manicure', 'Маникюр', '💅', 1],
    ['pedicure', 'Педикюр', '🦶', 2],
    ['eyebrows', 'Брови', '👁️', 3],
    ['eyelashes', 'Ресницы', '👁️‍🗨️', 4],
    ['other', 'Другое', '🔧', 5],
  ];

  const seedCategories = db.transaction(() => {
    categories.forEach(c => insertCategory.run(...c));
  });
  seedCategories();
  console.log(`✅ Seeded ${categories.length} categories`);

  // Then seed services with category_id
  const insertService = db.prepare(`
    INSERT OR IGNORE INTO services (name, description, category, category_id, duration_minutes, price, price_max, sort_order)
    VALUES (?, ?, ?, (SELECT id FROM categories WHERE key = ?), ?, ?, ?, ?)
  `);

  const services = [
    ['Классический маникюр', 'Обработка ногтей, кутикулы и покрытие лаком', 'manicure', 'manicure', 60, 1200, null, 1],
    ['Аппаратный маникюр', 'Маникюр с использованием аппарата', 'manicure', 'manicure', 75, 1500, null, 2],
    ['Маникюр с гель-лаком', 'Покрытие гель-лаком с долгосрочным эффектом', 'manicure', 'manicure', 90, 2000, 2500, 3],
    ['Наращивание ногтей', 'Наращивание на типсы или формы', 'manicure', 'manicure', 150, 3500, 4500, 4],
    ['Дизайн ногтей', 'Художественный дизайн, стразы, фольга', 'manicure', 'manicure', 30, 500, 1500, 5],
    ['Классический педикюр', 'Обработка стоп и ногтей', 'pedicure', 'pedicure', 90, 1800, null, 6],
    ['Аппаратный педикюр', 'Педикюр с использованием аппарата', 'pedicure', 'pedicure', 90, 2000, null, 7],
    ['Педикюр с гель-лаком', 'Покрытие гель-лаком на ногти ног', 'pedicure', 'pedicure', 120, 2500, 3000, 8],
    ['SPA-педикюр', 'Расслабляющий педикюр с ванночкой и маской', 'pedicure', 'pedicure', 120, 3000, null, 9],
    ['Коррекция бровей', 'Придание формы бровям', 'eyebrows', 'eyebrows', 30, 800, null, 10],
    ['Окрашивание бровей', 'Окрашивание хной или краской', 'eyebrows', 'eyebrows', 45, 1000, null, 11],
    ['Ламинирование бровей', 'Долгосрочная укладка бровей', 'eyebrows', 'eyebrows', 60, 2500, null, 12],
    ['Архитектура бровей', 'Полная работа с формой и цветом', 'eyebrows', 'eyebrows', 90, 3000, null, 13],
    ['Классическое наращивание ресниц', 'Наращивание 1:1', 'eyelashes', 'eyelashes', 120, 3000, null, 14],
    ['2D/3D наращивание ресниц', 'Объёмное наращивание', 'eyelashes', 'eyelashes', 150, 4000, 5000, 15],
    ['Ламинирование ресниц', 'Долгосрочный завиток ресниц', 'eyelashes', 'eyelashes', 90, 2500, null, 16],
    ['Коррекция ресниц', 'Заполнение выпавших ресниц', 'eyelashes', 'eyelashes', 90, 2000, null, 17],
  ];

  const seedTx = db.transaction(() => {
    services.forEach(s => insertService.run(...s));
  });
  seedTx();
  console.log(`✅ Seeded ${services.length} services`);
}

async function start() {
  try {
    // Initialize database (async with sql.js)
    console.log('🔄 Initializing database...');
    const db = await initDb();

    // Auto-seed if empty
    await seedIfEmpty(db);

    // Start notification scheduler
    startNotificationScheduler();

    app.listen(PORT, () => {
      console.log(`\n🚀 Beauty Salon API running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 WebApp URL: ${process.env.WEBAPP_URL || 'not set'}`);
      console.log(`\n📋 API Endpoints:`);
      console.log(`   POST /api/auth`);
      console.log(`   GET  /api/services`);
      console.log(`   GET  /api/masters`);
      console.log(`   GET  /api/schedule/slots`);
      console.log(`   POST /api/bookings`);
      console.log(`   GET  /api/bookings/my`);
      console.log(`   GET  /api/portfolio`);
      console.log(`   GET  /api/admin/dashboard`);
      console.log(`\n✅ Server ready!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  closeDb();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully');
  closeDb();
  process.exit(0);
});

start();

module.exports = app;
