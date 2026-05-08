// ============================================
// PORTFOLIO PAGE - ROSE GOLD VERSION
// ============================================

const PortfolioPage = {
  activeCategory: 'all',
  items: [],
  categories: [],

  async render(params = {}) {
    await this.loadCategories();
    return `
      <div class="page page-enter" id="portfolio-page">
        <div style="margin:0 calc(-1 * var(--space-md))">
          ${CategoryTabs.render(this.categories, this.activeCategory, 'PortfolioPage.filterCategory')}
        </div>
        <div id="portfolio-grid-container" style="padding:var(--space-md)">
          <div class="portfolio-grid">
            ${Array(4).fill('').map(() => `
              <div class="skeleton" style="aspect-ratio:1;border-radius:var(--radius-md)"></div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async afterRender(params = {}) {
    await this.loadPortfolio();
  },

  filterCategory(category) {
    this.activeCategory = category;
    // Re-render tabs
    const tabsContainer = document.querySelector('#portfolio-page .category-tabs');
    if (tabsContainer) {
      tabsContainer.outerHTML = CategoryTabs.render(this.categories, category, 'PortfolioPage.filterCategory');
    }
    this.renderGrid();
  },

  async loadCategories() {
    try {
      const { categories } = await API.services.getCategories();
      this.categories = (categories || []).map(c => c.key);
      Store.set('categoriesMeta', Object.fromEntries((categories || []).map(c => [c.key, {
        label: c.name,
        icon: c.emoji || '💆',
        emoji: c.emoji || '💆'
      }])));
    } catch (e) {
      this.categories = Object.keys(Config.CATEGORIES);
    }
  },

  async loadPortfolio() {
    try {
      const params = {};
      if (this.activeCategory !== 'all') params.category = this.activeCategory;
      const { items } = await API.portfolio.list(params);
      this.items = items;
      this.renderGrid();
    } catch (e) {
      const container = document.getElementById('portfolio-grid-container');
      if (container) container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  renderGrid() {
    const container = document.getElementById('portfolio-grid-container');
    if (!container) return;

    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    if (filtered.length === 0) {
      container.innerHTML = EmptyState.render('📸', 'Нет работ', 'Портфолио пока пусто');
      return;
    }

    container.innerHTML = `
      <div class="portfolio-grid">
        ${filtered.map((item, index) => `
          <div class="portfolio-item ${item.is_featured ? 'featured' : ''} stagger-item"
               onclick="PortfolioPage.openItem(${index})"
               style="animation-delay:${index * 30}ms">
            <div class="portfolio-item-image-wrap">
              <img src="${item.image_url}" alt="${item.title || item.category}"
                   loading="lazy"
                   onerror="this.parentElement.style.background='var(--color-bg-secondary)'">
              <div class="portfolio-item-overlay"></div>
            </div>
            <div class="portfolio-item-content">
              <div class="portfolio-master-meta">
                <div class="portfolio-master-avatar">
                  ${item.master_avatar_url
                    ? `<img src="${item.master_avatar_url}" alt="${item.master_name || 'Мастер'}" loading="lazy">`
                    : Utils.getInitials(item.master_name || 'Мастер')}
                </div>
                <div>
                  <div class="portfolio-master-name">${item.master_name || 'Мастер'}</div>
                  <div class="portfolio-master-category">${Utils.getCategoryInfo(item.category).label}</div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  openItem(index, imgIndex = 0) {
    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    const item = filtered[index];
    if (!item) return;

    Utils.haptic('light');

    const images = (() => {
      try {
        const parsed = item.image_urls ? JSON.parse(item.image_urls) : [];
        return Array.isArray(parsed) && parsed.length ? parsed : [item.image_url];
      } catch (_) {
        return [item.image_url];
      }
    })();

    const image = images[imgIndex] || images[0];
    Modal.open(`
      <div style="margin:-var(--space-md);overflow:hidden;max-height:82vh">
        <div id="portfolio-gallery-swipe"
             ontouchstart="PortfolioPage.onGalleryTouchStart(event)"
             ontouchend="PortfolioPage.onGalleryTouchEnd(event, ${index}, ${imgIndex}, ${images.length})"
             onwheel="PortfolioPage.onGalleryWheel(event, ${index}, ${imgIndex}, ${images.length})"
             onclick="PortfolioPage.onGalleryClick(event, ${index}, ${imgIndex}, ${images.length})"
             style="touch-action:pan-x;user-select:none;cursor:pointer">
          <div style="height:min(62vh,520px);border-radius:var(--radius-md);overflow:hidden;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;margin-bottom:var(--space-sm)">
            <img src="${image}" alt="${item.title || ''}"
                 style="width:100%;height:100%;object-fit:cover;display:block">
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">
          ${item.master_name ? `<span class="chip">👤 ${item.master_name}</span>` : ''}
          <span class="chip chip-primary">${Utils.getCategoryInfo(item.category).emoji} ${Utils.getCategoryInfo(item.category).label}</span>
        </div>
        ${images.length > 1 ? `<div style="text-align:center;font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-top:6px">${imgIndex + 1} / ${images.length}</div>` : ''}
        ${index > 0 || index < filtered.length - 1 ? `
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md)">
            ${index > 0 ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.close();PortfolioPage.openItem(${index-1}, 0)">← Пред. пост</button>` : ''}
            ${index < filtered.length - 1 ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.close();PortfolioPage.openItem(${index+1}, 0)">След. пост →</button>` : ''}
          </div>
        ` : ''}
      </div>
    `);
  },


  openGalleryStep(postIndex, imgIndex, total, step) {
    const nextIndex = imgIndex + step;
    if (nextIndex < 0 || nextIndex >= total) return;
    Modal.close();
    this.openItem(postIndex, nextIndex);
  },

  onGalleryWheel(event, postIndex, imgIndex, total) {
    if (Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    this.openGalleryStep(postIndex, imgIndex, total, event.deltaY > 0 ? 1 : -1);
  },

  onGalleryClick(event, postIndex, imgIndex, total) {
    const rect = event.currentTarget.getBoundingClientRect();
    const isRightSide = (event.clientX - rect.left) > rect.width / 2;
    this.openGalleryStep(postIndex, imgIndex, total, isRightSide ? 1 : -1);
  },

  onGalleryTouchStart(event) {
    this._galleryTouchStartX = event.changedTouches?.[0]?.clientX || 0;
  },

  onGalleryTouchEnd(event, postIndex, imgIndex, total) {
    const endX = event.changedTouches?.[0]?.clientX || 0;
    const deltaX = endX - (this._galleryTouchStartX || 0);
    if (Math.abs(deltaX) < 35) return;

    if (deltaX < 0) {
      this.openGalleryStep(postIndex, imgIndex, total, 1);
      return;
    }
    if (deltaX > 0) {
      this.openGalleryStep(postIndex, imgIndex, total, -1);
    }
  }

};
