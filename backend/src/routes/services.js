const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const { getDb } = require('../database/db');

function getUploadsRoot() {
  return path.resolve(process.env.UPLOADS_PATH || './uploads');
}

function getServicesUploadDir() {
  return path.join(getUploadsRoot(), 'services');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getServicesUploadDir();
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

function ensureSettingsTable(db) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

// GET /api/services/categories - list all categories with min prices
router.get('/categories', authMiddleware, (req, res) => {
  const db = getDb();

  const categories = db.prepare(`
    SELECT
      c.*,
      COALESCE(MIN(s.price), 0) as min_price,
      COUNT(s.id) as service_count
    FROM categories c
    LEFT JOIN services s ON s.category_id = c.id AND s.is_active = 1
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC
  `).all();

  res.json({ categories });
});

// GET /api/services - list all active services
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { category } = req.query;

  let query = 'SELECT * FROM services WHERE is_active = 1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY sort_order ASC, name ASC';

  const services = db.prepare(query).all(...params);

  // Group by category
  const grouped = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = [];
    acc[service.category].push(service);
    return acc;
  }, {});

  res.json({ services, grouped });
});

// GET /api/services/banner - public home banner
router.get('/banner', authMiddleware, (req, res) => {
  const db = getDb();
  ensureSettingsTable(db);
  const row = db.prepare("SELECT value FROM app_settings WHERE key = 'home_banner_image'").get();
  res.json({ image_url: row?.value || null });
});

// GET /api/services/:id
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(req.params.id);

  if (!service) return res.status(404).json({ error: 'Service not found' });

  // Get masters who provide this service
  const masters = db.prepare(`
    SELECT mp.*, u.username, u.first_name, u.last_name,
      ms.custom_price, ms.custom_duration
    FROM master_services ms
    JOIN masters_profiles mp ON ms.master_id = mp.id
    JOIN users u ON mp.user_id = u.id
    WHERE ms.service_id = ? AND mp.is_active = 1
  `).all(req.params.id);

  res.json({ service, masters });
});

// POST /api/services/upload-image - upload service image (admin only)
router.post('/upload-image', authMiddleware, adminOnly, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });

  const reqProto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const reqHost = req.headers['x-forwarded-host'] || req.get('host');
  const runtimeBaseUrl = reqHost ? `${reqProto}://${reqHost}` : null;
  const baseUrl = (process.env.WEBAPP_URL || runtimeBaseUrl || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
  const image_url = `${baseUrl}/uploads/services/${req.file.filename}`;

  res.json({ image_url });
});

// POST /api/services - create service (admin only)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { name, description, category, duration_minutes, price, price_max, image_url, sort_order } = req.body;

  if (!name || !category || !duration_minutes || price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const categoryRow = db.prepare('SELECT id FROM categories WHERE key = ? AND is_active = 1').get(category);
  if (!categoryRow) {
    return res.status(400).json({ error: 'Category not found or inactive' });
  }

  const result = db.prepare(`
    INSERT INTO services (name, description, category, duration_minutes, price, price_max, image_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, description || null, category, duration_minutes, price, price_max || null, image_url || null, sort_order || 0);

  db.prepare('UPDATE services SET category_id = ? WHERE id = ?').run(categoryRow.id, result.lastInsertRowid);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ service });
});

// PUT /api/services/:id - update service (admin only)
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { name, description, category, duration_minutes, price, price_max, image_url, sort_order, is_active } = req.body;

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  let nextCategory = category ?? service.category;
  const categoryRow = db.prepare('SELECT id FROM categories WHERE key = ? AND is_active = 1').get(nextCategory);
  if (!categoryRow) {
    return res.status(400).json({ error: 'Category not found or inactive' });
  }

  db.prepare(`
    UPDATE services SET
      name = ?, description = ?, category = ?, category_id = ?, duration_minutes = ?,
      price = ?, price_max = ?, image_url = ?, sort_order = ?, is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ?? service.name,
    description ?? service.description,
    nextCategory,
    categoryRow.id,
    duration_minutes ?? service.duration_minutes,
    price ?? service.price,
    price_max ?? service.price_max,
    image_url ?? service.image_url,
    sort_order ?? service.sort_order,
    is_active ?? service.is_active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  res.json({ service: updated });
});

// DELETE /api/services/:id - soft delete (admin only)
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE services SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
