const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { masterOrAdmin } = require('../middleware/rbac');
const { getDb } = require('../database/db');

function ensurePortfolioImagesColumn() {
  if (portfolioImagesColumnEnsured) return;
  const db = getDb();
  const columns = db.prepare(`PRAGMA table_info(portfolio_items)`).all();
  const hasImageUrls = columns.some(col => col.name === 'image_urls');
  if (!hasImageUrls) {
    db.prepare('ALTER TABLE portfolio_items ADD COLUMN image_urls TEXT').run();
  }
  portfolioImagesColumnEnsured = true;
}

let portfolioImagesColumnEnsured = false;


function getUploadsRoot() {
  return path.resolve(process.env.UPLOADS_PATH || './uploads');
}

function getPortfolioUploadDir() {
  return path.join(getUploadsRoot(), 'portfolio');
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getPortfolioUploadDir();
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// GET /api/portfolio - get all portfolio items (public)
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { master_id, category, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT pi.*, mp.display_name as master_name,
      COALESCE(mp.avatar_url, u.avatar_url) as master_avatar_url, mp.id as master_profile_id
    FROM portfolio_items pi
    JOIN masters_profiles mp ON pi.master_id = mp.id
    JOIN users u ON mp.user_id = u.id
    JOIN categories c ON c.key = pi.category
    WHERE mp.is_active = 1 AND c.is_active = 1
  `;
  const params = [];

  if (master_id) { query += ' AND pi.master_id = ?'; params.push(master_id); }
  if (category) { query += ' AND pi.category = ?'; params.push(category); }

  query += ' ORDER BY pi.is_featured DESC, pi.sort_order ASC, pi.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const items = db.prepare(query).all(...params);
  res.json({ items });
});

// GET /api/portfolio/master/:masterId
router.get('/master/:masterId', authMiddleware, (req, res) => {
  const db = getDb();
  const { category } = req.query;

  let query = `
    SELECT pi.* FROM portfolio_items pi
    JOIN categories c ON c.key = pi.category
    WHERE pi.master_id = ? AND c.is_active = 1
  `;
  const params = [req.params.masterId];

  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY is_featured DESC, sort_order ASC, created_at DESC';

  const items = db.prepare(query).all(...params);
  res.json({ items });
});

// POST /api/portfolio - upload portfolio item
router.post('/', authMiddleware, masterOrAdmin, upload.array('images', 10), async (req, res) => {
  ensurePortfolioImagesColumn();
  const db = getDb();
  const { category, title, description, service_id, is_featured, image_url } = req.body;

  if (!category) return res.status(400).json({ error: 'Category is required' });
  const categoryRow = db.prepare('SELECT key FROM categories WHERE key = ? AND is_active = 1').get(category);
  if (!categoryRow) return res.status(400).json({ error: 'Category not found or inactive' });

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  const reqProto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const reqHost = req.headers['x-forwarded-host'] || req.get('host');
  const runtimeBaseUrl = reqHost ? `${reqProto}://${reqHost}` : null;
  const baseUrl = (process.env.WEBAPP_URL || runtimeBaseUrl || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
  const uploadedUrls = (req.files || []).map(file => `${baseUrl}/uploads/portfolio/${file.filename}`);
  const images = uploadedUrls.length ? uploadedUrls : (image_url ? [image_url] : []);

  if (!images.length) {
    return res.status(400).json({ error: 'At least one image file or image_url is required' });
  }

  const primaryImage = images[0];
  const result = db.prepare(`
    INSERT INTO portfolio_items (master_id, image_url, image_urls, category, title, description, service_id, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    profile.id,
    primaryImage,
    JSON.stringify(images),
    category,
    title || null,
    description || null,
    service_id || null,
    is_featured ? 1 : 0
  );

  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ item, images_count: images.length });
});

// PUT /api/portfolio/:id - update portfolio item
router.put('/:id', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { category, title, description, is_featured, sort_order } = req.body;

  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found' });

  // Check ownership
  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(item.master_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  if (category) {
    const categoryRow = db.prepare('SELECT key FROM categories WHERE key = ? AND is_active = 1').get(category);
    if (!categoryRow) return res.status(400).json({ error: 'Category not found or inactive' });
  }

  db.prepare(`
    UPDATE portfolio_items SET
      category = ?, title = ?, description = ?, is_featured = ?, sort_order = ?
    WHERE id = ?
  `).run(
    category ?? item.category,
    title ?? item.title,
    description ?? item.description,
    is_featured !== undefined ? (is_featured ? 1 : 0) : item.is_featured,
    sort_order ?? item.sort_order,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  res.json({ item: updated });
});

// DELETE /api/portfolio/:id
router.delete('/:id', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();

  const item = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Portfolio item not found' });

  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(item.master_id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  // Delete file if local
  if (item.image_url && item.image_url.includes('/uploads/')) {
    const filename = path.basename(item.image_url);
    const filePath = path.join(getPortfolioUploadDir(), filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
