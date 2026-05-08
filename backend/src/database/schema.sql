-- ============================================
-- BEAUTY SALON DATABASE SCHEMA
-- ============================================

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ============================================
-- USERS & ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK(role IN ('admin', 'master', 'client')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'blocked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- MASTERS PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS masters_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  specializations TEXT DEFAULT '[]',
  experience_years INTEGER DEFAULT 0,
  rating REAL DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_masters_user_id ON masters_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_masters_active ON masters_profiles(is_active);

-- ============================================
-- CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT,
  image_path TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT OR IGNORE INTO categories (key, name, emoji, sort_order) VALUES
  ('manicure', 'Маникюр', '💅', 1),
  ('pedicure', 'Педикюр', '🦶', 2),
  ('eyebrows', 'Брови', '👁️', 3),
  ('eyelashes', 'Ресницы', '👁️‍🗨️', 4),
  ('other', 'Другое', '🔧', 5);

-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK(category IN ('manicure', 'pedicure', 'eyebrows', 'eyelashes', 'other')),
  category_id INTEGER,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price REAL NOT NULL DEFAULT 0,
  price_max REAL,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);

-- ============================================
-- MASTER SERVICES (many-to-many)
-- ============================================

CREATE TABLE IF NOT EXISTS master_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  custom_price REAL,
  custom_duration INTEGER,
  UNIQUE(master_id, service_id),
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- ============================================
-- SCHEDULES (рабочие дни мастеров)
-- ============================================

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_working INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(master_id, day_of_week),
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedules_master ON schedules(master_id);

-- ============================================
-- SCHEDULE BREAKS (перерывы)
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_breaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  label TEXT DEFAULT 'Перерыв',
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE
);

-- ============================================
-- SCHEDULE EXCEPTIONS (выходные/особые дни)
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id INTEGER NOT NULL,
  exception_date TEXT NOT NULL,
  is_working INTEGER DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  reason TEXT,
  UNIQUE(master_id, exception_date),
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE
);

-- ============================================
-- BOOKINGS (записи)
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  master_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  booking_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  price REAL,
  notes TEXT,
  client_notes TEXT,
  client_phone TEXT,
  cancelled_by TEXT,
  cancel_reason TEXT,
  reminder_24h_sent INTEGER DEFAULT 0,
  reminder_2h_sent INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_master ON bookings(master_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_master ON bookings(booking_date, master_id);

-- ============================================
-- CLIENTS (расширенный CRM профиль)
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  crm_status TEXT DEFAULT 'new' CHECK(crm_status IN ('new', 'active', 'vip', 'no_show', 'blocked')),
  total_visits INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  last_visit_date TEXT,
  notes TEXT,
  tags TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(crm_status);

-- ============================================
-- ACCESS CODES (коды для мастеров)
-- ============================================

CREATE TABLE IF NOT EXISTS access_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'master' CHECK(role IN ('master', 'admin')),
  created_by INTEGER NOT NULL,
  used_by INTEGER,
  is_active INTEGER DEFAULT 1,
  expires_at DATETIME,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (used_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active);

-- ============================================
-- PORTFOLIO
-- ============================================

CREATE TABLE IF NOT EXISTS portfolio_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  master_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL CHECK(category IN ('manicure', 'pedicure', 'eyebrows', 'eyelashes', 'other')),
  title TEXT,
  description TEXT,
  service_id INTEGER,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_master ON portfolio_items(master_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(category);

-- ============================================
-- NOTIFICATIONS LOG
-- ============================================

CREATE TABLE IF NOT EXISTS notifications_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  booking_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('reminder_24h', 'reminder_2h', 'booking_confirmed', 'booking_cancelled', 'booking_rescheduled', 'custom')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'read')),
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_booking ON notifications_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications_log(status);

-- ============================================
-- DIALOG MESSAGES (admin <-> user bot chat)
-- ============================================

CREATE TABLE IF NOT EXISTS dialog_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
  message TEXT NOT NULL,
  source TEXT DEFAULT 'bot',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dialog_user ON dialog_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_dialog_created ON dialog_messages(created_at);

-- ============================================
-- REVIEWS
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE,
  client_id INTEGER NOT NULL,
  master_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  is_published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (master_id) REFERENCES masters_profiles(id) ON DELETE CASCADE
);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_users_timestamp
  AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_masters_timestamp
  AFTER UPDATE ON masters_profiles
BEGIN
  UPDATE masters_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_bookings_timestamp
  AFTER UPDATE ON bookings
BEGIN
  UPDATE bookings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_client_stats
  AFTER UPDATE OF status ON bookings
  WHEN NEW.status = 'completed'
BEGIN
  UPDATE clients SET
    total_visits = total_visits + 1,
    total_spent = total_spent + COALESCE(NEW.price, 0),
    last_visit_date = NEW.booking_date,
    crm_status = CASE
      WHEN total_visits + 1 >= 10 THEN 'vip'
      WHEN total_visits + 1 >= 1 THEN 'active'
      ELSE crm_status
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.client_id;
END;

CREATE TRIGGER IF NOT EXISTS update_master_rating
  AFTER INSERT ON reviews
BEGIN
  UPDATE masters_profiles SET
    rating = (SELECT AVG(rating) FROM reviews WHERE master_id = NEW.master_id AND is_published = 1),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE master_id = NEW.master_id AND is_published = 1),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.master_id;
END;
