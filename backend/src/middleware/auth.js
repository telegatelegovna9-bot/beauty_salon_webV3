const crypto = require('crypto');
const { getDb } = require('../database/db');

/**
 * Validates Telegram WebApp initData using HMAC-SHA256
 */
function validateTelegramInitData(initData, botToken) {
  if (!initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  // Sort params alphabetically and create data-check-string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create secret key: HMAC-SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Calculate expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (expectedHash !== hash) return null;

  // Check auth_date (not older than 24 hours)
  const authDate = parseInt(params.get('auth_date'), 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) return null;

  // Parse user data
  const userStr = params.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Main authentication middleware
 */
async function authMiddleware(req, res, next) {
  try {
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) {
      return res.status(401).json({ error: 'Missing Telegram initData' });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // In development mode, allow bypass with special header
    let telegramUser;
    if (process.env.NODE_ENV === 'development' && initData === 'dev_bypass') {
      const devUserId = req.headers['x-dev-user-id'] || '123456789';
      telegramUser = {
        id: parseInt(devUserId),
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser'
      };
    } else {
      telegramUser = validateTelegramInitData(initData, botToken);
      if (!telegramUser) {
        return res.status(401).json({ error: 'Invalid Telegram initData' });
      }
    }

    const db = getDb();

    // Backward compatibility: older DBs may not have users.avatar_url yet
    try {
      const cols = db.prepare("PRAGMA table_info(users)").all();
      if (!cols.some(c => c.name === 'avatar_url')) {
        db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run();
      }
    } catch (e) {
      console.warn('Failed to ensure users.avatar_url column:', e.message);
    }

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(String(telegramUser.id));

    if (!user) {
      // Check if this is the first admin (from env)
      const adminTelegramId = process.env.ADMIN_TELEGRAM_ID;
      const role = adminTelegramId && String(telegramUser.id) === String(adminTelegramId) ? 'admin' : 'client';

      const result = db.prepare(`
        INSERT INTO users (telegram_id, username, first_name, last_name, role, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        String(telegramUser.id),
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        role,
        telegramUser.photo_url || null
      );

      // Create client profile
      db.prepare('INSERT OR IGNORE INTO clients (user_id) VALUES (?)').run(result.lastInsertRowid);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Update user info if changed
      db.prepare(`
        UPDATE users SET
          username = ?,
          first_name = ?,
          last_name = ?,
          avatar_url = COALESCE(avatar_url, ?)
        WHERE telegram_id = ?
      `).run(
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.photo_url || null,
        String(telegramUser.id)
      );

      // Ensure client profile exists
      db.prepare('INSERT OR IGNORE INTO clients (user_id) VALUES (?)').run(user.id);
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Account is blocked' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional auth - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) return next();
  return authMiddleware(req, res, next);
}

module.exports = { authMiddleware, optionalAuth, validateTelegramInitData };
