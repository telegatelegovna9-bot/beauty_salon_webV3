// ============================================
// MASTER DETAIL PAGE (public view)
// ============================================

const MasterDetailPage = {
  master: null,
  activeTab: 'services',

  async render(params = {}) {
    return `<div class="page page-enter" id="master-detail-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(3)}</div>
    </div>`;
  },

  async afterRender(params = {}) {
    if (!params.masterId) { App.navigate('home'); return; }
    await this.loadMaster(params.masterId);
  },

  async loadMaster(masterId) {
    const container = document.getElementById('master-detail-page');
    if (!container) return;

    try {
      const { master, services, portfolio, reviews } = await API.masters.get(masterId);
      this.master = master;
      const name = master.display_name || Utils.getMasterName(master);
      const specs = Array.isArray(master.specializations) ? master.specializations : [];

      const shortBio = master.bio || 'Создаю образы, в которых клиенту знакома лучшая версия. Работаю с цветом, формой и характером.';
      const reviewsCount = Number(master.reviews_count) || 0;
      const reviewWord = this.getReviewWord(reviewsCount);
      const hasReviews = reviewsCount > 0;
      const hasRating = Number(master.rating) > 0;
      const experienceYears = Number(master.experience_years) || 7;
      const experienceWord = this.getYearsWord(experienceYears);
      const stats = [
        hasRating ? `⭐ ${Number(master.rating).toFixed(1)}` : '',
        hasReviews ? `<span class="master-stat-icon">💬</span> ${reviewsCount} ${reviewWord}` : '',
        `<span class="master-stat-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></span> ${experienceYears} ${experienceWord} опыта`
      ].filter(Boolean);
      container.innerHTML = `
        <div class="master-hero-bg"></div>
        <div class="master-hero-card-wrap">
          <div class="master-hero-card">
            <div class="master-hero-avatar">
              ${master.avatar_url
                ? `<img src="${master.avatar_url}" alt="${name}">`
                : Utils.getInitials(name)}
            </div>
            ${master.rating ? `<div class="master-hero-rating">⭐ ${master.rating.toFixed(1)}</div>` : ''}
            <div class="master-hero-name">${name}</div>
            ${specs.length > 0 ? `<div class="master-hero-specs">${specs.slice(0, 3).map(spec => `<span>${spec}</span>`).join('')}</div>` : ''}
            <div class="master-hero-stats">${stats.join('<span class="master-stat-dot">•</span>')}</div>
            <div class="master-hero-bio">${shortBio}</div>
            <button class="master-hero-btn" onclick="App.navigate('book', { masterId: ${master.id} })">Записаться</button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="master-tabs-row">
          <button class="master-tab active" data-tab="services" onclick="MasterDetailPage.switchTab('services')">Услуги</button>
          <button class="master-tab" data-tab="portfolio" onclick="MasterDetailPage.switchTab('portfolio')">Портфолио</button>
          <button class="master-tab" data-tab="reviews" onclick="MasterDetailPage.switchTab('reviews')">Отзывы</button>
        </div>

        <!-- Tab Content -->
        <div id="master-tab-content" style="padding:var(--space-md)">
          ${this.renderServicesTab(services)}
        </div>
      `;

      this._services = services;
      this._portfolio = portfolio;
      this._reviews = reviews;

    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  getReviewWord(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'отзыв';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'отзыва';
    return 'отзывов';
  },

  getYearsWord(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'год';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'года';
    return 'лет';
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.master-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    const content = document.getElementById('master-tab-content');
    if (!content) return;

    switch (tab) {
      case 'services': content.innerHTML = this.renderServicesTab(this._services); break;
      case 'portfolio': content.innerHTML = this.renderPortfolioTab(this._portfolio); break;
      case 'reviews': content.innerHTML = this.renderReviewsTab(this._reviews); break;
    }
  },

  renderServicesTab(services) {
    if (!services || services.length === 0) {
      return EmptyState.render('💅', 'Нет услуг', 'Мастер пока не добавил услуги');
    }
    return `<div style="display:flex;flex-direction:column;gap:var(--space-sm)">
      ${services.map(s => ServiceCard.render(s, {
        onClick: `App.navigate('book', { serviceId: ${s.id}, masterId: ${this.master?.id} })`
      })).join('')}
    </div>`;
  },

  renderPortfolioTab(portfolio) {
    if (!portfolio || portfolio.length === 0) {
      return EmptyState.render('📸', 'Нет работ', 'Портфолио пока пусто');
    }
    return `<div class="portfolio-grid">
      ${portfolio.map((item, i) => `
        <div class="portfolio-item ${item.is_featured ? 'featured' : ''}" onclick="MasterDetailPage.openPortfolioItem(${i})">
          <img src="${item.image_url}" alt="${item.title || ''}" loading="lazy">
          <div class="portfolio-item-overlay"></div>
        </div>
      `).join('')}
    </div>`;
  },

  renderReviewsTab(reviews) {
    if (!reviews || reviews.length === 0) {
      return EmptyState.render('⭐', 'Нет отзывов', 'Будьте первым, кто оставит отзыв');
    }

    const safeReviews = reviews.map(r => ({ ...r, _rating: Number(r.rating) || 0 }));
    const total = safeReviews.length;
    const avg = safeReviews.reduce((sum, r) => sum + r._rating, 0) / total;
    const stars = [5, 4, 3, 2, 1].map(star => {
      const count = safeReviews.filter(r => Math.round(r._rating) === star).length;
      const percent = total ? (count / total) * 100 : 0;
      return `<div style="display:grid;grid-template-columns:34px 1fr 24px;align-items:center;gap:8px;font-size:12px;color:var(--color-text-secondary)">
        <span style="display:flex;align-items:center;gap:2px"><span>${star}</span><span style="color:var(--color-primary)">★</span></span>
        <div style="height:6px;background:var(--color-border-light);border-radius:999px;overflow:hidden"><div style="height:100%;width:${percent}%;background:linear-gradient(135deg,#ff69b4,#ff1493)"></div></div>
        <span style="text-align:right">${count}</span>
      </div>`;
    }).join('');

    return `<div style="display:flex;flex-direction:column;gap:var(--space-sm)">
      <div class="card" style="border-radius:16px;background:#fff;border:1px solid var(--color-border-light);box-shadow:var(--shadow-sm)">
        <div class="card-body" style="display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:center;padding:14px">
          <div style="text-align:center;border-right:1px solid var(--color-border-light);padding-right:10px">
            <div style="font-size:40px;font-weight:800;line-height:1;color:var(--color-text-primary)">${avg.toFixed(1)}</div>
            <div style="color:var(--color-primary);font-size:20px;letter-spacing:1px">★★★★★</div>
            <div style="color:var(--color-text-secondary);font-size:13px">${total} ${this.getReviewWord(total)}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">${stars}</div>
        </div>
      </div>

      ${safeReviews.map(r => {
        const name = r.first_name || r.username || 'Клиент';
        const initials = Utils.getInitials(name);
        let dateTime = '';
        if (r.created_at) {
          const d = new Date(r.created_at);
          if (!Number.isNaN(d.getTime())) {
            const opts = { timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: '2-digit' };
            dateTime = d.toLocaleDateString('ru-RU', opts);
          }
        }

        return `<div class="card" style="border-radius:16px;overflow:hidden;background:#fff;border:1px solid var(--color-border-light);box-shadow:var(--shadow-sm)">
          <div class="card-body" style="padding:14px">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:10px;min-width:0">
                <div style="width:40px;height:40px;border-radius:50%;overflow:hidden;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;color:var(--color-primary-dark);font-size:12px;font-weight:700;flex-shrink:0">
                  ${r.client_avatar_url ? `<img src="${r.client_avatar_url}" alt="${name}" style="width:100%;height:100%;object-fit:cover">` : initials}
                </div>
                <div style="min-width:0">
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-size:22px;font-weight:700;line-height:1.1">${name}</div><span style="font-size:12px;color:var(--color-primary-dark);background:var(--color-bg-secondary);border:1px solid var(--color-border-light);padding:2px 8px;border-radius:999px">Клиент</span></div>
                  <div style="color:var(--color-primary);font-size:18px;line-height:1">${Utils.renderStars(r._rating)}</div>
                </div>
              </div>
              <div style="font-size:12px;color:var(--color-text-tertiary);white-space:nowrap">${dateTime}</div>
            </div>
            <div style="color:var(--color-text-secondary);font-size:14px;line-height:1.45">${r.comment || 'Без комментария'}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  openPortfolioItem(index) {
    const item = this._portfolio[index];
    if (!item) return;
    Modal.open(`
      <img src="${item.image_url}" style="width:100%;max-height:70vh;object-fit:contain;border-radius:var(--radius-md)">
      ${item.title ? `<div style="font-weight:600;margin-top:var(--space-md)">${item.title}</div>` : ''}
    `);
  }
};

// ============================================
// MASTER PROFILE PAGE (own profile management)
// ============================================

const MasterProfilePage = {
  profile: null,

  async render(params = {}) {
    return `<div class="page page-enter" id="master-profile-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(3)}</div>
    </div>`;
  },

  async afterRender() {
    await this.loadProfile();
  },

  async loadProfile() {
    const container = document.getElementById('master-profile-page');
    if (!container) return;

    try {
      const { profile, services, schedule } = await API.masters.me();
      this.profile = profile;
      const specs = Array.isArray(profile.specializations) ? profile.specializations : [];

      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <!-- Profile Card -->
          <div class="card">
            <div class="card-body">
              <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-md)">
                <div style="width:60px;height:60px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:var(--color-primary);overflow:hidden">
                  ${profile.avatar_url
                    ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" style="width:100%;height:100%;object-fit:cover">`
                    : Utils.getInitials(profile.display_name)}
                </div>
                <div>
                  <div style="font-weight:700;font-size:var(--font-size-lg)">${profile.display_name}</div>
                  <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">${specs.join(', ') || 'Нет специализаций'}</div>
                </div>
              </div>
              ${profile.bio ? `<div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);margin-bottom:var(--space-md)">${profile.bio}</div>` : ''}
              <button class="btn btn-secondary btn-full btn-sm" onclick="MasterProfilePage.showEditModal()">
                ✏️ Редактировать профиль
              </button>
            </div>
          </div>

          <!-- Services -->
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm)">
              <div class="section-title" style="margin-bottom:0">Мои услуги</div>
              <button class="btn btn-ghost btn-sm" onclick="MasterProfilePage.showAddServiceModal()">+ Добавить</button>
            </div>
            ${services.length === 0
              ? `<div style="text-align:center;padding:var(--space-lg);color:var(--color-text-secondary)">Нет услуг. Добавьте услуги, которые вы оказываете.</div>`
              : `<div style="display:flex;flex-direction:column;gap:var(--space-sm)">
                  ${services.map(s => `
                    <div class="service-card-old">
                      <div class="service-icon">${Utils.getCategoryInfo(s.category).emoji}</div>
                      <div class="service-info">
                        <div class="service-name">${s.name}</div>
                        <div class="service-meta">${Utils.formatDuration(s.custom_duration || s.duration_minutes)}</div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="service-price">${Utils.formatPrice(s.custom_price || s.price)}</div>
                        <button class="btn btn-ghost btn-sm" style="color:var(--color-error)" onclick="MasterProfilePage.removeService(${s.id})">✕</button>
                      </div>
                    </div>
                  `).join('')}
                </div>`
            }
          </div>

          <!-- Portfolio Upload -->
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-sm)">
              <div class="section-title" style="margin-bottom:0">Портфолио</div>
              <button class="btn btn-ghost btn-sm" onclick="MasterProfilePage.showAddPortfolioModal()">+ Добавить</button>
            </div>
            <div id="master-portfolio-grid"></div>
          </div>
        </div>
      `;

      await this.loadPortfolio();
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  async loadPortfolio() {
    const container = document.getElementById('master-portfolio-grid');
    if (!container || !this.profile) return;

    try {
      const { items } = await API.portfolio.masterPortfolio(this.profile.id);
      this._portfolio = items;
      if (items.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:var(--space-lg);color:var(--color-text-secondary)">Нет работ в портфолио</div>`;
        return;
      }
      container.innerHTML = `<div class="portfolio-grid">
        ${items.map(item => `
          <div class="portfolio-item">
            <img src="${item.image_url}" loading="lazy">
            <div class="portfolio-item-overlay" style="background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
              <div style="display:flex;gap:8px">
                <button onclick="MasterProfilePage.editPortfolioItem(${item.id})" style="background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px">✎</button>
                <button onclick="MasterProfilePage.deletePortfolioItem(${item.id})" style="background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px">✕</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
    } catch (e) {}
  },

  showEditModal() {
    const p = this.profile;
    const specs = Array.isArray(p.specializations) ? p.specializations : [];
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Отображаемое имя</label>
          <input class="form-input" id="mp-name" value="${p.display_name || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">О себе</label>
          <textarea class="form-input form-textarea" id="mp-bio">${p.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Специализации (через запятую)</label>
          <input class="form-input" id="mp-specs" value="${specs.join(', ')}">
        </div>
        <div class="form-group">
          <label class="form-label">Опыт (лет)</label>
          <input class="form-input" id="mp-exp" type="number" value="${p.experience_years || 0}">
        </div>
        <button class="btn btn-primary btn-full" onclick="MasterProfilePage.saveProfile()">Сохранить</button>
      </div>
    `, 'Редактировать профиль');
  },

  async saveProfile() {
    const name = document.getElementById('mp-name')?.value;
    const bio = document.getElementById('mp-bio')?.value;
    const specsStr = document.getElementById('mp-specs')?.value || '';
    const exp = parseInt(document.getElementById('mp-exp')?.value) || 0;
    const specs = specsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      await API.masters.updateMe({ display_name: name, bio, specializations: specs, experience_years: exp });
      Modal.close();
      Toast.success('Профиль обновлён');
      await this.loadProfile();
    } catch (e) {
      Toast.error(e.message || 'Ошибка сохранения');
    }
  },

  async showAddServiceModal() {
    try {
      const { services } = await API.services.list();
      Modal.open(`
        <div style="display:flex;flex-direction:column;gap:var(--space-sm);max-height:60vh;overflow-y:auto">
          ${services.map(s => `
            <div class="service-card-old" onclick="MasterProfilePage.addService(${s.id})">
              <div class="service-icon">${Utils.getCategoryInfo(s.category).emoji}</div>
              <div class="service-info">
                <div class="service-name">${s.name}</div>
                <div class="service-meta">${Utils.formatDuration(s.duration_minutes)}</div>
              </div>
              <div class="service-price">${Utils.formatPrice(s.price)}</div>
            </div>
          `).join('')}
        </div>
      `, 'Добавить услугу');
    } catch (e) {
      Toast.error('Ошибка загрузки услуг');
    }
  },

  async addService(serviceId) {
    try {
      await API.masters.addService({ service_id: serviceId });
      Modal.close();
      Toast.success('Услуга добавлена');
      await this.loadProfile();
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async removeService(serviceId) {
    try {
      await API.masters.removeService(serviceId);
      Toast.success('Услуга удалена');
      await this.loadProfile();
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async showAddPortfolioModal() {
    let meta = Store.get('categoriesMeta') || {};
    if (!Object.keys(meta).length) {
      try {
        const { categories } = await API.services.getCategories();
        Store.set('categoriesMeta', Object.fromEntries((categories || []).map(c => [c.key, {
          label: c.name,
          icon: c.emoji || '💆',
          emoji: c.emoji || '💆'
        }])));
        meta = Store.get('categoriesMeta') || {};
      } catch (e) {}
    }
    const categoryEntries = Object.keys(meta).length
      ? Object.entries(meta).map(([key, val]) => ({ key, emoji: val.emoji, label: val.label }))
      : Object.entries(Config.CATEGORIES).map(([key, val]) => ({ key, emoji: val.emoji, label: val.label }));

    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Фото (до 10 штук)</label>
          <input class="form-input" id="portfolio-files" type="file" accept="image/*" multiple>
          <div style="margin-top:6px;color:var(--color-text-tertiary);font-size:var(--font-size-xs)">Можно выбрать несколько фото — они создадут один пост-галерею.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select class="form-input form-select" id="portfolio-category">
            ${categoryEntries.map((cat) =>
              `<option value="${cat.key}">${cat.emoji || '💆'} ${cat.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Название (необязательно)</label>
          <input class="form-input" id="portfolio-title" placeholder="Название работы">
        </div>
        <button class="btn btn-primary btn-full" onclick="MasterProfilePage.addPortfolioItem()">Добавить</button>
      </div>
    `, 'Добавить в портфолио');
  },

  async addPortfolioItem() {
    const files = document.getElementById('portfolio-files')?.files;
    const category = document.getElementById('portfolio-category')?.value;
    const title = document.getElementById('portfolio-title')?.value;

    if (!files || files.length === 0) { Toast.error('Выберите хотя бы одно фото'); return; }
    if (files.length > 10) { Toast.error('Можно загрузить максимум 10 фото'); return; }
    if (!category) { Toast.error('Выберите категорию'); return; }

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));
    formData.append('category', category);
    if (title) formData.append('title', title);

    try {
      const result = await API.portfolio.create(formData);
      Modal.close();
      Toast.success(`Пост добавлен (${result?.images_count || files.length} фото)`);
      await this.loadPortfolio();
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async deletePortfolioItem(itemId) {
    try {
      await API.portfolio.delete(itemId);
      Toast.success('Удалено');
      await this.loadPortfolio();
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async editPortfolioItem(itemId) {
    const current = this._portfolio?.find(i => i.id === itemId);
    if (!current) return;
    const title = prompt('Название', current.title || '') ?? current.title;
    const description = prompt('Описание', current.description || '') ?? current.description;
    try {
      await API.portfolio.update(itemId, { title, description });
      Toast.success('Портфолио обновлено');
      await this.loadPortfolio();
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  }
};

// ============================================
// MASTER SCHEDULE PAGE
// ============================================

const MasterSchedulePage = {
  masterId: null,
  schedule: [],

  async render(params = {}) {
    return `<div class="page page-enter" id="master-schedule-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(7)}</div>
    </div>`;
  },

  async afterRender(params = {}) {
    const masterProfile = Store.get('masterProfile');
    if (!masterProfile) { App.navigate('profile'); return; }
    this.masterId = masterProfile.id;
    await this.loadSchedule();
  },

  async loadSchedule() {
    const container = document.getElementById('master-schedule-page');
    if (!container) return;

    try {
      const { schedule, breaks } = await API.schedule.getMasterSchedule(this.masterId);
      this.schedule = schedule;

      const defaultSchedule = Config.DAYS.map((day, i) => {
        const existing = schedule.find(s => s.day_of_week === i);
        return existing || { day_of_week: i, start_time: '09:00', end_time: '18:00', is_working: 0 };
      });

      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          <div style="color:var(--color-text-secondary);font-size:var(--font-size-sm);margin-bottom:var(--space-sm)">
            Настройте рабочие дни и часы
          </div>
          ${defaultSchedule.map(day => `
            <div class="card">
              <div class="card-body" style="display:flex;align-items:center;gap:var(--space-md)">
                <div style="width:36px;font-weight:600;color:${day.is_working ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'}">${Config.DAYS[day.day_of_week]}</div>
                <label class="toggle">
                  <input type="checkbox" ${day.is_working ? 'checked' : ''} onchange="MasterSchedulePage.toggleDay(${day.day_of_week}, this.checked)">
                  <span class="toggle-slider"></span>
                </label>
                <div style="flex:1;display:flex;gap:8px;${!day.is_working ? 'opacity:0.4;pointer-events:none' : ''}">
                  <input type="time" class="form-input" style="flex:1;padding:8px" value="${day.start_time}" id="start-${day.day_of_week}" onchange="MasterSchedulePage.updateTime(${day.day_of_week})">
                  <span style="align-self:center;color:var(--color-text-tertiary)">—</span>
                  <input type="time" class="form-input" style="flex:1;padding:8px" value="${day.end_time}" id="end-${day.day_of_week}" onchange="MasterSchedulePage.updateTime(${day.day_of_week})">
                </div>
              </div>
            </div>
          `).join('')}

          <button class="btn btn-primary btn-full" style="margin-top:var(--space-md)" onclick="MasterSchedulePage.saveSchedule()">
            Сохранить расписание
          </button>
        </div>
      `;

      this._currentSchedule = defaultSchedule;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  toggleDay(dayOfWeek, isWorking) {
    const day = this._currentSchedule.find(d => d.day_of_week === dayOfWeek);
    if (day) day.is_working = isWorking ? 1 : 0;
    // Update UI opacity
    const card = document.getElementById(`start-${dayOfWeek}`)?.closest('.card-body');
    if (card) {
      const timeInputs = card.querySelector('div[style*="flex:1"]');
      if (timeInputs) timeInputs.style.opacity = isWorking ? '1' : '0.4';
    }
  },

  updateTime(dayOfWeek) {
    const start = document.getElementById(`start-${dayOfWeek}`)?.value;
    const end = document.getElementById(`end-${dayOfWeek}`)?.value;
    const day = this._currentSchedule.find(d => d.day_of_week === dayOfWeek);
    if (day) { day.start_time = start; day.end_time = end; }
  },

  async saveSchedule() {
    try {
      await API.schedule.updateSchedule(this.masterId, this._currentSchedule);
      Utils.haptic('success');
      Toast.success('Расписание сохранено');
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка сохранения');
    }
  }
};

// ============================================
// MASTER BOOKINGS PAGE
// ============================================

const MasterBookingsPage = {
  activeDate: null,

  async render(params = {}) {
    this.activeDate = Utils.getTodayStr();
    return `<div class="page page-enter" id="master-bookings-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(4)}</div>
    </div>`;
  },

  async afterRender() {
    await this.loadBookings();
  },

  async loadBookings() {
    const container = document.getElementById('master-bookings-page');
    if (!container) return;

    try {
      const { bookings } = await API.bookings.masterBookings({ date: this.activeDate, limit: 50 });

      container.innerHTML = `
        <div style="padding:var(--space-md)">
          <!-- Date Picker -->
          <div style="display:flex;align-items:center;gap:var(--space-sm);margin-bottom:var(--space-md)">
            <button class="btn btn-secondary btn-sm" onclick="MasterBookingsPage.changeDate(-1)">←</button>
            <div style="flex:1;text-align:center;font-weight:600">${Utils.getRelativeDate(this.activeDate)}, ${Utils.formatDate(this.activeDate, 'short')}</div>
            <button class="btn btn-secondary btn-sm" onclick="MasterBookingsPage.changeDate(1)">→</button>
          </div>

          <!-- Bookings List -->
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${bookings.length === 0
              ? EmptyState.render('📅', 'Нет записей', 'На этот день нет записей')
              : bookings.map(b => `
                <div class="booking-card" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })">
                  <div class="booking-card-header">
                    <div class="booking-date-time">
                      <div class="booking-date">${Utils.formatTime(b.start_time)} — ${Utils.formatTime(b.end_time)}</div>
                    </div>
                    <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                  </div>
                  <div class="booking-card-body">
                    <div style="font-weight:600">${b.service_name}</div>
                    <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
                      👤 ${b.client_first_name || b.client_username || 'Клиент'}
                      ${b.client_phone ? `· 📞 ${b.client_phone}` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  changeDate(delta) {
    this.activeDate = Utils.addDays(this.activeDate, delta);
    this.loadBookings();
  }
};
