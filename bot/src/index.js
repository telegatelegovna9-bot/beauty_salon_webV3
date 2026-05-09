require('dotenv').config({ path: require('path').join(__dirname, '../../backend/.env') });
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
const BOT_BRIDGE_PORT = parseInt(process.env.BOT_BRIDGE_PORT || '3002', 10);

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in .env file');
  process.exit(1);
}

if (!WEBAPP_URL) {
  console.error('❌ WEBAPP_URL is not set in .env file');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Beauty Salon Bot starting...');

// ============================================
// COMMANDS
// ============================================

bot.setMyCommands([
  { command: 'start', description: '🌸 Открыть приложение салона' },
  { command: 'book', description: '📅 Записаться на услугу' },
  { command: 'mybookings', description: '📋 Мои записи' },
  { command: 'help', description: '❓ Помощь' }
]);

// /start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const param = match[1]?.trim();

  const welcomeText = `
✨ <b>Добро пожаловать в Beauty Studio!</b>

Мы рады видеть вас! 🌸

Здесь вы можете:
• 💅 Записаться на маникюр и педикюр
• 👁 Оформить брови и ресницы
• 📅 Управлять своими записями
• 👤 Просмотреть портфолио мастеров

Нажмите кнопку ниже, чтобы открыть приложение:
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '💅 Открыть Beauty Studio',
        web_app: { url: WEBAPP_URL }
      }
    ]]
  };

  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// /book command
bot.onText(/\/book/, async (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📅 Записаться',
        web_app: { url: `${WEBAPP_URL}?page=book` }
      }
    ]]
  };

  await bot.sendMessage(chatId, '📅 <b>Запись на услугу</b>\n\nОткройте приложение для записи:', {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// /mybookings command
bot.onText(/\/mybookings/, async (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '📋 Мои записи',
        web_app: { url: `${WEBAPP_URL}?page=bookings` }
      }
    ]]
  };

  await bot.sendMessage(chatId, '📋 <b>Ваши записи</b>\n\nОткройте приложение для просмотра:', {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpText = `
❓ <b>Помощь</b>

<b>Команды:</b>
/start — Открыть приложение
/book — Записаться на услугу
/mybookings — Мои записи

<b>Как записаться:</b>
1. Нажмите /start или кнопку ниже
2. Выберите услугу
3. Выберите мастера
4. Выберите дату и время
5. Подтвердите запись

<b>Вопросы?</b>
Напишите нам в чат или позвоните по телефону.
  `;

  const keyboard = {
    inline_keyboard: [[
      {
        text: '💅 Открыть приложение',
        web_app: { url: WEBAPP_URL }
      }
    ]]
  };

  await bot.sendMessage(chatId, helpText, {
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(keyboard)
  });
});

// ============================================
// CALLBACK QUERIES (from notification buttons)
// ============================================

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('confirm_')) {
    const bookingId = data.replace('confirm_', '');
    await bot.answerCallbackQuery(query.id, { text: '✅ Запись подтверждена!' });
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: '✅ Подтверждено', callback_data: 'done' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    );

    // Notify backend
    try {
      await fetch(`${BACKEND_URL}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Secret': process.env.BOT_TOKEN
        },
        body: JSON.stringify({
        status: 'confirmed'
        })
      });
    } catch (e) {
      console.error('Failed to confirm booking via API:', e.message);
    }
  }

  if (data.startsWith('cancel_')) {
    const bookingId = data.replace('cancel_', '');
    await bot.answerCallbackQuery(query.id, { text: '❌ Запись отменена' });
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [[{ text: '❌ Отменено', callback_data: 'done' }]] },
      { chat_id: chatId, message_id: query.message.message_id }
    );

    try {
      await fetch(`${BACKEND_URL}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Secret': process.env.BOT_TOKEN
        },
        body: JSON.stringify({
        status: 'cancelled',
        cancel_reason: 'Отменено клиентом через уведомление'
        })
      });
    } catch (e) {
      console.error('Failed to cancel booking via API:', e.message);
    }
  }

  if (data === 'done') {
    await bot.answerCallbackQuery(query.id);
  }
});

// ============================================
// WEB APP DATA (from WebApp)
// ============================================

bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  try {
    const data = JSON.parse(msg.web_app_data.data);

    if (data.type === 'booking_created') {
      await bot.sendMessage(chatId, `
✅ <b>Запись создана!</b>

📅 ${data.date}
🕐 ${data.time}
💅 ${data.service}
👤 Мастер: ${data.master}

Ждём вас! 🌸
      `, { parse_mode: 'HTML' });
    }
  } catch (e) {
    console.error('Failed to parse web_app_data:', e.message);
  }
});

// ============================================
// INCOMING USER MESSAGES -> BACKEND DIALOG
// ============================================

bot.on('message', async (msg) => {
  try {
    if (!msg.text) return;
    if (msg.text.startsWith('/')) return; // commands handled separately
    if (msg.web_app_data) return;

    await fetch(`${BACKEND_URL}/api/admin/dialog/incoming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Secret': process.env.BOT_TOKEN
      },
      body: JSON.stringify({
      telegram_id: msg.from?.id,
      message: msg.text,
      username: msg.from?.username,
      first_name: msg.from?.first_name,
      last_name: msg.from?.last_name
      })
    });
  } catch (e) {
    console.error('Failed to persist inbound dialog message:', e.message);
  }
});

// ============================================
// INTERNAL BOT BRIDGE (local backend -> bot)
// ============================================
const bridgeServer = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/internal/send') {
    res.statusCode = 404;
    return res.end('Not found');
  }

  if (req.headers['x-bot-secret'] !== process.env.BOT_TOKEN) {
    res.statusCode = 401;
    return res.end('Unauthorized');
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { telegramId, message, options = {} } = JSON.parse(body || '{}');
      if (!telegramId || !message) {
        res.statusCode = 400;
        return res.end('telegramId and message are required');
      }
      await bot.sendMessage(String(telegramId), message, { parse_mode: 'HTML', ...options });
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.statusCode = 500;
      res.end(`Failed: ${e.message}`);
    }
  });
});

bridgeServer.listen(BOT_BRIDGE_PORT, '127.0.0.1', () => {
  console.log(`🔌 Bot bridge listening at http://127.0.0.1:${BOT_BRIDGE_PORT}/internal/send`);
});

// ============================================
// ERROR HANDLING
// ============================================

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('Bot error:', error.message);
});

// ============================================
// EXPORT FOR NOTIFICATIONS SERVICE
// ============================================

module.exports = bot;

console.log('✅ Beauty Salon Bot is running!');
console.log(`🌐 WebApp URL: ${WEBAPP_URL}`);
console.log(`🔗 Backend URL: ${BACKEND_URL}`);
