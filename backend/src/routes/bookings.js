const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { adminOnly, masterOrAdmin } = require('../middleware/rbac');
const { getDb } = require('../database/db');
const { sendBookingNotification, sendMasterNewBookingNotification } = require('../services/notifications');

// GET /api/bookings/my - get client's own bookings
router.get('/my', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT b.*,
      s.name as service_name, s.category as service_category, s.duration_minutes,
      mp.display_name as master_name, mp.avatar_url as master_avatar,
      u.first_name as master_first_name, u.last_name as master_last_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u ON mp.user_id = u.id
    WHERE b.client_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  query += ' ORDER BY b.booking_date DESC, b.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const bookings = db.prepare(query).all(...params);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM bookings WHERE client_id = ?${status ? ' AND status = ?' : ''}
  `).get(...(status ? [req.user.id, status] : [req.user.id]));

  res.json({ bookings, total: total.count });
});

// GET /api/bookings/master - get master's bookings
router.get('/master', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { date, status, limit = 50, offset = 0 } = req.query;

  const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);

  // Determine masterId: admin can pass master_id param, otherwise use own profile
  let masterId;
  if (req.user.role === 'admin' && req.query.master_id) {
    masterId = req.query.master_id;
  } else if (profile) {
    masterId = profile.id;
  } else {
    return res.status(404).json({ error: 'Master profile not found' });
  }

  let query = `
    SELECT b.*,
      s.name as service_name, s.category as service_category, s.duration_minutes,
      u.first_name as client_first_name, u.last_name as client_last_name,
      u.username as client_username, COALESCE(b.client_phone, u.phone) as client_phone, u.telegram_id as client_telegram_id
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN users u ON b.client_id = u.id
    WHERE b.master_id = ?
  `;
  const params = [masterId];

  if (date) {
    query += ' AND b.booking_date = ?';
    params.push(date);
  }

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  query += ' ORDER BY b.booking_date ASC, b.start_time ASC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const bookings = db.prepare(query).all(...params);
  res.json({ bookings });
});

// GET /api/bookings/:id - get single booking
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();

  const booking = db.prepare(`
    SELECT b.*,
      s.name as service_name, s.category as service_category, s.duration_minutes, s.price as service_price,
      mp.display_name as master_name, mp.avatar_url as master_avatar,
      u_master.first_name as master_first_name, u_master.last_name as master_last_name,
      u_client.first_name as client_first_name, u_client.last_name as client_last_name,
      u_client.username as client_username, COALESCE(b.client_phone, u_client.phone) as client_phone
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u_master ON mp.user_id = u_master.id
    JOIN users u_client ON b.client_id = u_client.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  // Check access
  const masterProfile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  const isMasterOfBooking = masterProfile && String(masterProfile.id) === String(booking.master_id);
  const isClient = String(booking.client_id) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';

  if (!isClient && !isMasterOfBooking && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json({ booking });
});

// POST /api/bookings - create booking (atomic, race-condition safe)
router.post('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { master_id, service_id, booking_date, start_time, notes, client_phone } = req.body;

  if (!master_id || !service_id || !booking_date || !start_time) {
    return res.status(400).json({ error: 'master_id, service_id, booking_date, start_time are required' });
  }

  const clientPhone = String(client_phone || '').trim();
  if (!clientPhone) {
    return res.status(400).json({ error: 'client_phone is required' });
  }
  if (clientPhone.length < 9 || clientPhone.length > 13) {
    return res.status(400).json({ error: 'Номер телефона должен быть от 9 до 13 символов' });
  }

  // Validate date (Kyiv timezone)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Kyiv' });
  if (booking_date < today) {
    return res.status(400).json({ error: 'Cannot book in the past' });
  }

  const createBooking = db.transaction(() => {
    // Get service duration
    const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(service_id);
    if (!service) throw new Error('Service not found');

    const master = db.prepare('SELECT * FROM masters_profiles WHERE id = ? AND is_active = 1').get(master_id);
    if (!master) throw new Error('Master not found');

    const masterService = db.prepare('SELECT * FROM master_services WHERE master_id = ? AND service_id = ?').get(master_id, service_id);
    const duration = masterService?.custom_duration || service.duration_minutes;
    const price = masterService?.custom_price || service.price;

    // Calculate end time
    const [startH, startM] = start_time.split(':').map(Number);
    const endMinutes = startH * 60 + startM + duration;
    const end_time = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;

    // ATOMIC CHECK: verify slot is still available (prevents race condition)
    const conflict = db.prepare(`
      SELECT id FROM bookings
      WHERE master_id = ? AND booking_date = ? AND status NOT IN ('cancelled')
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND start_time < ?) OR
        (start_time <= ? AND end_time >= ?)
      )
    `).get(master_id, booking_date, end_time, start_time, start_time, end_time, start_time, end_time);

    if (conflict) throw new Error('TIME_SLOT_TAKEN');

    // Check master's schedule
    const dayOfWeek = new Date(booking_date + 'T12:00:00').getDay();
    const exception = db.prepare('SELECT * FROM schedule_exceptions WHERE master_id = ? AND exception_date = ?').get(master_id, booking_date);

    if (exception && !exception.is_working) throw new Error('MASTER_DAY_OFF');

    if (!exception) {
      const schedule = db.prepare('SELECT * FROM schedules WHERE master_id = ? AND day_of_week = ?').get(master_id, dayOfWeek);
      if (!schedule || !schedule.is_working) throw new Error('MASTER_NOT_WORKING');

      // Check if slot is within working hours
      const [wStartH, wStartM] = schedule.start_time.split(':').map(Number);
      const [wEndH, wEndM] = schedule.end_time.split(':').map(Number);
      const wStart = wStartH * 60 + wStartM;
      const wEnd = wEndH * 60 + wEndM;
      const slotStart = startH * 60 + startM;

      if (slotStart < wStart || endMinutes > wEnd) throw new Error('OUTSIDE_WORKING_HOURS');
    }

    // Save phone to user profile as well
    db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(clientPhone, req.user.id);

    // Create booking
    const result = db.prepare(`
      INSERT INTO bookings (client_id, master_id, service_id, booking_date, start_time, end_time, status, price, client_notes, client_phone)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(req.user.id, master_id, service_id, booking_date, start_time, end_time, price, notes || null, clientPhone);

    return db.prepare(`
      SELECT b.*,
        s.name as service_name, s.category as service_category,
        mp.display_name as master_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN masters_profiles mp ON b.master_id = mp.id
      WHERE b.id = ?
    `).get(result.lastInsertRowid);
  });

  try {
    const booking = createBooking();
    sendMasterNewBookingNotification(booking.id).catch((e) => console.error('Master notification send failed:', e.message));
    res.status(201).json({ booking, success: true });
  } catch (error) {
    const errorMessages = {
      'TIME_SLOT_TAKEN': 'This time slot is already booked',
      'MASTER_DAY_OFF': 'Master is not working on this day',
      'MASTER_NOT_WORKING': 'Master does not work on this day of week',
      'OUTSIDE_WORKING_HOURS': 'Selected time is outside working hours',
      'Service not found': 'Service not found',
      'Master not found': 'Master not found'
    };

    const message = errorMessages[error.message] || error.message;
    const status = ['TIME_SLOT_TAKEN', 'MASTER_DAY_OFF', 'MASTER_NOT_WORKING', 'OUTSIDE_WORKING_HOURS'].includes(error.message) ? 409 : 400;

    res.status(status).json({ error: message, code: error.message });
  }
});

// PUT /api/bookings/:id/status - update booking status
router.put('/:id/status', authMiddleware, (req, res) => {
  const db = getDb();
  const { status, cancel_reason } = req.body;

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const masterProfile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
  const isMaster = masterProfile && String(masterProfile.id) === String(booking.master_id);
  const isClient = String(booking.client_id) === String(req.user.id);
  const isAdmin = req.user.role === 'admin';

  // Permission checks
  const allowedTransitions = {
    client: { pending: ['cancelled'], confirmed: ['cancelled'] },
    master: { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled', 'no_show'] },
    admin: { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled', 'no_show'], cancelled: ['pending'] }
  };

  let role = isAdmin ? 'admin' : (isMaster ? 'master' : (isClient ? 'client' : null));
  if (!role) return res.status(403).json({ error: 'Access denied' });

  const allowed = allowedTransitions[role]?.[booking.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from ${booking.status} to ${status}` });
  }

  db.prepare(`
    UPDATE bookings SET
      status = ?,
      cancelled_by = ?,
      cancel_reason = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status,
    ['cancelled'].includes(status) ? role : null,
    cancel_reason || null,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

  if (status === 'confirmed' || status === 'cancelled') {
    sendBookingNotification(req.params.id, status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled')
      .catch((e) => console.error('Notification send failed:', e.message));
  }

  res.json({ booking: updated, success: true });
});

// POST /api/bookings/:id/review - leave review
router.post('/:id/review', authMiddleware, (req, res) => {
  const db = getDb();
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND client_id = ? AND status = ?').get(req.params.id, req.user.id, 'completed');
  if (!booking) return res.status(404).json({ error: 'Completed booking not found' });

  const existing = db.prepare('SELECT * FROM reviews WHERE booking_id = ?').get(req.params.id);
  if (existing) return res.status(400).json({ error: 'Review already exists' });

  db.prepare(`
    INSERT INTO reviews (booking_id, client_id, master_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, booking.master_id, rating, comment || null);

  res.status(201).json({ success: true });
});

// GET /api/bookings/admin/all - admin: all bookings
router.get('/admin/all', authMiddleware, adminOnly, (req, res) => {
  const db = getDb();
  const { date, master_id, status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT b.*,
      s.name as service_name, s.category as service_category,
      mp.display_name as master_name,
      u_client.first_name as client_first_name, u_client.last_name as client_last_name,
      u_client.username as client_username
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u_client ON b.client_id = u_client.id
    WHERE 1=1
  `;
  const params = [];

  if (date) { query += ' AND b.booking_date = ?'; params.push(date); }
  if (master_id) { query += ' AND b.master_id = ?'; params.push(master_id); }
  if (status) { query += ' AND b.status = ?'; params.push(status); }

  query += ' ORDER BY b.booking_date DESC, b.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const bookings = db.prepare(query).all(...params);
  res.json({ bookings });
});

module.exports = router;
