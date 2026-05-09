const cron = require('node-cron');
const { getDb } = require('../database/db');

async function sendTelegramMessage(telegramId, message, options = {}) {
  const botBridgeUrl = process.env.BOT_BRIDGE_URL || 'http://127.0.0.1:3002';
  const botSecret = process.env.BOT_TOKEN;
  if (!botSecret) {
    console.warn('BOT_TOKEN not set, cannot call bot bridge');
    return false;
  }

  try {
    const resp = await fetch(`${botBridgeUrl}/internal/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Secret': botSecret
      },
      body: JSON.stringify({
        telegramId: String(telegramId),
        message,
        options
      })
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`Bot bridge failed for ${telegramId}: HTTP ${resp.status} ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to send message to ${telegramId}:`, error.message);
    return false;
  }
}

function formatBookingMessage(booking, type) {
  const date = new Date(booking.booking_date + 'T' + booking.start_time);
  const dateStr = date.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = booking.start_time;

  const messages = {
    reminder_24h: `
⏰ <b>Напоминание о записи</b>

Завтра у вас запись:
📅 ${dateStr}
🕐 ${timeStr}
💅 ${booking.service_name}
👤 Мастер: ${booking.master_name}
💰 Стоимость: ${booking.price ? booking.price + ' ₽' : 'уточните у мастера'}

Ждём вас! 🌸`,

    reminder_2h: `
⏰ <b>Скоро ваша запись!</b>

Через 2 часа:
🕐 ${timeStr}
💅 ${booking.service_name}
👤 Мастер: ${booking.master_name}

Не забудьте! 💕`,

    booking_confirmed: `
✅ <b>Запись подтверждена!</b>

📅 ${dateStr}
🕐 ${timeStr}
💅 ${booking.service_name}
👤 Мастер: ${booking.master_name}
💰 Стоимость: ${booking.price ? booking.price + ' ₽' : 'уточните у мастера'}

Ждём вас! 🌸`,

    booking_cancelled: `
❌ <b>Запись отменена</b>

📅 ${dateStr}
🕐 ${timeStr}
💅 ${booking.service_name}

Вы можете записаться на другое время через приложение.`
    ,

    booking_completed: `
✨ <b>Визит завершён</b>

Спасибо, что выбрали нас! 💖

Если вам удобно, поделитесь впечатлением о визите:
зайдите в мини‑приложение → раздел «Записи» → завершённая услуга → «Оставить отзыв».

Ваш отзыв помогает нам становиться лучше 🌸`
    ,

    new_booking_master: `
🔔 <b>Новая запись</b>

📅 ${dateStr}
🕐 ${timeStr}
💅 ${booking.service_name}
👤 Клиент: ${booking.client_name || 'Клиент'}
📞 Телефон: ${booking.client_phone || 'не указан'}
💰 Стоимость: ${booking.price ? booking.price + ' ₽' : 'уточните в приложении'}

Проверьте детали в приложении.`
  };

  return messages[type] || '';
}

async function sendReminder(booking, type) {
  const db = getDb();

  const fullBooking = db.prepare(`
    SELECT b.*,
      s.name as service_name,
      mp.display_name as master_name,
      u.telegram_id as client_telegram_id
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u ON b.client_id = u.id
    WHERE b.id = ?
  `).get(booking.id);

  if (!fullBooking) return;

  const message = formatBookingMessage(fullBooking, type);
  if (!message) return;

  const inlineKeyboard = {
    inline_keyboard: [[
      { text: '✅ Подтвердить', callback_data: `confirm_${booking.id}` },
      { text: '❌ Отменить', callback_data: `cancel_${booking.id}` }
    ]]
  };

  const sent = await sendTelegramMessage(
    fullBooking.client_telegram_id,
    message,
    { reply_markup: JSON.stringify(inlineKeyboard) }
  );

  // Log notification
  db.prepare(`
    INSERT INTO notifications_log (user_id, booking_id, type, message, status, sent_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    fullBooking.client_id,
    booking.id,
    type,
    message,
    sent ? 'sent' : 'failed'
  );

  // Mark as sent
  if (sent) {
    if (type === 'reminder_24h') {
      db.prepare('UPDATE bookings SET reminder_24h_sent = 1 WHERE id = ?').run(booking.id);
    } else if (type === 'reminder_2h') {
      db.prepare('UPDATE bookings SET reminder_2h_sent = 1 WHERE id = ?').run(booking.id);
    }
  }
}

async function sendBookingNotification(bookingId, type) {
  const db = getDb();

  const booking = db.prepare(`
    SELECT b.*,
      s.name as service_name,
      mp.display_name as master_name,
      u.telegram_id as client_telegram_id
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u ON b.client_id = u.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) return;

  const message = formatBookingMessage(booking, type);
  if (!message) return;

  const sent = await sendTelegramMessage(booking.client_telegram_id, message);

  const logType = ['reminder_24h', 'reminder_2h', 'booking_confirmed', 'booking_cancelled', 'booking_rescheduled', 'custom']
    .includes(type) ? type : 'custom';

  db.prepare(`
    INSERT INTO notifications_log (user_id, booking_id, type, message, status, sent_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    booking.client_id,
    bookingId,
    logType,
    message,
    sent ? 'sent' : 'failed'
  );
}

async function sendMasterNewBookingNotification(bookingId) {
  const db = getDb();
  const booking = db.prepare(`
    SELECT b.*,
      s.name as service_name,
      mp.display_name as master_name,
      u_master.telegram_id as master_telegram_id,
      COALESCE(u_client.first_name || ' ' || u_client.last_name, u_client.username, 'Клиент') as client_name
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    JOIN masters_profiles mp ON b.master_id = mp.id
    JOIN users u_master ON mp.user_id = u_master.id
    JOIN users u_client ON b.client_id = u_client.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking || !booking.master_telegram_id) return;

  const message = formatBookingMessage(booking, 'new_booking_master');
  if (!message) return;

  const sent = await sendTelegramMessage(booking.master_telegram_id, message);
  db.prepare(`
    INSERT INTO notifications_log (user_id, booking_id, type, message, status, sent_at)
    VALUES (?, ?, 'custom', ?, ?, CURRENT_TIMESTAMP)
  `).run(
    db.prepare('SELECT user_id FROM masters_profiles WHERE id = ?').get(booking.master_id)?.user_id || null,
    bookingId,
    message,
    sent ? 'sent' : 'failed'
  );
}

function startNotificationScheduler() {
  // Check every 30 minutes for upcoming reminders
  cron.schedule('*/30 * * * *', async () => {
    const db = getDb();
    const now = new Date();
    const TIMEZONE = 'Europe/Kyiv';

    // 24-hour reminders
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toLocaleDateString('en-CA', { timeZone: TIMEZONE });

    const bookings24h = db.prepare(`
      SELECT * FROM bookings
      WHERE booking_date = ? AND status IN ('pending', 'confirmed') AND reminder_24h_sent = 0
    `).all(tomorrowDate);

    for (const booking of bookings24h) {
      await sendReminder(booking, 'reminder_24h');
    }

    // 2-hour reminders
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const todayDate = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
    const kyivIn2h = in2Hours.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false });
    const targetHour = kyivIn2h.split(':')[0];
    const targetMinute = kyivIn2h.split(':')[1];
    const targetTime = `${targetHour}:${targetMinute}`;

    const bookings2h = db.prepare(`
      SELECT * FROM bookings
      WHERE booking_date = ? AND start_time BETWEEN ? AND ?
      AND status IN ('pending', 'confirmed') AND reminder_2h_sent = 0
    `).all(todayDate, targetTime, `${targetHour}:59`);

    for (const booking of bookings2h) {
      await sendReminder(booking, 'reminder_2h');
    }
  });

  console.log('✅ Notification scheduler started');
}

module.exports = { sendBookingNotification, sendMasterNewBookingNotification, sendTelegramMessage, startNotificationScheduler };
