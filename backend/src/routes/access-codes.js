const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { adminOnly } = require('../middleware/rbac');
const { getDb } = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// GET /api/access-codes - list all codes (admin only)
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();

  const codes = db.prepare(`
    SELECT ac.*,
      u_creator.username as creator_username, u_creator.first_name as creator_first_name,
      u_used.username as used_by_username, u_used.first_name as used_by_first_name
    FROM access_codes ac
    JOIN users u_creator ON ac.created_by = u_creator.id
    LEFT JOIN users u_used ON ac.used_by = u_used.id
    ORDER BY ac.created_at DESC
  `).all();

  res.json({ codes });
});

// POST /api/access-codes - create new code (admin only)
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { role = 'master', expires_at } = req.body;

  // Generate unique 8-character code
  const code = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

  const result = db.prepare(`
    INSERT INTO access_codes (code, role, created_by, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(code, role, req.user.id, expires_at || null);

  const created = db.prepare('SELECT * FROM access_codes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ code: created });
});

// DELETE /api/access-codes/:id - deactivate code (admin only)
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();

  const code = db.prepare('SELECT * FROM access_codes WHERE id = ?').get(req.params.id);
  if (!code) return res.status(404).json({ error: 'Code not found' });

  db.prepare('UPDATE access_codes SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/access-codes/validate - validate code (any user)
router.post('/validate', authMiddleware, (req, res) => {
  const db = getDb();
  const { code } = req.body;

  if (!code) return res.status(400).json({ error: 'Code is required' });

  const accessCode = db.prepare(`
    SELECT * FROM access_codes
    WHERE code = ? AND is_active = 1 AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `).get(code.trim().toUpperCase());

  if (!accessCode) {
    return res.status(400).json({ valid: false, error: 'Invalid or expired code' });
  }

  res.json({ valid: true, role: accessCode.role });
});

module.exports = router;
