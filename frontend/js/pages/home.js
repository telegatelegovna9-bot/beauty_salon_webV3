// ============================================
// HOME PAGE - ROSE GOLD VERSION
// ============================================

const HomePage = {
  async render() {
    const user = Store.get('user');
    const name = user ? Utils.getUserName(user) : 'Гость';
    const firstName = user?.first_name || name.split(' ')[0];

    return `
      <div class="page page-enter" id="home-page">
        <!-- Hero with Banner -->
        <div class="hero">
          <div class="hero-banner" id="home-hero-banner">
            <div class="hero-banner-title">Bella Luna</div>
            <div class="hero-banner-subtitle">Салон красоты премиум класса</div>
          </div>
          <div class="hero-greeting">Добро пожаловать</div>
          <div class="hero-title">Привет, ${firstName}! ✨</div>
          <div class="hero-subtitle">Запишитесь на любимую процедуру в несколько кликов</div>
          <div class="hero-cta">
            <button class="btn btn-primary" onclick="App.navigate('book')">
              💅 Записаться
            </button>
            <button class="btn btn-outline" onclick="App.navigate('portfolio')">
              Портфолио
            </button>
          </div>
        </div>

        <!-- Quick Stats (for masters/admins) -->
        ${Store.isMaster() ? '<div id="master-stats-section"></div>' : ''}

        <!-- Categories Section -->
        <div class="page-section">
          <div class="section-title">Наши услуги</div>
          <div id="home-categories-list" class="categories-grid">
            ${Utils.skeletonCard(4)}
          </div>
        </div>

        <!-- Masters Section -->
        <div class="page-section" style="padding-top:0">
          <div class="section-title">Наши мастера</div>
          <div id="home-masters-list" class="masters-h-scroll">
            ${Utils.skeletonCard(3)}
          </div>
        </div>

        <!-- Upcoming Bookings -->
        <div class="page-section" style="padding-top:0">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-md)">
            <div class="section-title" style="margin-bottom:0">Ближайшие записи</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('bookings')">Все →</button>
          </div>
          <div id="home-bookings-list">
            ${Utils.skeletonCard(2)}
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadBanner();
    await Promise.all([
      this.loadCategories(),
      this.loadMasters(),
      this.loadUpcomingBookings(),
      Store.isMaster() ? this.loadMasterStats() : Promise.resolve()
    ]);
  },


  async loadBanner() {
    try {
      const cached = localStorage.getItem('home_banner_image');
      const banner = document.getElementById('home-hero-banner');
      if (cached && banner) {
        banner.style.setProperty('--hero-image', `url('${cached}')`);
      }

      const { image_url } = await API.services.getBanner();
      if (!banner) return;
      if (!image_url) {
        localStorage.removeItem('home_banner_image');
        return;
      }
      localStorage.setItem('home_banner_image', image_url);
      if (!banner) return;
      banner.style.setProperty('--hero-image', `url('${image_url}')`);
    } catch (e) {
      console.error('Failed to load home banner:', e);
    }
  },

  async loadCategories() {
    try {
      const { categories } = await API.services.getCategories();
      Store.set('categoriesMeta', Object.fromEntries((categories || []).map(c => [c.key, {
        label: c.name,
        icon: c.emoji || '✨',
        emoji: c.emoji || '✨'
      }])));
      const container = document.getElementById('home-categories-list');
      if (!container) return;

      if (!categories || categories.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1">' + EmptyState.render('💅', 'Категории не найдены', 'Скоро здесь появятся категории услуг') + '</div>';
        return;
      }

      const maxVisible = 4;
      const renderCard = (cat) => {
        const imageStyle = cat.image_path
          ? `background-image:url('${Config.API_URL.replace('/api', '')}${cat.image_path}')`
          : '';
        return `
          <div class="category-card" onclick="App.navigate('book', { category: '${cat.key}' })">
            <div class="category-card-image" style="${imageStyle}">
              <div class="category-card-overlay">
                <div class="category-card-name">${cat.name}</div>
                <div class="category-card-price">${cat.min_price}</div>
              </div>
            </div>
          </div>
        `;
      };

      const visibleCards = categories.slice(0, maxVisible).map(renderCard).join('');
      const hiddenCards = categories.length > maxVisible
        ? categories.slice(maxVisible).map(renderCard).join('')
        : '';
      const showMoreBtn = categories.length > maxVisible
        ? `<div style="grid-column:1/-1;text-align:center;margin-top:var(--space-sm)">
            <button class="btn btn-outline btn-full" onclick="HomePage.showMoreCategories(this)">Показать ещё</button>
          </div>`
        : '';

      container.innerHTML = visibleCards
        + (hiddenCards ? `<div id="home-categories-hidden" style="display:none;contents:none">${hiddenCards}</div>` : '')
        + showMoreBtn;
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  },

  showMoreCategories(btn) {
    const hidden = document.getElementById('home-categories-hidden');
    if (!hidden) return;
    const container = document.getElementById('home-categories-list');
    if (!container) return;
    const btnWrapper = btn.parentElement;
    hidden.insertAdjacentHTML('beforebegin', hidden.innerHTML);
    hidden.remove();
    if (btnWrapper) btnWrapper.remove();
  },

  async loadMasters() {
    try {
      const { masters } = await API.masters.list();
      const container = document.getElementById('home-masters-list');
      if (!container) return;

      if (masters.length === 0) {
        container.innerHTML = '<div style="padding:var(--space-lg);color:var(--color-text-secondary);flex:1;text-align:center">' + 
          EmptyState.render('👤', 'Мастера не найдены', 'Скоро здесь появятся мастера') + '</div>';
        return;
      }

      container.innerHTML = masters.slice(0, 8).map(master =>
        MasterCard.renderVertical(master, {
          onClick: `App.navigate('master-detail', { masterId: ${master.id} })`
        })
      ).join('');
    } catch (e) {
      console.error('Failed to load masters:', e);
    }
  },

  async loadUpcomingBookings() {
    try {
      const { bookings } = await API.bookings.my({ limit: 3 });
      const container = document.getElementById('home-bookings-list');
      if (!container) return;

      const upcoming = bookings.filter(b =>
        ['pending', 'confirmed'].includes(b.status) &&
        b.booking_date >= Utils.getTodayStr()
      ).slice(0, 3);

      if (upcoming.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:var(--space-lg);color:var(--color-text-secondary)">
            <div style="font-size:32px;margin-bottom:8px">📅</div>
            <div>Нет предстоящих записей</div>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('book')" style="margin-top:12px">
              Записаться
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = upcoming.map(booking =>
        BookingCard.render(booking, {
          onClick: `App.navigate('booking-detail', { bookingId: ${booking.id} })`
        })
      ).join('');
    } catch (e) {
      console.error('Failed to load bookings:', e);
    }
  },

  async loadMasterStats() {
    try {
      const container = document.getElementById('master-stats-section');
      if (!container) return;

      const profile = await API.masters.me();
      const { bookings } = await API.bookings.masterBookings({
        date: Utils.getTodayStr(),
        limit: 10
      });

      const todayCount = bookings.length;
      const pendingCount = bookings.filter(b => b.status === 'pending').length;

      container.innerHTML = `
        <div class="page-section" style="padding-bottom:0">
          <div class="section-title">Сегодня</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-value">${todayCount}</div>
              <div class="stat-card-label">Записей</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value" style="color:var(--color-warning)">${pendingCount}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
          </div>
          ${todayCount > 0 ? `
            <div style="margin-top:var(--space-md)">
              ${bookings.slice(0, 3).map(b => `
                <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-border-light)">
                  <div style="font-weight:600;color:var(--color-primary)">${Utils.formatTime(b.start_time)}</div>
                  <div style="flex:1">
                    <div style="font-weight:500">${b.service_name}</div>
                    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">${b.client_first_name || b.client_username || 'Клиент'}</div>
                  </div>
                  <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } catch (e) {
      // Master profile might not exist yet
    }
  }
};
