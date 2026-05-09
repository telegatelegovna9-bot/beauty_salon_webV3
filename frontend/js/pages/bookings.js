// ============================================
// BOOKINGS PAGE
// ============================================

const BookingsPage = {
  activeFilter: 'upcoming',

  async render(params = {}) {
    return `
      <div class="page page-enter" id="bookings-page">
        <!-- Filter Tabs -->
        <div style="display:flex;gap:var(--space-sm);padding:var(--space-md);overflow-x:auto;scrollbar-width:none">
          <button class="category-tab ${this.activeFilter === 'upcoming' ? 'active' : ''}" onclick="BookingsPage.setFilter('upcoming')">Предстоящие</button>
          <button class="category-tab ${this.activeFilter === 'completed' ? 'active' : ''}" onclick="BookingsPage.setFilter('completed')">Завершённые</button>
          <button class="category-tab ${this.activeFilter === 'cancelled' ? 'active' : ''}" onclick="BookingsPage.setFilter('cancelled')">Отменённые</button>
        </div>

        <div id="bookings-list" style="padding:0 var(--space-md) var(--space-lg);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${Utils.skeletonCard(4)}
        </div>
      </div>
    `;
  },

  async afterRender(params = {}) {
    await this.loadBookings();
  },

  setFilter(filter) {
    this.activeFilter = filter;
    // Update tab styles
    document.querySelectorAll('#bookings-page .category-tab').forEach(tab => {
      tab.classList.toggle('active', tab.textContent.trim() === this.getFilterLabel(filter));
    });
    this.loadBookings();
  },

  getFilterLabel(filter) {
    const labels = { upcoming: 'Предстоящие', completed: 'Завершённые', cancelled: 'Отменённые' };
    return labels[filter] || filter;
  },

  async loadBookings() {
    const container = document.getElementById('bookings-list');
    if (!container) return;

    container.innerHTML = Utils.skeletonCard(4);

    try {
      let params = { limit: 50 };

      if (this.activeFilter === 'upcoming') {
        // No status filter — we'll filter client-side
      } else if (this.activeFilter === 'completed') {
        params.status = 'completed';
      } else if (this.activeFilter === 'cancelled') {
        params.status = 'cancelled';
      }

      const { bookings } = await API.bookings.my(params);

      let filtered = bookings;
      if (this.activeFilter === 'upcoming') {
        filtered = bookings.filter(b =>
          ['pending', 'confirmed'].includes(b.status) &&
          b.booking_date >= Utils.getTodayStr()
        );
      }

      if (filtered.length === 0) {
        container.innerHTML = EmptyState.render(
          '📅',
          'Нет записей',
          this.activeFilter === 'upcoming' ? 'У вас нет предстоящих записей' : 'Здесь будут ваши записи',
          this.activeFilter === 'upcoming' ? 'Записаться' : null,
          this.activeFilter === 'upcoming' ? "App.navigate('book')" : null
        );
        return;
      }

      container.innerHTML = filtered.map(booking =>
        BookingCard.render(booking, {
          onClick: `BookingsPage.openBooking(${booking.id})`
        })
      ).join('');

    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message || 'Попробуйте позже');
    }
  },

  openBooking(bookingId) {
    App.navigate('booking-detail', { bookingId });
  }
};

// ============================================
// BOOKING DETAIL PAGE
// ============================================

const BookingDetailPage = {
  booking: null,

  async render(params = {}) {
    return `<div class="page page-enter" id="booking-detail-page">
      <div style="padding:var(--space-md)">${Utils.skeletonCard(3)}</div>
    </div>`;
  },

  async afterRender(params = {}) {
    if (!params.bookingId) {
      App.navigate('bookings');
      return;
    }
    await this.loadBooking(params.bookingId);
  },

  async loadBooking(bookingId) {
    const container = document.getElementById('booking-detail-page');
    if (!container) return;

    try {
      const { booking } = await API.bookings.get(bookingId);
      this.booking = booking;

      const status = Utils.getStatusInfo(booking.status);
      const masterName = booking.master_name || Utils.getMasterName(booking);
      const user = Store.get('user');
      const masterProfile = Store.get('masterProfile');
      const isMaster = masterProfile && String(masterProfile.id) === String(booking.master_id);
      const isAdmin = user?.role === 'admin';

      // Action buttons based on role and status
      let actionButtons = '';

      if (booking.status === 'pending') {
        if (isMaster || isAdmin) {
          actionButtons += `
            <button class="btn btn-primary btn-full" onclick="BookingDetailPage.updateStatus('confirmed')">
              ✓ Подтвердить
            </button>
          `;
        }
        actionButtons += `
          <button class="btn btn-danger btn-full" onclick="BookingDetailPage.showCancelModal()">
            ✕ Отменить
          </button>
        `;
      }

      if (booking.status === 'confirmed') {
        if (isMaster || isAdmin) {
          actionButtons += `
            <button class="btn btn-primary btn-full" onclick="BookingDetailPage.updateStatus('completed')">
              ✓ Завершить
            </button>
            <button class="btn btn-danger btn-full" onclick="BookingDetailPage.showCancelModal()">
              ✕ Отменить
            </button>
          `;
        } else {
          actionButtons += `
            <button class="btn btn-danger btn-full" onclick="BookingDetailPage.showCancelModal()">
              ✕ Отменить запись
            </button>
          `;
        }
      }

      if (booking.status === 'completed' && !isMaster) {
        if (booking.review_id) {
          actionButtons += `
            <button class="btn btn-ghost btn-full" onclick="BookingDetailPage.showReviewDetails()">
              ★ Мой отзыв
            </button>
          `;
        } else {
          actionButtons += `
            <button class="btn btn-outline btn-full" onclick="BookingDetailPage.showReviewModal()">
              ★ Оставить отзыв
            </button>
          `;
        }
      }

      container.innerHTML = `
        <div style="padding:var(--space-md)">
          <!-- Status Banner -->
          <div style="text-align:center;padding:var(--space-lg);background:var(--color-bg-secondary);border-radius:var(--radius-lg);margin-bottom:var(--space-lg)">
            <div style="font-size:48px;margin-bottom:8px">
              ${{ pending: '⏳', confirmed: '✅', completed: '🌟', cancelled: '❌', no_show: '😔' }[booking.status] || '📅'}
            </div>
            <span class="badge ${status.class}" style="font-size:var(--font-size-sm)">${status.label}</span>
          </div>

          <!-- Details Card -->
          <div class="card" style="margin-bottom:var(--space-md)">
            <div class="card-body">
              <div class="info-row">
                <span class="info-row-label">Услуга</span>
                <span class="info-row-value">${booking.service_name}</span>
              </div>
              <div class="info-row">
                <span class="info-row-label">Мастер</span>
                <span class="info-row-value">${masterName}</span>
              </div>
              <div class="info-row">
                <span class="info-row-label">Дата</span>
                <span class="info-row-value">${Utils.formatDate(booking.booking_date, 'full')}</span>
              </div>
              <div class="info-row">
                <span class="info-row-label">Время</span>
                <span class="info-row-value">${Utils.formatTime(booking.start_time)} — ${Utils.formatTime(booking.end_time)}</span>
              </div>
              <div class="info-row">
                <span class="info-row-label">Длительность</span>
                <span class="info-row-value">${Utils.formatDuration(booking.duration_minutes)}</span>
              </div>
              ${booking.price ? `
                <div class="info-row">
                  <span class="info-row-label">Стоимость</span>
                  <span class="info-row-value" style="color:var(--color-primary-dark);font-weight:700">${Utils.formatPrice(booking.price)}</span>
                </div>
              ` : ''}
              ${booking.client_notes ? `
                <div class="info-row">
                  <span class="info-row-label">Комментарий</span>
                  <span class="info-row-value">${booking.client_notes}</span>
                </div>
              ` : ''}
              ${booking.cancel_reason ? `
                <div class="info-row">
                  <span class="info-row-label">Причина отмены</span>
                  <span class="info-row-value" style="color:var(--color-error)">${booking.cancel_reason}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Client info (for masters) -->
          ${(isMaster || isAdmin) && booking.client_first_name ? `
            <div class="card" style="margin-bottom:var(--space-md)">
              <div class="card-body">
                <div style="font-weight:600;margin-bottom:var(--space-sm)">Клиент</div>
                <div class="info-row">
                  <span class="info-row-label">Имя</span>
                  <span class="info-row-value">${booking.client_first_name} ${booking.client_last_name || ''}</span>
                </div>
                ${booking.client_username ? `
                  <div class="info-row">
                    <span class="info-row-label">Username</span>
                    <span class="info-row-value">@${booking.client_username}</span>
                  </div>
                ` : ''}
                ${booking.client_telegram_id ? `
                  <div class="info-row">
                    <span class="info-row-label">Telegram ID</span>
                    <span class="info-row-value">${booking.client_telegram_id}</span>
                  </div>
                ` : ''}
                ${booking.client_phone ? `
                  <div class="info-row">
                    <span class="info-row-label">Телефон</span>
                    <a href="tel:${booking.client_phone}" class="info-row-value" style="color:var(--color-primary)">${booking.client_phone}</a>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Action Buttons -->
          ${actionButtons ? `
            <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${actionButtons}
            </div>
          ` : ''}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  async updateStatus(status) {
    try {
      await API.bookings.updateStatus(this.booking.id, status);
      Utils.haptic('success');
      Toast.success(`Статус обновлён: ${Utils.getStatusInfo(status).label}`);
      await this.loadBooking(this.booking.id);
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Ошибка обновления статуса');
    }
  },

  showCancelModal() {
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <p style="color:var(--color-text-secondary)">Вы уверены, что хотите отменить запись?</p>
        <div class="form-group">
          <label class="form-label">Причина отмены</label>
          <textarea class="form-input form-textarea" id="cancel-reason" placeholder="Укажите причину..." style="min-height:80px"></textarea>
        </div>
        <button class="btn btn-danger btn-full" onclick="BookingDetailPage.cancelBooking()">Отменить запись</button>
        <button class="btn btn-ghost btn-full" onclick="Modal.close()">Назад</button>
      </div>
    `, 'Отмена записи');
  },

  async cancelBooking() {
    const reason = document.getElementById('cancel-reason')?.value || '';
    Modal.close();
    await this.updateStatus('cancelled');
  },

  showReviewDetails() {
    const rating = Number(this.booking.review_rating) || 0;
    const reviewDate = this.booking.review_created_at
      ? Utils.formatDate(this.booking.review_created_at, 'full')
      : '';

    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div style="font-size:28px;text-align:center;color:var(--color-primary)">
          ${'★'.repeat(rating)}
        </div>
        ${this.booking.review_comment
          ? `<div class="card"><div class="card-body" style="white-space:pre-wrap">${this.booking.review_comment}</div></div>`
          : '<div style="text-align:center;color:var(--color-text-secondary)">Без комментария</div>'}
        ${reviewDate
          ? `<div style="text-align:center;color:var(--color-text-secondary);font-size:var(--font-size-sm)">Оставлен: ${reviewDate}</div>`
          : ''}
        <button class="btn btn-primary btn-full" onclick="Modal.close()">Закрыть</button>
      </div>
    `, 'Ваш отзыв');
  },

  showReviewModal() {
    let selectedRating = 5;
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div style="text-align:center">
          <div style="font-size:32px;margin-bottom:var(--space-sm)">
            ${[1,2,3,4,5].map(i => `
              <span style="cursor:pointer;font-size:36px;color:${i <= selectedRating ? 'var(--color-primary)' : 'var(--color-border)'}"
                    onclick="BookingDetailPage.setRating(${i})" id="star-${i}">★</span>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Комментарий</label>
          <textarea class="form-input form-textarea" id="review-comment" placeholder="Расскажите о вашем опыте..."></textarea>
        </div>
        <button class="btn btn-primary btn-full" onclick="BookingDetailPage.submitReview()">Отправить отзыв</button>
      </div>
    `, 'Оставить отзыв');
    this._selectedRating = 5;
  },

  setRating(rating) {
    this._selectedRating = rating;
    for (let i = 1; i <= 5; i++) {
      const star = document.getElementById(`star-${i}`);
      if (star) star.style.color = i <= rating ? 'var(--color-primary)' : 'var(--color-border)';
    }
  },

  async submitReview() {
    const comment = document.getElementById('review-comment')?.value || '';
    try {
      await API.bookings.review(this.booking.id, { rating: this._selectedRating, comment });
      Modal.close();
      Utils.haptic('success');
      Toast.success('Отзыв отправлен! Спасибо 🌸');
      await this.loadBooking(this.booking.id);
    } catch (e) {
      Toast.error(e.message || 'Ошибка отправки отзыва');
    }
  }
};
