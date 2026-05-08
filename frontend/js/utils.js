// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
  // ============================================
  // DATE & TIME
  // ============================================

  formatDate(dateStr, format = 'short') {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayOfWeek = date.getDay();

    if (format === 'short') {
      return `${day} ${Config.MONTHS_GENITIVE[month]}`;
    }
    if (format === 'full') {
      return `${Config.DAYS_FULL[dayOfWeek]}, ${day} ${Config.MONTHS_GENITIVE[month]} ${year}`;
    }
    if (format === 'medium') {
      return `${day} ${Config.MONTHS_GENITIVE[month]} ${year}`;
    }
    if (format === 'day') {
      return `${Config.DAYS_FULL[dayOfWeek]}`;
    }
    return dateStr;
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  },

  formatPrice(price, priceMax = null) {
    if (!price && price !== 0) return 'Уточните цену';
    const formatted = new Intl.NumberFormat('ru-RU').format(price);
    if (priceMax) {
      const formattedMax = new Intl.NumberFormat('ru-RU').format(priceMax);
      return `от ${formatted} ₽`;
    }
    return `${formatted} ₽`;
  },

  formatDuration(minutes) {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  },

  isToday(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  },

  isTomorrow(dateStr) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateStr === tomorrow.toISOString().split('T')[0];
  },

  getRelativeDate(dateStr) {
    if (this.isToday(dateStr)) return 'Сегодня';
    if (this.isTomorrow(dateStr)) return 'Завтра';
    return this.formatDate(dateStr, 'short');
  },

  getTodayStr() {
    return new Date().toISOString().split('T')[0];
  },

  addDays(dateStr, days) {
    const date = new Date(dateStr + 'T12:00:00');
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  },

  // ============================================
  // STRING
  // ============================================

  getUserName(user) {
    if (!user) return 'Пользователь';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    if (user.username) return `@${user.username}`;
    return `ID: ${user.telegram_id || user.id}`;
  },

  getMasterName(master) {
    if (!master) return 'Мастер';
    return master.display_name || master.master_name ||
      this.getUserName({ first_name: master.master_first_name, last_name: master.master_last_name });
  },

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  },

  truncate(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  },

  // ============================================
  // DOM
  // ============================================

  el(id) {
    return document.getElementById(id);
  },

  qs(selector, parent = document) {
    return parent.querySelector(selector);
  },

  qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'class') el.className = value;
      else if (key === 'html') el.innerHTML = value;
      else if (key === 'text') el.textContent = value;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, value);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  },

  // ============================================
  // AVATAR
  // ============================================

  renderAvatar(name, imageUrl, size = 56) {
    const fontSize = Math.max(12, Math.round(size * 0.42));
    const avatarStyle = `width:${size}px;height:${size}px;margin:0;flex-shrink:0;font-size:${fontSize}px`;
    if (imageUrl) {
      return `<div class="master-avatar" style="${avatarStyle}">
                <img src="${imageUrl}" alt="${name}" onerror="this.style.display='none';this.parentElement.querySelector('.avatar-fallback').style.display='flex'">
                <div class="avatar-fallback" style="width:100%;height:100%;display:none;align-items:center;justify-content:center">${this.getInitials(name)}</div>
              </div>`;
    }
    return `<div class="master-avatar" style="${avatarStyle}">${this.getInitials(name)}</div>`;
  },

  // ============================================
  // STARS RATING
  // ============================================

  renderStars(rating, max = 5) {
    const stars = [];
    for (let i = 1; i <= max; i++) {
      stars.push(i <= Math.round(rating) ? '★' : '☆');
    }
    return stars.join('');
  },

  // ============================================
  // DEBOUNCE
  // ============================================

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ============================================
  // HAPTIC FEEDBACK
  // ============================================

  haptic(type = 'light') {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        if (type === 'light') window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        else if (type === 'medium') window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        else if (type === 'success') window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        else if (type === 'error') window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        else if (type === 'warning') window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
      }
    } catch (e) {}
  },

  // ============================================
  // SCROLL
  // ============================================

  scrollToTop(smooth = true) {
    const container = document.getElementById('page-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }
  },

  // ============================================
  // SKELETON
  // ============================================

  skeletonCard(count = 3) {
    return Array(count).fill(0).map(() => `
      <div class="skeleton skeleton-card"></div>
    `).join('');
  },

  // ============================================
  // CATEGORY
  // ============================================

  getCategoryInfo(category) {
    const dynamic = Store.get('categoriesMeta') || {};
    if (dynamic[category]) return dynamic[category];
    return Config.CATEGORIES[category] || { label: category, icon: '💆', emoji: '💆' };
  },

  getStatusInfo(status) {
    return Config.BOOKING_STATUS[status] || { label: status, class: '' };
  }
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const Toast = {
  show(message, type = 'default', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      default: '✦'
    };

    toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 300ms ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'info')
};

// ============================================
// MODAL
// ============================================

const Modal = {
  open(content, title = '') {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');

    container.innerHTML = `
      <div class="modal-handle"></div>
      ${title ? `<div class="modal-title">${title}</div>` : ''}
      ${content}
    `;

    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');

    overlay.classList.add('hidden');
    container.classList.add('hidden');
    document.body.style.overflow = '';
  }
};
