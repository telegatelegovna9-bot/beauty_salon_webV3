const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { adminOnly, masterOrAdmin } = require('../middleware/rbac');
const { getDb } = require('../database/db');

const TIMEZONE = 'Europe/Kyiv';

function getKyivNow() {
  const now = new Date();
  const kyivDate = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  const kyivTime = now.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
  return { date: kyivDate, time: kyivTime };
}

/**
 * Generate available time slots for a master on a given date
 */
function generateSlots(startTime, endTime, durationMinutes, breaks, bookedSlots) {
  const slots = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current + durationMinutes <= end) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const slotEnd = `${String(Math.floor((current + durationMinutes) / 60)).padStart(2, '0')}:${String((current + durationMinutes) % 60).padStart(2, '0')}`;

    // Check if slot overlaps with breaks
    const inBreak = breaks.some(b => {
      const [bStartH, bStartM] = b.start_time.split(':').map(Number);
      const [bEndH, bEndM] = b.end_time.split(':').map(Number);
      const bStart = bStartH * 60 + bStartM;
      const bEnd = bEndH * 60 + bEndM;
      return current < bEnd && (current + durationMinutes) > bStart;
    });

    // Check if slot overlaps with booked slots
    const isBooked = bookedSlots.some(b => {
      const [bStartH, bStartM] = b.start_time.split(':').map(Number);
      const [bEndH, bEndM] = b.end_time.split(':').map(Number);
      const bStart = bStartH * 60 + bStartM;
      const bEnd = bEndH * 60 + bEndM;
      return current < bEnd && (current + durationMinutes) > bStart;
    });

    slots.push({
      start_time: slotStart,
      end_time: slotEnd,
      available: !inBreak && !isBooked
    });

    current += 30; // 30-minute intervals
  }

  return slots;
}

// GET /api/schedule/slots - get available slots
router.get('/slots', authMiddleware, (req, res) => {
  const db = getDb();
  const { master_id, service_id, date } = req.query;

  if (!master_id || !service_id || !date) {
    return res.status(400).json({ error: 'master_id, service_id, and date are required' });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Don't allow past dates (Kyiv timezone)
  const kyivNow = getKyivNow();
  const today = kyivNow.date;
  if (date < today) {
    return res.json({ slots: [], reason: 'past_date' });
  }

  const isToday = date === today;

  const master = db.prepare('SELECT * FROM masters_profiles WHERE id = ? AND is_active = 1').get(master_id);
  if (!master) return res.status(404).json({ error: 'Master not found' });

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(service_id);
  if (!service) return res.status(404).json({ error: 'Service not found' });

  // Get custom duration if master has it
  const masterService = db.prepare('SELECT * FROM master_services WHERE master_id = ? AND service_id = ?').get(master_id, service_id);
  const duration = masterService?.custom_duration || service.duration_minutes;

  // Check for schedule exception on this date
  const exception = db.prepare('SELECT * FROM schedule_exceptions WHERE master_id = ? AND exception_date = ?').get(master_id, date);

  if (exception && !exception.is_working) {
    return res.json({ slots: [], reason: 'day_off' });
  }

  let workStart, workEnd;

  if (exception && exception.is_working) {
    workStart = exception.start_time;
    workEnd = exception.end_time;
  } else {
    // Get day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const dayOfWeek = new Date(date + 'T12:00:00').getDay();
    const schedule = db.prepare('SELECT * FROM schedules WHERE master_id = ? AND day_of_week = ?').get(master_id, dayOfWeek);

    if (!schedule || !schedule.is_working) {
      return res.json({ slots: [], reason: 'not_working' });
    }

    workStart = schedule.start_time;
    workEnd = schedule.end_time;
  }

  // Get breaks for this day
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const breaks = db.prepare('SELECT * FROM schedule_breaks WHERE master_id = ? AND day_of_week = ?').all(master_id, dayOfWeek);

  // Get existing bookings for this date
  const bookedSlots = db.prepare(`
    SELECT start_time, end_time FROM bookings
    WHERE master_id = ? AND booking_date = ? AND status NOT IN ('cancelled')
  `).all(master_id, date);

  let slots = generateSlots(workStart, workEnd, duration, breaks, bookedSlots);

  // Mark past slots as unavailable for today
  if (isToday) {
    const [nowH, nowM] = kyivNow.time.split(':').map(Number);
    const nowMinutes = nowH * 60 + nowM;
    slots = slots.map(slot => {
      const [slotH, slotM] = slot.start_time.split(':').map(Number);
      const slotMinutes = slotH * 60 + slotM;
      if (slotMinutes <= nowMinutes) {
        return { ...slot, available: false, past: true };
      }
      return slot;
    });
  }

  res.json({
    slots,
    work_hours: { start: workStart, end: workEnd },
    duration,
    date
  });
});

// GET /api/schedule/master/:masterId - get master's schedule
router.get('/master/:masterId', authMiddleware, (req, res) => {
  const db = getDb();
  const { masterId } = req.params;

  // Check access: admin or own profile
  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(masterId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const schedule = db.prepare('SELECT * FROM schedules WHERE master_id = ? ORDER BY day_of_week').all(masterId);
  const breaks = db.prepare('SELECT * FROM schedule_breaks WHERE master_id = ?').all(masterId);
  const todayKyiv = getKyivNow().date;
  const exceptions = db.prepare(`
    SELECT * FROM schedule_exceptions 
    WHERE master_id = ? AND exception_date >= ?
    ORDER BY exception_date
  `).all(masterId, todayKyiv);

  res.json({ schedule, breaks, exceptions });
});

// PUT /api/schedule/master/:masterId - update schedule
router.put('/master/:masterId', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { masterId } = req.params;
  const { schedule } = req.body;

  // Check access
  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(masterId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  if (!Array.isArray(schedule)) {
    return res.status(400).json({ error: 'schedule must be an array' });
  }

  const updateSchedule = db.transaction(() => {
    const upsert = db.prepare(`
      INSERT INTO schedules (master_id, day_of_week, start_time, end_time, is_working)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(master_id, day_of_week) DO UPDATE SET
        start_time = excluded.start_time,
        end_time = excluded.end_time,
        is_working = excluded.is_working,
        updated_at = CURRENT_TIMESTAMP
    `);

    schedule.forEach(day => {
      upsert.run(masterId, day.day_of_week, day.start_time || '09:00', day.end_time || '18:00', day.is_working ? 1 : 0);
    });
  });

  updateSchedule();

  const updated = db.prepare('SELECT * FROM schedules WHERE master_id = ? ORDER BY day_of_week').all(masterId);
  res.json({ schedule: updated });
});

// POST /api/schedule/master/:masterId/breaks - add break
router.post('/master/:masterId/breaks', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { masterId } = req.params;
  const { day_of_week, start_time, end_time, label } = req.body;

  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(masterId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  const result = db.prepare(`
    INSERT INTO schedule_breaks (master_id, day_of_week, start_time, end_time, label)
    VALUES (?, ?, ?, ?, ?)
  `).run(masterId, day_of_week, start_time, end_time, label || 'Перерыв');

  const breakItem = db.prepare('SELECT * FROM schedule_breaks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ break: breakItem });
});

// DELETE /api/schedule/master/:masterId/breaks/:breakId
router.delete('/master/:masterId/breaks/:breakId', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { masterId, breakId } = req.params;

  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(masterId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  db.prepare('DELETE FROM schedule_breaks WHERE id = ? AND master_id = ?').run(breakId, masterId);
  res.json({ success: true });
});

// POST /api/schedule/master/:masterId/exceptions - add exception day
router.post('/master/:masterId/exceptions', authMiddleware, masterOrAdmin, (req, res) => {
  const db = getDb();
  const { masterId } = req.params;
  const { exception_date, is_working, start_time, end_time, reason } = req.body;

  if (req.user.role !== 'admin') {
    const profile = db.prepare('SELECT * FROM masters_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile || String(profile.id) !== String(masterId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  db.prepare(`
    INSERT INTO schedule_exceptions (master_id, exception_date, is_working, start_time, end_time, reason)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(master_id, exception_date) DO UPDATE SET
      is_working = excluded.is_working,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      reason = excluded.reason
  `).run(masterId, exception_date, is_working ? 1 : 0, start_time || null, end_time || null, reason || null);

  res.json({ success: true });
});

module.exports = router;
