// ============================================
// MAIN APP — ROUTER & INITIALIZATION
// ============================================

const App = {
  currentPage: null,
  currentParams: {},
  history: [],
  tg: null,

  // ============================================
  // INIT
  // ============================================

  async init() {
    // Initialize Telegram WebApp
    this.tg = window.Telegram?.WebApp;
    if (this.tg) {
      this.tg.ready();
      this.tg.expand();
      // Apply Telegram theme
      this.applyTelegramTheme();
    }

    // Initialize API
    API.init();

    // Show loading
    document.getElementById('loading-screen').style.display = 'flex';

    try {
      // Authenticate user
      const { user, master_profile, client_profile } = await API.auth.login();
      Store.set('user', user);
      Store.set('clientProfile', client_profile);

      // Load master profile if admin or master
      if (user.role === 'admin' || user.role === 'master') {
        try {
          const { profile } = await API.masters.me();
          Store.set('masterProfile', profile || master_profile);
        } catch (e) {
          Store.set('masterProfile', master_profile);
        }
      } else {
        Store.set('masterProfile', master_profile);
      }

      // Check URL params for initial page
      const urlParams = new URLSearchParams(window.location.search);
      const initialPage = urlParams.get('page') || 'home';

      // Show app
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('main-app').classList.remove('hidden');

      // Navigate to initial page
      await this.navigate(initialPage);

    } catch (error) {
      console.error('App init failed:', error);
      document.getElementById('loading-screen').innerHTML = `
        <div style="text-align:center;padding:32px">
          <div style="font-size:48px;margin-bottom:16px">⚠️</div>
          <div style="font-size:18px;font-weight:600;margin-bottom:8px">Ошибка подключения</div>
          <div style="color:#666;margin-bottom:24px">${error.message || 'Не удалось подключиться к серверу'}</div>
          <button onclick="App.init()" style="background:linear-gradient(135deg,#FF69B4,#FF1493);color:white;border:none;padding:12px 24px;border-radius:12px;font-size:16px;cursor:pointer">
            Повторить
          </button>
        </div>
      `;
    }
  },

  applyTelegramTheme() {
    // Disable Telegram theme override - force our custom rose gold theme
    // This prevents Telegram's dark mode from changing our design
    if (!this.tg?.themeParams) return;

    // Set Telegram WebApp header and background to match our theme
    try {
      this.tg.setHeaderColor('#FFF5F7');
      this.tg.setBackgroundColor('#FFF5F7');
    } catch (e) {
      // Fallback if methods not available
    }

    // Force our theme colors to override any Telegram theme
    document.documentElement.style.setProperty('--color-bg', '#FFF5F7');
    document.documentElement.style.setProperty('--color-bg-secondary', '#FFE9F0');
    document.documentElement.style.setProperty('--color-surface', '#FFFFFF');
    document.documentElement.style.setProperty('--color-surface-elevated', '#FFFFFF');
    document.documentElement.style.setProperty('--color-border', '#F0D5E0');
    document.documentElement.style.setProperty('--color-border-light', '#FFE5EE');
    document.documentElement.style.setProperty('--color-text-primary', '#2D1B2E');
    document.documentElement.style.setProperty('--color-text-secondary', '#6B5B6E');
    document.documentElement.style.setProperty('--color-text-tertiary', '#9E8A9E');
  },

  // ============================================
  // ROUTING
  // ============================================

  routes: {
    'home': { page: HomePage, title: 'Bella Luna', showNav: true },
    'book': { page: BookPage, title: 'Запись', showNav: true },
    'bookings': { page: BookingsPage, title: 'Мои записи', showNav: true },
    'booking-detail': { page: BookingDetailPage, title: 'Запись', showNav: false },
    'portfolio': { page: PortfolioPage, title: 'Портфолио', showNav: true },
    'profile': { page: ProfilePage, title: 'Профиль', showNav: true },
    'master-detail': { page: MasterDetailPage, title: 'Мастер', showNav: false },
    'master-profile': { page: MasterProfilePage, title: 'Мой профиль', showNav: false },
    'master-schedule': { page: MasterSchedulePage, title: 'Расписание', showNav: false },
    'master-bookings': { page: MasterBookingsPage, title: 'Записи клиентов', showNav: false },
    'admin': { page: AdminPage, title: 'Администратор', showNav: false }
  },

  async navigate(pageName, params = {}) {
    const route = this.routes[pageName];
    if (!route) {
      console.warn(`Unknown page: ${pageName}`);
      return this.navigate('home');
    }

    // Check admin access
    if (pageName === 'admin' && !Store.isAdmin()) {
      Toast.error('Доступ запрещён');
      return;
    }

    // Check master access
    if (['master-profile', 'master-schedule', 'master-bookings'].includes(pageName) && !Store.isMaster()) {
      Toast.error('Доступ запрещён');
      return;
    }

    // Save to history
    if (this.currentPage && this.currentPage !== pageName) {
      this.history.push({ page: this.currentPage, params: this.currentParams });
    }

    this.currentPage = pageName;
    this.currentParams = params;

    // Update header
    this.setHeader(route.title);

    // Show/hide back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      if (this.history.length > 0 && !route.showNav) {
        backBtn.classList.remove('hidden');
      } else {
        backBtn.classList.add('hidden');
      }
    }

    // Show/hide bottom nav
    const bottomNav = document.getElementById('bottom-nav');
    if (bottomNav) {
      bottomNav.style.display = route.showNav ? 'flex' : 'none';
    }

    // Update active nav item
    if (route.showNav) {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
      });
    }

    // Render page
    const container = document.getElementById('page-container');
    if (!container) return;

    try {
      const html = await route.page.render(params);
      container.innerHTML = html;

      // Scroll to top
      container.scrollTo({ top: 0, behavior: 'auto' });

      // After render hook
      if (route.page.afterRender) {
        await route.page.afterRender(params);
      }

      // Setup Telegram MainButton if needed
      this.setupMainButton(pageName);

    } catch (error) {
      console.error(`Failed to render page ${pageName}:`, error);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Ошибка загрузки</div>
          <div class="empty-state-text">${error.message}</div>
          <button class="btn btn-primary" onclick="App.navigate('home')">На главную</button>
        </div>
      `;
    }
  },

  goBack() {
    if (this.currentPage === 'book' && BookPage.step > 1) {
      if (BookPage.goBack()) return;
    }

    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.navigate(prev.page, prev.params);
    } else {
      this.navigate('home');
    }
  },

  setHeader(title) {
    const el = document.getElementById('header-title');
    if (el) el.textContent = title;
  },

  setupMainButton(pageName) {
    if (!this.tg?.MainButton) return;

    // Hide main button by default
    this.tg.MainButton.hide();
  },

  // ============================================
  // TELEGRAM BACK BUTTON
  // ============================================

  setupTelegramBackButton() {
    if (!this.tg?.BackButton) return;

    this.tg.BackButton.onClick(() => {
      this.goBack();
    });

    // Show/hide based on history
    Store.on('navigation', () => {
      if (this.history.length > 0) {
        this.tg.BackButton.show();
      } else {
        this.tg.BackButton.hide();
      }
    });
  }
};

// ============================================
// CSS for master tabs (needed globally)
// ============================================

const style = document.createElement('style');
style.textContent = `
  .master-tab {
    padding: 14px 16px;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    border-bottom: 2px solid transparent;
    transition: all var(--transition-fast);
    white-space: nowrap;
    flex: 1;
    text-align: center;
  }
  .master-tab.active {
    color: var(--color-primary-dark);
    border-bottom-color: var(--color-primary);
    font-weight: 700;
  }
`;
document.head.appendChild(style);

// ============================================
// START APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
