// ============================================
// PROFILE PAGE
// ============================================

const ProfilePage = {
  async render(params = {}) {
    const user = Store.get('user');
    if (!user) return `<div class="page page-enter"><div class="empty-state"><div class="loading-spinner"></div></div></div>`;

    const name = Utils.getUserName(user);
    const initials = Utils.getInitials(name);
    const roleInfo = Config.ROLES[user.role] || { label: user.role, icon: '👤' };
    const clientProfile = Store.get('clientProfile');

    return `
      <div class="page page-enter" id="profile-page">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar" style="overflow:hidden">${user.avatar_url ? `<img src="${user.avatar_url}" alt="${name}" style="width:100%;height:100%;object-fit:cover">` : initials}</div>
            <label class="profile-avatar-camera">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              <input type="file" accept="image/*" style="display:none" onchange="ProfilePage.uploadAvatar(this)">
            </label>
          </div>
          <div class="profile-name">${name}</div>
          <div class="profile-role">${roleInfo.icon} ${roleInfo.label}</div>
          ${user.username ? `<div class="profile-username">@${user.username}</div>` : ''}

          ${clientProfile ? `
            <div class="profile-stats">
              <div class="profile-stat">
                <div class="profile-stat-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div class="profile-stat-info">
                  <div class="profile-stat-value">${clientProfile.total_visits || 0}</div>
                  <div class="profile-stat-label">Визитов</div>
                </div>
              </div>
              <div class="profile-stat">
                <div class="profile-stat-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF69B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="profile-stat-info">
                  <div class="profile-stat-value">${clientProfile.total_spent ? Math.round(clientProfile.total_spent / 1000) + 'k' : '0'}</div>
                  <div class="profile-stat-label">Потрачено ₽</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-md)">

          <!-- Edit Profile -->
          
          <div class="menu-list">
            <div class="menu-item" onclick="ProfilePage.showEditModal()">
              <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path></svg></div>
              <div class="menu-item-text">
                <div class="menu-item-title">Редактировать профиль</div>
                <div class="menu-item-subtitle">Имя, телефон</div>
              </div>
              <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>

          <!-- Activate Code (for clients) -->
          ${user.role === 'client' ? `
            <div class="menu-list">
              <div class="menu-item" onclick="ProfilePage.showActivateCodeModal()">
                <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="15" r="4"></circle><path d="M11 15h10"></path><path d="M18 12v6"></path></svg></div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Активировать код</div>
                  <div class="menu-item-subtitle">Стать мастером</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ` : ''}

          <!-- Master Section -->
          ${Store.isMaster() ? `
            <div class="menu-list">
              <div class="menu-item" onclick="App.navigate('master-profile')">
                <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11l5-8 5 8"></path><path d="M7 11h10"></path><path d="M9 11v6a3 3 0 0 0 6 0v-6"></path></svg></div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Профиль мастера</div>
                  <div class="menu-item-subtitle">Услуги, расписание, портфолио</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="menu-item" onclick="App.navigate('master-schedule')">
                <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Моё расписание</div>
                  <div class="menu-item-subtitle">Рабочие дни и часы</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="menu-item" onclick="App.navigate('master-bookings')">
                <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6a2 2 0 0 1 2 2v2H7V4a2 2 0 0 1 2-2z"></path><path d="M7 6h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"></path><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="15" y2="16"></line></svg></div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Записи клиентов</div>
                  <div class="menu-item-subtitle">Управление записями</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ` : ''}

          <!-- Admin Section -->
          ${Store.isAdmin() ? `
            <div class="menu-list">
              <div class="menu-item" onclick="App.navigate('admin')">
                <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 19h20"></path><path d="M3 7l4 4 5-7 5 7 4-4 1 12H2L3 7z"></path></svg></div>
                <div class="menu-item-text">
                  <div class="menu-item-title">Панель администратора</div>
                  <div class="menu-item-subtitle">Управление салоном</div>
                </div>
                <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              ${!Store.get('masterProfile') ? `
                <div class="menu-item" onclick="ProfilePage.createMasterProfile()">
                  <div class="menu-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11l5-8 5 8"></path><path d="M7 11h10"></path><path d="M9 11v6a3 3 0 0 0 6 0v-6"></path></svg></div>
                  <div class="menu-item-text">
                    <div class="menu-item-title">Создать профиль мастера</div>
                    <div class="menu-item-subtitle">Для работы с расписанием и записями</div>
                  </div>
                  <svg class="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- App Info -->
          <div style="text-align:center;padding:var(--space-lg);color:var(--color-text-tertiary);font-size:var(--font-size-xs)">
            <div style="font-size:24px;margin-bottom:4px">✦</div>
            <div>Bella Luna v1.0</div>
            <div>ID: ${user.telegram_id}</div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {},

  async uploadAvatar(input) {
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const { user } = await API.auth.uploadAvatar(file);
      Store.set('user', user);
      Toast.success('Фото профиля обновлено');
      App.navigate('profile');
    } catch (e) {
      Toast.error(e.message || 'Ошибка загрузки фото');
    } finally {
      if (input) input.value = '';
    }
  },

  showEditModal() {
    const user = Store.get('user');
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Имя</label>
          <input class="form-input" id="edit-first-name" value="${user.first_name || ''}" placeholder="Ваше имя">
        </div>
        <div class="form-group">
          <label class="form-label">Фамилия</label>
          <input class="form-input" id="edit-last-name" value="${user.last_name || ''}" placeholder="Ваша фамилия">
        </div>
        <div class="form-group">
          <label class="form-label">Телефон</label>
          <input class="form-input" id="edit-phone" type="tel" value="${user.phone || ''}" placeholder="+7 (999) 000-00-00">
        </div>
        <button class="btn btn-primary btn-full" onclick="ProfilePage.saveProfile()">Сохранить</button>
      </div>
    `, 'Редактировать профиль');
  },

  async saveProfile() {
    const firstName = document.getElementById('edit-first-name')?.value;
    const lastName = document.getElementById('edit-last-name')?.value;
    const phone = document.getElementById('edit-phone')?.value?.trim() || '';
    const phoneDigits = phone.replace(/\D/g, '');

    if (phone && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
      Toast.error('Номер телефона должен содержать от 10 до 15 цифр');
      document.getElementById('edit-phone')?.focus();
      return;
    }

    try {
      const { user } = await API.auth.updateProfile({ first_name: firstName, last_name: lastName, phone: phone || null });
      Store.set('user', user);
      Modal.close();
      Utils.haptic('success');
      Toast.success('Профиль обновлён');
      App.navigate('profile');
    } catch (e) {
      Toast.error(e.message || 'Ошибка сохранения');
    }
  },

  showActivateCodeModal() {
    Modal.open(`
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <p style="color:var(--color-text-secondary)">Введите код доступа, чтобы получить роль мастера</p>
        <div class="form-group">
          <label class="form-label">Код доступа</label>
          <input class="form-input" id="access-code-input" placeholder="XXXXXXXX" style="text-transform:uppercase;letter-spacing:0.1em;font-size:var(--font-size-lg);text-align:center" maxlength="8">
        </div>
        <button class="btn btn-primary btn-full" onclick="ProfilePage.activateCode()">Активировать</button>
      </div>
    `, 'Код доступа');
  },

  async activateCode() {
    const code = document.getElementById('access-code-input')?.value;
    if (!code || code.length < 6) {
      Toast.error('Введите корректный код');
      return;
    }

    try {
      const result = await API.auth.activateCode(code);
      Store.set('user', result.user);
      if (result.master_profile) Store.set('masterProfile', result.master_profile);
      Modal.close();
      Utils.haptic('success');
      Toast.success(result.message || 'Код активирован!');
      App.navigate('profile');
    } catch (e) {
      Utils.haptic('error');
      Toast.error(e.message || 'Неверный код');
    }
  },

  async createMasterProfile() {
    try {
      const result = await API.post('/auth/create-master-profile', { display_name: '' });
      Store.set('masterProfile', result.master_profile);
      Utils.haptic('success');
      Toast.success('Профиль мастера создан!');
      App.navigate('profile');
    } catch (e) {
      Toast.error(e.message || 'Ошибка создания профиля');
    }
  }
};
