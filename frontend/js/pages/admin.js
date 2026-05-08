// ============================================
// ADMIN PAGE
// ============================================

const AdminIcons = {
  dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  masters: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  key: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  scissors: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
  folder: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
  camera: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  nail: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 6 5 6 9c0 4 2 8 6 13 4-5 6-9 6-13 0-4-2-7-6-7z"/></svg>',
  service: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
};

const AdminPage = {
  activeTab: 'dashboard',
  _dialogPollTimer: null,

  async render(params = {}) {
    return `
      <div class="page page-enter" id="admin-page">
        <!-- Admin Tabs -->
        <div style="display:flex;overflow-x:auto;background:var(--color-surface);border-bottom:1px solid var(--color-border-light);scrollbar-width:none">
          ${[
            { key: 'dashboard', label: 'Дашборд', icon: AdminIcons.dashboard },
            { key: 'bookings', label: 'Записи', icon: AdminIcons.calendar },
            { key: 'masters', label: 'Мастера', icon: AdminIcons.masters },
            { key: 'crm', label: 'CRM', icon: AdminIcons.users },
            { key: 'chats', label: 'Чаты', icon: AdminIcons.users },
            { key: 'codes', label: 'Коды', icon: AdminIcons.key },
            { key: 'services', label: 'Услуги', icon: AdminIcons.scissors },
            { key: 'categories', label: 'Категории', icon: AdminIcons.folder }
          ].map(tab => `
            <button class="master-tab ${this.activeTab === tab.key ? 'active' : ''}"
                    onclick="AdminPage.switchTab('${tab.key}')"
                    style="white-space:nowrap;padding:14px 16px;font-size:var(--font-size-sm);display:inline-flex;align-items:center;gap:6px">
              <span style="display:inline-flex;color:#FF69B4">${tab.icon}</span> ${tab.label}
            </button>
          `).join('')}
        </div>
        <div id="admin-tab-content"></div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadTab(this.activeTab);
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('#admin-page .master-tab').forEach(t => {
      t.classList.toggle('active', t.textContent.trim().includes(
        { dashboard: 'Дашборд', bookings: 'Записи', masters: 'Мастера', crm: 'CRM', chats: 'Чаты', codes: 'Коды', services: 'Услуги', categories: 'Категории' }[tab]
      ));
    });
    this.loadTab(tab);
  },

  async loadTab(tab) {
    const container = document.getElementById('admin-tab-content');
    if (!container) return;
    container.innerHTML = `<div style="padding:var(--space-md)">${Utils.skeletonCard(4)}</div>`;

    switch (tab) {
      case 'dashboard': await this.loadDashboard(container); break;
      case 'bookings': await this.loadBookings(container); break;
      case 'masters': await this.loadMasters(container); break;
      case 'crm': await this.loadCRM(container); break;
      case 'chats': await this.loadChats(container); break;
      case 'codes': await this.loadCodes(container); break;
      case 'services': await this.loadServices(container); break;
      case 'categories': await this.loadCategories(container); break;
    }
  },

  // ============================================
  // DASHBOARD
  // ============================================

  async loadDashboard(container) {
    try {
      const { stats, recent_bookings, top_masters } = await API.admin.dashboard();

      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-value">${stats.bookings_today}</div>
              <div class="stat-card-label">Записей сегодня</div>
            </div>
            <div class="stat-card stat-card-primary">
              <div class="stat-card-value">${Math.round(stats.revenue_today || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка сегодня ₽</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.bookings_pending}</div>
              <div class="stat-card-label">Ожидают</div>
            </div>
            <div class="stat-card stat-card-primary">
              <div class="stat-card-value">${Math.round(stats.revenue_month || 0).toLocaleString('ru-RU')}</div>
              <div class="stat-card-label">Выручка за месяц ₽</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.total_clients}</div>
              <div class="stat-card-label">Клиентов</div>
            </div>
            <div class="stat-card">
              <div class="stat-card-value">${stats.total_masters}</div>
              <div class="stat-card-label">Мастеров</div>
            </div>
          </div>

          <!-- Recent Bookings -->
          <div>
            <div class="section-title">Последние записи</div>
            <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${recent_bookings.slice(0, 5).map(b => `
                <div class="card" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })" style="cursor:pointer">
                  <div class="card-body" style="display:flex;align-items:center;gap:var(--space-sm)">
                    <div style="flex:1">
                      <div style="font-weight:600;font-size:var(--font-size-sm)">${b.service_name}</div>
                      <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">
                        ${b.client_first_name || b.client_username || 'Клиент'} → ${b.master_name}
                      </div>
                      <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary)">${Utils.formatDate(b.booking_date, 'short')} ${Utils.formatTime(b.start_time)}</div>
                    </div>
                    <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Top Masters -->
          ${top_masters.length > 0 ? `
            <div>
              <div class="section-title">Топ мастеров</div>
              ${top_masters.map((m, i) => `
                <div style="display:flex;align-items:center;gap:var(--space-md);padding:10px 0;border-bottom:1px solid var(--color-border-light)">
                  <div style="width:24px;height:24px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-xs);font-weight:700;color:var(--color-primary)">${i+1}</div>
                  <div style="flex:1">
                    <div style="font-weight:600">${m.display_name}</div>
                    <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary)">${m.total_bookings} записей</div>
                  </div>
                  <div style="font-weight:600;color:var(--color-primary-dark)">${Math.round(m.total_revenue).toLocaleString('ru-RU')} ₽</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка загрузки', e.message);
    }
  },

  // ============================================
  // BOOKINGS
  // ============================================

  async loadBookings(container) {
    try {
      const { bookings } = await API.bookings.adminAll({ limit: 50 });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${bookings.length === 0
            ? EmptyState.render(AdminIcons.calendar, 'Нет записей', '')
            : bookings.map(b => `
              <div class="booking-card" onclick="App.navigate('booking-detail', { bookingId: ${b.id} })">
                <div class="booking-card-header">
                  <div class="booking-date-time">
                    <div class="booking-date">${Utils.formatDate(b.booking_date, 'short')}</div>
                    <div class="booking-time">${Utils.formatTime(b.start_time)}</div>
                  </div>
                  <span class="badge ${Utils.getStatusInfo(b.status).class}">${Utils.getStatusInfo(b.status).label}</span>
                </div>
                <div class="booking-card-body">
                  <div style="font-weight:600">${b.service_name}</div>
                  <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
                    ${b.client_first_name || b.client_username || 'Клиент'} → ${b.master_name}
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  // ============================================
  // MASTERS
  // ============================================

  async loadMasters(container) {
    try {
      const { users } = await API.admin.users({ role: 'master' });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${users.length === 0
            ? EmptyState.render(AdminIcons.masters, 'Нет мастеров', 'Создайте код доступа для мастера')
            : users.map(u => `
              <div class="card">
                <div class="card-body">
                  <div style="display:flex;align-items:center;gap:var(--space-md)">
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--color-primary)">
                      ${Utils.getInitials(Utils.getUserName(u))}
                    </div>
                    <div style="flex:1">
                      <div style="font-weight:600">${u.master_display_name || Utils.getUserName(u)}</div>
                      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">@${u.username || u.telegram_id}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
                      <span class="badge ${u.status === 'active' ? 'badge-active' : 'badge-cancelled'}">${u.status === 'active' ? 'Активен' : 'Заблокирован'}</span>
                      <button class="btn btn-ghost btn-sm" style="font-size:10px" onclick="AdminPage.toggleUserStatus(${u.id}, '${u.status}')">
                        ${u.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  // ============================================
  // CRM
  // ============================================

  async loadChats(container) {
    try {
      const { chats } = await API.admin.dialogList();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${!chats || chats.length === 0
            ? EmptyState.render(AdminIcons.users, 'Нет чатов', '')
            : chats.map(c => `
              <div class="card" onclick="AdminPage.openClientModal(${c.user_id})">
                <div class="card-body">
                  <div style="display:flex;align-items:center;gap:var(--space-md)">
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--color-primary)">
                      ${Utils.getInitials(Utils.getUserName(c))}
                    </div>
                    <div style="flex:1;min-width:0">
                      <div style="font-weight:600">${Utils.getUserName(c)}</div>
                      <div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        ${c.last_direction === 'inbound' ? 'Клиент: ' : 'Вы: '}${c.last_message || 'Нет сообщений'}
                      </div>
                    </div>
                    <div style="font-size:11px;color:var(--color-text-tertiary)">${c.last_at ? new Date(c.last_at).toLocaleDateString('ru-RU') : ''}</div>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
      this._clients = chats.map(c => ({ ...c, id: c.user_id }));
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  async loadCRM(container) {
    try {
      const { clients } = await API.admin.crm({ limit: 50 });
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)">
          ${clients.length === 0
            ? EmptyState.render(AdminIcons.users, 'Нет клиентов', '')
            : clients.map(c => `
              <div class="card" onclick="AdminPage.openClientModal(${c.id})">
                <div class="card-body">
                  <div style="display:flex;align-items:center;gap:var(--space-md)">
                    <div style="width:44px;height:44px;border-radius:50%;background:var(--color-bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--color-primary)">
                      ${Utils.getInitials(Utils.getUserName(c))}
                    </div>
                    <div style="flex:1">
                      <div style="font-weight:600">${Utils.getUserName(c)}</div>
                      <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
                        ${c.total_visits} визитов · ${Math.round(c.total_spent || 0).toLocaleString('ru-RU')} ₽
                      </div>
                      ${c.last_visit_date ? `<div style="font-size:var(--font-size-xs);color:var(--color-text-tertiary)">Последний визит: ${Utils.formatDate(c.last_visit_date, 'short')}</div>` : ''}
                    </div>
                    <span class="badge badge-${c.crm_status}">${Config.CRM_STATUS[c.crm_status]?.label || c.crm_status}</span>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      `;
      this._clients = clients;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  async openClientModal(userId) {
    this.stopDialogAutoRefresh();
    let client = this._clients?.find(c => c.id === userId);
    if (client && !client.crm_status) {
      try {
        const { clients } = await API.admin.crm({ limit: 200 });
        const fullClient = clients.find(c => c.id === userId);
        if (fullClient) client = fullClient;
      } catch (_) {}
    }
    if (!client) return;
    const isBlocked = client.status === 'blocked';

    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div style="text-align:center">
          <div style="font-size:32px;font-weight:700;color:var(--color-primary);margin-bottom:4px">${Utils.getInitials(Utils.getUserName(client))}</div>
          <div style="font-weight:700;font-size:var(--font-size-lg)">${Utils.getUserName(client)}</div>
          ${client.username ? `<div style="color:var(--color-text-secondary)">@${client.username}</div>` : ''}
        </div>
        <div class="form-group">
          <label class="form-label">Доступ в приложение</label>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-sm)">
            <span class="badge ${isBlocked ? 'badge-cancelled' : 'badge-active'}">${isBlocked ? 'Заблокирован' : 'Активен'}</span>
            <button class="btn btn-ghost btn-sm" onclick="AdminPage.toggleClientAccess(${userId}, '${client.status}')">
              ${isBlocked ? 'Разблокировать' : 'Заблокировать'}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">CRM Статус</label>
          <select class="form-input form-select" id="crm-status-select">
            ${Object.entries(Config.CRM_STATUS).map(([key, val]) =>
              `<option value="${key}" ${client.crm_status === key ? 'selected' : ''}>${val.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Заметки</label>
          <textarea class="form-input form-textarea" id="crm-notes">${client.notes || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Сообщение от имени бота</label>
          <textarea class="form-input form-textarea" id="bot-direct-message" placeholder="Например: Здравствуйте! Пожалуйста, подтвердите ваш визит."></textarea>
          <button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="AdminPage.sendDirectMessage(${userId})">Отправить сообщение</button>
        </div>
        <div class="form-group">
          <label class="form-label">Диалог</label>
          <div id="dialog-history" style="max-height:180px;overflow:auto;border:1px solid var(--color-border);border-radius:10px;padding:8px;font-size:var(--font-size-sm);color:var(--color-text-secondary)">
            Загрузка...
          </div>
          <button class="btn btn-ghost btn-full" style="margin-top:8px" onclick="AdminPage.loadDialog(${userId})">Обновить диалог</button>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.saveCRM(${userId})">Сохранить</button>
      </div>
    `, Utils.getUserName(client));
    this.loadDialog(userId);
    this.startDialogAutoRefresh(userId);
  },

  async saveCRM(userId) {
    const status = document.getElementById('crm-status-select')?.value;
    const notes = document.getElementById('crm-notes')?.value;
    try {
      await API.admin.updateCrm(userId, { crm_status: status, notes });
      this.stopDialogAutoRefresh();
      Modal.close();
      Toast.success('CRM обновлён');
      await this.loadCRM(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async toggleClientAccess(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await API.admin.updateUser(userId, { status: newStatus });
      this.stopDialogAutoRefresh();
      Modal.close();
      Toast.success(`Клиент ${newStatus === 'active' ? 'разблокирован' : 'заблокирован'}`);
      await this.loadCRM(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async sendDirectMessage(userId) {
    const message = document.getElementById('bot-direct-message')?.value?.trim();
    if (!message) {
      Toast.error('Введите сообщение');
      return;
    }
    try {
      await API.admin.sendDialog(userId, { message });
      Toast.success('Сообщение отправлено');
      const input = document.getElementById('bot-direct-message');
      if (input) input.value = '';
      await this.loadDialog(userId);
    } catch (e) {
      Toast.error(e.message || 'Ошибка отправки');
    }
  },

  async loadDialog(userId) {
    const box = document.getElementById('dialog-history');
    if (!box) return;
    try {
      const { messages } = await API.admin.dialog(userId, { limit: 30 });
      if (!messages || messages.length === 0) {
        box.innerHTML = '<div style="color:var(--color-text-tertiary)">Пока нет сообщений</div>';
        return;
      }
      box.innerHTML = messages.map(m => `
        <div style="margin-bottom:6px;padding:6px 8px;border-radius:8px;background:${m.direction === 'outbound' ? 'var(--color-bg-secondary)' : 'rgba(255,0,128,0.06)'}">
          <div style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:2px">${m.direction === 'outbound' ? 'Вы → Клиент' : 'Клиент → Бот'} · ${new Date(m.created_at).toLocaleString('ru-RU')}</div>
          <div style="color:var(--color-text-primary)">${m.message}</div>
        </div>
      `).join('');
      box.scrollTop = box.scrollHeight;
    } catch (e) {
      box.innerHTML = `<div style="color:var(--color-danger)">Ошибка загрузки диалога</div>`;
    }
  },

  startDialogAutoRefresh(userId) {
    this.stopDialogAutoRefresh();
    this._dialogPollTimer = setInterval(async () => {
      const dialogBox = document.getElementById('dialog-history');
      if (!dialogBox) {
        this.stopDialogAutoRefresh();
        return;
      }
      await this.loadDialog(userId);
    }, 5000);
  },

  stopDialogAutoRefresh() {
    if (this._dialogPollTimer) {
      clearInterval(this._dialogPollTimer);
      this._dialogPollTimer = null;
    }
  },

  // ============================================
  // ACCESS CODES
  // ============================================

  async loadCodes(container) {
    try {
      const { codes } = await API.accessCodes.list();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <button class="btn btn-primary btn-full" onclick="AdminPage.createCode()">
            + Создать код доступа
          </button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${codes.length === 0
              ? EmptyState.render(AdminIcons.key, 'Нет кодов', 'Создайте код для нового мастера')
              : codes.map(code => `
                <div class="card">
                  <div class="card-body">
                    <div style="display:flex;align-items:center;justify-content:space-between">
                      <div>
                        <div style="font-family:monospace;font-size:var(--font-size-lg);font-weight:700;letter-spacing:0.1em;color:${code.is_active && !code.used_by ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)'}">${code.code}</div>
                        <div style="font-size:var(--font-size-xs);color:var(--color-text-secondary);margin-top:2px">
                          ${code.used_by ? `Использован: ${code.used_by_first_name || code.used_by_username || 'Пользователь'}` : (code.is_active ? 'Активен' : 'Деактивирован')}
                          ${code.expires_at ? ` · до ${Utils.formatDate(code.expires_at.split('T')[0], 'short')}` : ''}
                        </div>
                      </div>
                      <div style="display:flex;gap:8px;align-items:center">
                        ${code.is_active && !code.used_by ? `
                          <button class="btn btn-ghost btn-sm" onclick="AdminPage.copyCode('${code.code}')">${AdminIcons.copy}</button>
                          <button class="btn btn-danger btn-sm" onclick="AdminPage.deleteCode(${code.id})">${AdminIcons.x}</button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  async createCode() {
    try {
      const { code } = await API.accessCodes.create({ role: 'master' });
      Utils.haptic('success');
      Toast.success(`Код создан: ${code.code}`);
      await this.loadCodes(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка создания кода');
    }
  },

  copyCode(code) {
    navigator.clipboard?.writeText(code).then(() => Toast.success('Код скопирован!')).catch(() => Toast.info(code));
  },

  async deleteCode(codeId) {
    try {
      await API.accessCodes.delete(codeId);
      Toast.success('Код деактивирован');
      await this.loadCodes(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  // ============================================
  // SERVICES
  // ============================================

  async loadServices(container) {
    try {
      const { services } = await API.services.list();
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <button class="btn btn-primary btn-full" onclick="AdminPage.showAddServiceModal()">
            + Добавить услугу
          </button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${services.map(s => `
              <div class="admin-service-card">
                <div class="admin-service-top">
                  <div class="admin-service-icon"><span style="display:inline-flex;color:#FF69B4">${AdminIcons.scissors}</span></div>
                  <div class="admin-service-info">
                    <div class="admin-service-name">${s.name}</div>
                    <div class="admin-service-meta">${Utils.formatDuration(s.duration_minutes)}</div>
                  </div>
                  <div class="admin-service-price">${Utils.formatPrice(s.price)}</div>
                </div>
                <div class="admin-service-actions">
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.editServiceModal(${s.id})">${AdminIcons.edit}</button>
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.deleteService(${s.id})">${AdminIcons.trash}</button>
                  <button class="btn btn-ghost btn-sm" onclick="AdminPage.toggleService(${s.id}, ${s.is_active})" style="color:${s.is_active ? 'var(--color-success)' : 'var(--color-error)'}">
                    ${s.is_active ? AdminIcons.check : AdminIcons.x}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  async showAddServiceModal() {
    let categories = [];
    try {
      const data = await API.admin.getCategories();
      categories = (data.categories || []).filter(c => c.is_active);
    } catch (e) {}

    if (categories.length === 0) {
      Toast.error('Сначала создайте хотя бы одну категорию');
      return;
    }

    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Название</label>
          <input class="form-input" id="svc-name" placeholder="Название услуги">
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select class="form-input form-select" id="svc-category">
            ${categories.map((cat) =>
              `<option value="${cat.key}">${cat.name}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Длительность (мин)</label>
          <input class="form-input" id="svc-duration" type="number" value="60">
        </div>
        <div class="form-group">
          <label class="form-label">Цена (₽)</label>
          <input class="form-input" id="svc-price" type="number" value="1000">
        </div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <textarea class="form-input form-textarea" id="svc-desc" style="min-height:60px"></textarea>
        </div>
        <button class="btn btn-primary btn-full" onclick="AdminPage.createService()">Создать</button>
      </div>
    `, 'Новая услуга');
  },

  async createService() {
    const name = document.getElementById('svc-name')?.value;
    const category = document.getElementById('svc-category')?.value;
    const duration = parseInt(document.getElementById('svc-duration')?.value);
    const price = parseFloat(document.getElementById('svc-price')?.value);
    const description = document.getElementById('svc-desc')?.value;

    if (!name || !category || !duration || !price) {
      Toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      await API.services.create({ name, category, duration_minutes: duration, price, description });
      Modal.close();
      Toast.success('Услуга создана');
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async toggleService(serviceId, currentActive) {
    try {
      await API.services.update(serviceId, { is_active: currentActive ? 0 : 1 });
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async editServiceModal(serviceId) {
    try {
      const [{ service }, { categories }] = await Promise.all([
        API.services.get(serviceId),
        API.admin.getCategories()
      ]);

      Modal.open(`
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          <input class="form-input" id="svc-edit-name" value="${service.name}">
          <select class="form-input form-select" id="svc-edit-category">
            ${categories.map(c => `<option value="${c.key}" ${c.key === service.category ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <input class="form-input" id="svc-edit-duration" type="number" value="${service.duration_minutes}">
          <input class="form-input" id="svc-edit-price" type="number" value="${service.price}">
          <textarea class="form-input form-textarea" id="svc-edit-desc">${service.description || ''}</textarea>
          <button class="btn btn-primary btn-full" onclick="AdminPage.saveServiceEdit(${service.id})">Сохранить</button>
        </div>
      `, 'Редактировать услугу');
    } catch (e) {
      Toast.error(e.message || 'Ошибка загрузки услуги');
    }
  },

  async saveServiceEdit(serviceId) {
    try {
      await API.services.update(serviceId, {
        name: document.getElementById('svc-edit-name')?.value,
        category: document.getElementById('svc-edit-category')?.value,
        duration_minutes: parseInt(document.getElementById('svc-edit-duration')?.value),
        price: parseFloat(document.getElementById('svc-edit-price')?.value),
        description: document.getElementById('svc-edit-desc')?.value
      });
      Modal.close();
      Toast.success('Услуга обновлена');
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async deleteService(serviceId) {
    if (!confirm('Удалить услугу?')) return;
    try {
      await API.services.delete(serviceId);
      Toast.success('Услуга удалена');
      await this.loadServices(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async toggleUserStatus(userId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      await API.admin.updateUser(userId, { status: newStatus });
      Toast.success(`Пользователь ${newStatus === 'active' ? 'разблокирован' : 'заблокирован'}`);
      await this.loadMasters(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  // ============================================
  // CATEGORIES
  // ============================================

  async loadCategories(container) {
    try {
      const [{ categories }, { image_url }] = await Promise.all([
        API.admin.getCategories(),
        API.admin.getBanner()
      ]);
      container.innerHTML = `
        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">
          <div class="card">
            <div class="card-body" style="display:flex;flex-direction:column;gap:8px">
              <div style="font-weight:700">Баннер главной страницы</div>
              <input id="admin-banner-url" class="form-input" placeholder="https://..." value="${image_url || ''}" />
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-primary btn-sm" onclick="AdminPage.saveBanner()">Сохранить фото</button>
                <button class="btn btn-ghost btn-sm" onclick="AdminPage.removeBanner()">Удалить фото</button>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" onclick="AdminPage.createCategoryPrompt()">+ Добавить категорию</button>
          <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
            ${categories.map(cat => {
              const imageUrl = cat.image_path
                ? `${Config.API_URL.replace('/api', '')}${cat.image_path}`
                : '';
              return `
                <div class="card">
                  <div class="card-body">
                    <div style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap">
                      <div style="width:60px;height:60px;border-radius:var(--radius-sm);background:${imageUrl ? `url('${imageUrl}') center/cover` : 'linear-gradient(135deg, #FFE4E9, #FFD6E7)'};flex-shrink:0"></div>
                      <div style="flex:1">
                        <div style="font-weight:600">${cat.name}</div>
                        <div style="font-size:var(--font-size-sm);color:var(--color-text-secondary)">
                          ${cat.service_count} услуг · От ${cat.min_price}₽
                        </div>
                      </div>
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        <button class="btn btn-ghost btn-sm" onclick="AdminPage.editCategoryPrompt(${cat.id}, '${cat.name.replace(/'/g, '&#39;')}')">${AdminIcons.edit}</button>
                        <button class="btn btn-ghost btn-sm" onclick="AdminPage.deleteCategory(${cat.id})">${AdminIcons.trash}</button>
                      </div>
                      <label class="file-upload-btn" style="cursor:pointer;padding:8px 12px;background:var(--color-bg-secondary);border-radius:var(--radius-sm);font-size:var(--font-size-sm);color:var(--color-primary);font-weight:500">
                        ${AdminIcons.camera} Фото
                        <input type="file" accept="image/*" style="display:none" onchange="AdminPage.uploadCategoryImage('${cat.key}', this)">
                      </label>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = EmptyState.render(AdminIcons.warning, 'Ошибка', e.message);
    }
  },

  async saveBanner() {
    const imageUrl = document.getElementById('admin-banner-url')?.value?.trim();
    if (!imageUrl) return Toast.error('Введите URL изображения');
    try {
      await API.admin.updateBanner(imageUrl);
      Toast.success('Баннер сохранён');
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async removeBanner() {
    try {
      await API.admin.deleteBanner();
      const input = document.getElementById('admin-banner-url');
      if (input) input.value = '';
      Toast.success('Баннер удалён');
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async createCategoryPrompt() {
    const name = prompt('Название категории');
    if (!name) return;
    const key = (prompt('Ключ (латиницей, уникальный)', name.toLowerCase().replace(/\s+/g, '_')) || '').trim();
    if (!key) return;
    try {
      await API.admin.createCategory({ key, name });
      Toast.success('Категория создана');
      await this.loadCategories(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async editCategoryPrompt(id, currentName) {
    const name = prompt('Новое название', currentName);
    if (!name) return;
    try {
      await API.admin.updateCategory(id, { name });
      Toast.success('Категория обновлена');
      await this.loadCategories(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async deleteCategory(id) {
    if (!confirm('Удалить категорию?')) return;
    try {
      await API.admin.deleteCategory(id);
      Toast.success('Категория удалена');
      await this.loadCategories(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка');
    }
  },

  async uploadCategoryImage(categoryKey, input) {
    const file = input?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('category_key', categoryKey);

    try {
      const url = `${Config.API_URL}/admin/categories/upload`;
      const headers = {
        'X-Telegram-Init-Data': API._initData || ''
      };
      if (API._devUserId) headers['X-Dev-User-Id'] = API._devUserId;

      const response = await fetch(url, { method: 'POST', headers, body: formData });
      const data = await response.json();
      if (!response.ok) throw { message: data.error };

      Toast.success('Фото категории обновлено');
      await this.loadCategories(document.getElementById('admin-tab-content'));
    } catch (e) {
      Toast.error(e.message || 'Ошибка загрузки фото');
    }
  }
};
