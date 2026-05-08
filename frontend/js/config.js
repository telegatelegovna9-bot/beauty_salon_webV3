// ============================================
// APP CONFIGURATION
// ============================================

const Config = {
  // API base URL - change this to your backend URL
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : '/api',

  // App info
  APP_NAME: 'Bella Luna',
  APP_VERSION: '1.0.0',

  // Category labels and icons
  CATEGORIES: {
    manicure: { label: 'Маникюр', icon: '💅', emoji: '💅' },
    pedicure: { label: 'Педикюр', icon: '🦶', emoji: '🦶' },
    eyebrows: { label: 'Брови', icon: '✨', emoji: '✨' },
    eyelashes: { label: 'Ресницы', icon: '👁', emoji: '👁' },
    other: { label: 'Другое', icon: '💆', emoji: '💆' }
  },

  // Booking status labels
  BOOKING_STATUS: {
    pending: { label: 'Ожидает', class: 'badge-pending' },
    confirmed: { label: 'Подтверждена', class: 'badge-confirmed' },
    completed: { label: 'Завершена', class: 'badge-completed' },
    cancelled: { label: 'Отменена', class: 'badge-cancelled' },
    no_show: { label: 'Не явился', class: 'badge-no-show' }
  },

  // CRM status labels
  CRM_STATUS: {
    new: { label: 'Новый', class: 'badge-new' },
    active: { label: 'Активный', class: 'badge-active' },
    vip: { label: 'VIP', class: 'badge-vip' },
    no_show: { label: 'Не явился', class: 'badge-no-show' },
    blocked: { label: 'Заблокирован', class: 'badge-cancelled' }
  },

  // Days of week
  DAYS: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  DAYS_FULL: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],

  // Months
  MONTHS: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  MONTHS_GENITIVE: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],

  // Role labels
  ROLES: {
    admin: { label: 'Администратор', icon: '👑' },
    master: { label: 'Мастер', icon: '💅' },
    client: { label: 'Клиент', icon: '👤' }
  }
};

// Freeze config to prevent accidental modification
Object.freeze(Config);
