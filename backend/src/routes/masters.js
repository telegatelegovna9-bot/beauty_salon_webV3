const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { adminOnly, masterOrAdmin } = require('../middleware/rbac');
const { getDb } = require('../database/db');

// GET /api/masters - list all active masters
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { service_id } = req.query;

  let query = `
    SELECT mp.*, COALESCE(mp.avatar_url, u.avatar_url) as avatar_url, u.username, u.first_name, u.last_name, u.telegram_id
    FROM masters_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.is_active = 1
  `;
  const params = [];

  if (service_id) {
    query = `
      SELECT mp.*, COALESCE(mp.avatar_url, u.avatar_url) as avatar_url, u.username, u.first_name, u.last_name, u.telegram_id,
        ms.custom_price, ms.custom_duration
      FROM masters_profiles mp
      JOIN users u ON mp.user_id = u.id
      JOIN master_services ms ON ms.master_id = mp.id
      WHERE mp.is_active = 1 AND ms.service_id = ?
    `;
    params.push(service_id);
  }

  query += ' ORDER BY mp.rating DESC, mp.reviews_count DESC';

  const masters = db.prepare(query).all(...params);

  masters.forEach(m => {
    try { m.specializations = JSON.parse(m.specializations || '[]'); } catch { m.specializations = []; }
  });

  res.json({ masters });
});

// ⚠️ IMPORTANT: /me MUST be before /:id to avoid route conflict
// GET /api/masters/me - get own master profile
router.get('/me', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();

  const profile = db.prepare('SELECT mp.*, COALESCE(mp.avatar_url, u.avatar_url) as avatar_url FROM masters_profiles mp JOIN users u ON u.id = mp.user_id WHERE mp.user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  try { profile.specializations = JSON.parse(profile.specializations || '[]'); } catch { profile.specializations = []; }

  const services = db.prepare(`
    SELECT s.*, ms.custom_price, ms.custom_duration
    FROM master_services ms
    JOIN services s ON ms.service_id = s.id
    WHERE ms.master_id = ? AND s.is_active = 1
  `).all(profile.id);

  const schedule = db.prepare('SELECT * FROM schedules WHERE master_id = ? ORDER BY day_of_week').all(profile.id);
  const breaks = db.prepare('SELECT * FROM schedule_breaks WHERE master_id = ?').all(profile.id);

  res.json({ profile, services, schedule, breaks });
});

// PUT /api/masters/me - update own profile
router.put('/me', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { display_name, bio, specializations, experience_years } = req.body;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  db.prepare(`
    UPDATE masters_profiles SET
      display_name = ?, bio = ?, specializations = ?, experience_years = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    display_name ?? profile.display_name,
    bio ?? profile.bio,
    JSON.stringify(specializations ?? JSON.parse(profile.specializations || '[]')),
    experience_years ?? profile.experience_years,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  try { updated.specializations = JSON.parse(updated.specializations || '[]'); } catch { updated.specializations = []; }

  res.json({ profile: updated });
});

// POST /api/masters/me/services - add service to master
router.post('/me/services', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { service_id, custom_price, custom_duration } = req.body;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  db.prepare(`
    INSERT OR REPLACE INTO master_services (master_id, service_id, custom_price, custom_duration)
    VALUES (?, ?, ?, ?)
  `).run(profile.id, service_id, custom_price || null, custom_duration || null);

  res.json({ success: true });
});

// DELETE /api/masters/me/services/:serviceId
router.delete('/me/services/:serviceId', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Master profile not found' });

  db.prepare('DELETE FROM master_services WHERE master_id = ? AND service_id = ?').run(profile.id, req.params.serviceId);
  res.json({ success: true });
});

// GET /api/masters/:id - public master profile (AFTER /me routes)
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();

  const master = db.prepare(`
    SELECT mp.*, COALESCE(mp.avatar_url, u.avatar_url) as avatar_url, u.username, u.first_name, u.last_name
    FROM masters_profiles mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.id = ? AND mp.is_active = 1
  `).get(req.params.id);

  if (!master) return res.status(404).json({ error: 'Master not found' });

  try { master.specializations = JSON.parse(master.specializations || '[]'); } catch { master.specializations = []; }

  const services = db.prepare(`
    SELECT s.*, ms.custom_price, ms.custom_duration
    FROM master_services ms
    JOIN services s ON ms.service_id = s.id
    WHERE ms.master_id = ? AND s.is_active = 1
  `).all(master.id);

  const portfolio = db.prepare(`
    SELECT * FROM portfolio_items WHERE master_id = ? ORDER BY is_featured DESC, sort_order ASC, created_at DESC
  `).all(master.id);

  const reviews = db.prepare(`
    SELECT r.*, u.first_name, u.last_name, u.username
    FROM reviews r
    JOIN users u ON r.client_id = u.id
    WHERE r.master_id = ? AND r.is_published = 1
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all(master.id);

  res.json({ master, services, portfolio, reviews });
});

// PUT /api/masters/:id - admin update any master
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { display_name, bio, specializations, experience_years, is_active } = req.body;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE id = ?').get(req.params.id);
  if (!profile) return res.status(404).json({ error: 'Master not found' });

  db.prepare(`
    UPDATE masters_profiles SET
      display_name = ?, bio = ?, specializations = ?, experience_years = ?,
      is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    display_name ?? profile.display_name,
    bio ?? profile.bio,
    JSON.stringify(specializations ?? JSON.parse(profile.specializations || '[]')),
    experience_years ?? profile.experience_years,
    is_active ?? profile.is_active,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM masters_profiles WHERE id = ?').get(req.params.id);
  res.json({ profile: updated });
});

module.exports = router;
