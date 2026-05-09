// ============================================
// BOOKING PAGE (4-step flow)
// ============================================

const BookPage = {
  step: 1,
  totalSteps: 4,
  state: {
    service: null,
    master: null,
    date: null,
    slot: null,
    services: [],
    masters: [],
    slots: [],
    activeCategory: 'all',
    loading: false
  },

  async render(params = {}) {
    // Reset state
    this.step = 1;
    this.state.service = null;
    this.state.master = null;
    this.state.date = null;
    this.state.slot = null;
    this.state.activeCategory = 'all';

    // Pre-select service if passed
    if (params.serviceId) {
      try {
        const { service } = await API.services.get(params.serviceId);
        this.state.service = service;
        this.step = 2;
      } catch (e) {}
    }

    // Pre-select category if passed
    if (params.category) {
      this.state.activeCategory = params.category;
    }

    return `<div class="page page-enter" id="book-page"></div>`;
  },

  async afterRender(params = {}) {
    await this.renderStep();
  },

  async renderStep() {
    const container = document.getElementById('book-page');
    if (!container) return;

    // Update header
    App.setHeader(`Запись — шаг ${this.step} из ${this.totalSteps}`);

    const stepLabels = ['Услуга', 'Мастер', 'Дата', 'Подтверждение'];
    const stepsHtml = StepIndicator.render(stepLabels, this.step);

    let contentHtml = '';
    switch (this.step) {
      case 1: contentHtml = await this.renderStep1(); break;
      case 2: contentHtml = await this.renderStep2(); break;
      case 3: contentHtml = await this.renderStep3(); break;
      case 4: contentHtml = this.renderStep4(); break;
    }

    container.innerHTML = `
      ${stepsHtml}
      <div id="step-content" style="padding:0 var(--space-md) var(--space-lg)">
        ${contentHtml}
      </div>
    `;

    // Post-render setup
    if (this.step === 3) {
      this.initCalendar();
    }
  },

  // ============================================
  // STEP 1: SELECT SERVICE
  // ============================================

  async renderStep1() {
    if (this.state.services.length === 0) {
      try {
        const { services } = await API.services.list();
        this.state.services = services;
        const { categories } = await API.services.getCategories();
        Store.set('categoriesMeta', Object.fromEntries((categories || []).map(c => [c.key, {
          label: c.name,
          icon: c.emoji || '💆',
          emoji: c.emoji || '💆'
        }])));
      } catch (e) {
        return `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Ошибка загрузки</div></div>`;
      }
    }

    const categories = [...new Set(this.state.services.map(s => s.category))];
    const filtered = this.state.activeCategory === 'all'
      ? this.state.services
      : this.state.services.filter(s => s.category === this.state.activeCategory);

    return `
      <div style="margin:0 calc(-1 * var(--space-md))">
        ${CategoryTabs.render(categories, this.state.activeCategory, 'BookPage.filterCategory')}
      </div>
      <div style="margin-top:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
        ${filtered.map(service =>
          ServiceCard.render(service, {
            selected: this.state.service?.id === service.id,
            onClick: `BookPage.selectService(${service.id})`
          })
        ).join('')}
      </div>
    `;
  },

  filterCategory(category) {
    this.state.activeCategory = category;
    this.renderStep();
  },

  selectService(serviceId) {
    const service = this.state.services.find(s => s.id === serviceId);
    if (!service) return;
    this.state.service = service;
    this.state.master = null; // Reset master when service changes
    this.state.masters = [];
    Utils.haptic('light');
    this.goToStep(2);
  },

  // ============================================
  // STEP 2: SELECT MASTER
  // ============================================

  async renderStep2() {
    if (!this.state.service) {
      this.step = 1;
      return this.renderStep1();
    }

    if (this.state.masters.length === 0) {
      try {
        const { masters } = await API.masters.list(this.state.service.id);
        this.state.masters = masters;
      } catch (e) {
        return `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Ошибка загрузки</div></div>`;
      }
    }

    if (this.state.masters.length === 0) {
      return EmptyState.render('👤', 'Нет доступных мастеров', 'Для этой услуги пока нет мастеров', 'Назад', 'BookPage.goToStep(1)');
    }

    return `
      <div style="margin-bottom:var(--space-md)">
        <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary);margin-bottom:var(--space-sm)">
          Выбранная услуга:
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--color-bg-secondary);border-radius:var(--radius-md)">
          <span style="font-weight:600">${this.state.service.name}</span>
          <span style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">· ${Utils.formatDuration(this.state.service.duration_minutes)}</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${this.state.masters.map(master =>
          MasterCard.render(master, {
            selected: this.state.master?.id === master.id,
            onClick: `BookPage.selectMaster(${master.id})`
          })
        ).join('')}
      </div>
    `;
  },

  selectMaster(masterId) {
    const master = this.state.masters.find(m => m.id === masterId);
    if (!master) return;
    this.state.master = master;
    this.state.date = null;
    this.state.slot = null;
    Utils.haptic('light');
    this.goToStep(3);
  },

  // ============================================
  // STEP 3: SELECT DATE & TIME
  // ============================================

  async renderStep3() {
    if (!this.state.service || !this.state.master) {
      this.step = 2;
      return this.renderStep2();
    }

    const masterName = this.state.master.display_name || Utils.getMasterName(this.state.master);

    return `
      <div style="margin-bottom:var(--space-md)">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--color-bg-secondary);border-radius:var(--radius-md)">
          ${Utils.renderAvatar(masterName, this.state.master.avatar_url, 32)}
          <span style="font-weight:600">${masterName}</span>
        </div>
      </div>

      <!-- Calendar -->
      <div id="calendar-container" style="margin-bottom:var(--space-lg)"></div>

      <!-- Time Slots -->
      <div id="slots-section" style="display:none">
        <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--color-text-secondary);margin-bottom:var(--space-sm);text-transform:uppercase;letter-spacing:0.05em">
          Доступное время
        </div>
        <div id="slots-container"></div>
      </div>

      <!-- Loading slots -->
      <div id="slots-loading" style="display:none;text-align:center;padding:var(--space-lg)">
        <div class="loading-spinner" style="margin:0 auto"></div>
      </div>

      <!-- Next button -->
      <div id="step3-next" style="display:none;margin-top:var(--space-lg)">
        <button class="btn btn-primary btn-full" onclick="BookPage.goToStep(4)">
          Продолжить →
        </button>
      </div>
    `;
  },

  initCalendar() {
    Calendar.init('calendar-container', {
      minDate: Utils.getTodayStr(),
      selectedDate: this.state.date,
      onSelect: (date) => {
        this.state.date = date;
        this.state.slot = null;
        this.loadSlots(date);
      }
    });
  },

  async loadSlots(date) {
    const slotsSection = document.getElementById('slots-section');
    const slotsLoading = document.getElementById('slots-loading');
    const slotsContainer = document.getElementById('slots-container');
    const nextBtn = document.getElementById('step3-next');

    if (!slotsSection || !slotsLoading) return;

    slotsSection.style.display = 'none';
    slotsLoading.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'none';

    try {
      const { slots, reason } = await API.schedule.getSlots(
        this.state.master.id,
        this.state.service.id,
        date
      );

      slotsLoading.style.display = 'none';
      slotsSection.style.display = 'block';

      TimeSlots._containerId = 'slots-container';
      TimeSlots.render('slots-container', slots, {
        selectedSlot: this.state.slot,
        onSelect: (slot) => {
          this.state.slot = slot;
          if (nextBtn) nextBtn.style.display = 'block';
          Utils.haptic('light');
        }
      });
    } catch (e) {
      slotsLoading.style.display = 'none';
      slotsSection.style.display = 'block';
      if (slotsContainer) {
        slotsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Ошибка загрузки слотов</div></div>`;
      }
    }
  },

  // ============================================
  // STEP 4: CONFIRMATION
  // ============================================

  renderStep4() {
    if (!this.state.service || !this.state.master || !this.state.date || !this.state.slot) {
      this.step = 3;
      this.renderStep();
      return '';
    }

    const masterName = this.state.master.display_name || Utils.getMasterName(this.state.master);
    const price = this.state.master.custom_price || this.state.service.price;

    return `
      <div style="margin-bottom:var(--space-lg)">
        <div class="summary-card">
          <div class="summary-card-title">Детали записи</div>
          <div class="summary-row">
            <span class="summary-label">Услуга</span>
            <span class="summary-value">${this.state.service.name}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Мастер</span>
            <span class="summary-value">${masterName}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Дата</span>
            <span class="summary-value">${Utils.formatDate(this.state.date, 'full')}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Время</span>
            <span class="summary-value">${Utils.formatTime(this.state.slot.start_time)} — ${Utils.formatTime(this.state.slot.end_time)}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Длительность</span>
            <span class="summary-value">${Utils.formatDuration(this.state.service.duration_minutes)}</span>
          </div>
          <div class="summary-total">
            <span class="summary-total-label">Стоимость</span>
            <span class="summary-total-value">${Utils.formatPrice(price)}</span>
          </div>
        </div>
      </div>

      <!-- Phone -->
      <div class="form-group">
        <label class="form-label">Номер телефона <span style="color:var(--color-primary)">*</span></label>
        <input class="form-input" id="booking-phone" type="tel" value="${(Store.get('user') || {}).phone || ''}" placeholder="Введите номер телефона" required>
      </div>

      <!-- Notes -->
      <div class="form-group">
        <label class="form-label">Комментарий (необязательно)</label>
        <textarea class="form-input form-textarea" id="booking-notes" placeholder="Пожелания, особые требования..."></textarea>
      </div>

      <!-- Confirm Button -->
      <button class="btn btn-primary btn-full btn-lg" id="confirm-btn" onclick="BookPage.confirmBooking()">
        ✓ Подтвердить запись
      </button>

      <div style="text-align:center;margin-top:var(--space-md);font-size:var(--font-size-sm);color:var(--color-text-tertiary)">
        Вы получите уведомление о подтверждении
      </div>
    `;
  },

  async confirmBooking() {
    const btn = document.getElementById('confirm-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Создаём запись...';
    }

    try {
      const phone = document.getElementById('booking-phone')?.value?.trim() || '';
      if (!phone) {
        Toast.error('Укажите номер телефона');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '\u2713 Подтвердить запись';
        }
        document.getElementById('booking-phone')?.focus();
        return;
      }
      if (phone.length < 9 || phone.length > 13) {
        Toast.error('Номер телефона должен быть от 9 до 13 символов');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '\u2713 Подтвердить запись';
        }
        document.getElementById('booking-phone')?.focus();
        return;
      }
      const notes = document.getElementById('booking-notes')?.value || '';

      const { booking } = await API.bookings.create({
        master_id: this.state.master.id,
        service_id: this.state.service.id,
        booking_date: this.state.date,
        start_time: this.state.slot.start_time,
        notes: notes || undefined,
        client_phone: phone
      });

      Utils.haptic('success');

      // Show success screen
      const container = document.getElementById('book-page');
      if (container) {
        container.innerHTML = `
          <div style="min-height:60vh;display:flex;align-items:center;justify-content:center">
            <div class="success-animation">
              <div class="success-circle">
                <span class="success-icon">✓</span>
              </div>
              <div style="text-align:center">
                <div style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:8px">Запись создана!</div>
                <div style="color:var(--color-text-secondary);margin-bottom:var(--space-lg)">
                  ${Utils.formatDate(this.state.date, 'full')}<br>
                  в ${Utils.formatTime(this.state.slot.start_time)}
                </div>
              </div>
              <button class="btn btn-primary" onclick="App.navigate('bookings')">
                Мои записи
              </button>
              <button class="btn btn-ghost" onclick="BookPage.resetAndStart()">
                Записаться ещё
              </button>
            </div>
          </div>
        `;
      }

      App.setHeader('Beauty Studio');

      // Notify Telegram WebApp
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify({
          type: 'booking_created',
          date: Utils.formatDate(this.state.date, 'full'),
          time: Utils.formatTime(this.state.slot.start_time),
          service: this.state.service.name,
          master: this.state.master.display_name || Utils.getMasterName(this.state.master)
        }));
      }

      Store.resetBooking();

    } catch (error) {
      Utils.haptic('error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '✓ Подтвердить запись';
      }

      const errorMessages = {
        'TIME_SLOT_TAKEN': 'Этот слот уже занят. Выберите другое время.',
        'MASTER_DAY_OFF': 'Мастер не работает в этот день.',
        'MASTER_NOT_WORKING': 'Мастер не работает в этот день недели.',
        'OUTSIDE_WORKING_HOURS': 'Выбранное время вне рабочих часов.'
      };

      const msg = errorMessages[error.data?.code] || error.message || 'Ошибка создания записи';
      Toast.error(msg);

      if (error.data?.code === 'TIME_SLOT_TAKEN') {
        // Go back to time selection
        this.state.slot = null;
        this.goToStep(3);
      }
    }
  },

  resetAndStart() {
    this.step = 1;
    this.state = {
      service: null, master: null, date: null, slot: null,
      services: this.state.services, masters: [], slots: [],
      activeCategory: 'all', loading: false
    };
    this.renderStep();
  },

  // ============================================
  // NAVIGATION
  // ============================================

  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    this.step = step;
    Utils.scrollToTop(false);
    this.renderStep();
  },

  goBack() {
    if (this.step > 1) {
      this.goToStep(this.step - 1);
      return true; // handled
    }
    return false; // let app handle
  }
};
