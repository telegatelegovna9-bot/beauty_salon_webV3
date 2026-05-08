// ============================================
// API CLIENT
// ============================================

const API = {
  _initData: null,
  _devUserId: null,

  init() {
    // Get Telegram WebApp initData
    if (window.Telegram?.WebApp?.initData) {
      this._initData = window.Telegram.WebApp.initData;
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Development mode bypass
      this._initData = 'dev_bypass';
      this._devUserId = new URLSearchParams(window.location.search).get('user_id') || '123456789';
    }
  },

  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': this._initData || ''
    };
    if (this._devUserId) {
      headers['X-Dev-User-Id'] = this._devUserId;
    }
    return headers;
  },

  async _request(method, path, body = null) {
    const url = `${Config.API_URL}${path}`;
    const options = {
      method,
      headers: this._getHeaders()
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, message: data.error || 'Request failed', data };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw { status: 0, message: 'Network error. Check your connection.', data: null };
    }
  },

  get: (path) => API._request('GET', path),
  post: (path, body) => API._request('POST', path, body),
  put: (path, body) => API._request('PUT', path, body),
  delete: (path) => API._request('DELETE', path),

  // ============================================
  // AUTH
  // ============================================

  auth: {
    login: () => API.post('/auth', {}),
    me: () => API.get('/auth/me'),
    updateProfile: (data) => API.put('/auth/profile', data),
    uploadAvatar: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const url = `${Config.API_URL}/auth/avatar`;
      const headers = { 'X-Telegram-Init-Data': API._initData || '' };
      if (API._devUserId) headers['X-Dev-User-Id'] = API._devUserId;
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      const data = await response.json();
      if (!response.ok) throw { status: response.status, message: data.error || 'Upload failed', data };
      return data;
    },
    activateCode: (code) => API.post('/auth/activate-code', { code })
  },

  // ============================================
  // SERVICES
  // ============================================

  services: {
    list: (category) => API.get(`/services${category ? `?category=${category}` : ''}`),
    get: (id) => API.get(`/services/${id}`),
    create: (data) => API.post('/services', data),
    update: (id, data) => API.put(`/services/${id}`, data),
    delete: (id) => API.delete(`/services/${id}`),
    getCategories: () => API.get('/services/categories'),
    getBanner: () => API.get('/services/banner')
  },

  // ============================================
  // MASTERS
  // ============================================

  masters: {
    list: (serviceId) => API.get(`/masters${serviceId ? `?service_id=${serviceId}` : ''}`),
    get: (id) => API.get(`/masters/${id}`),
    me: () => API.get('/masters/me'),
    updateMe: (data) => API.put('/masters/me', data),
    update: (id, data) => API.put(`/masters/${id}`, data),
    addService: (data) => API.post('/masters/me/services', data),
    removeService: (serviceId) => API.delete(`/masters/me/services/${serviceId}`)
  },

  // ============================================
  // SCHEDULE
  // ============================================

  schedule: {
    getSlots: (masterId, serviceId, date) =>
      API.get(`/schedule/slots?master_id=${masterId}&service_id=${serviceId}&date=${date}`),
    getMasterSchedule: (masterId) => API.get(`/schedule/master/${masterId}`),
    updateSchedule: (masterId, schedule) => API.put(`/schedule/master/${masterId}`, { schedule }),
    addBreak: (masterId, data) => API.post(`/schedule/master/${masterId}/breaks`, data),
    deleteBreak: (masterId, breakId) => API.delete(`/schedule/master/${masterId}/breaks/${breakId}`),
    addException: (masterId, data) => API.post(`/schedule/master/${masterId}/exceptions`, data)
  },

  // ============================================
  // BOOKINGS
  // ============================================

  bookings: {
    my: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/bookings/my${q ? `?${q}` : ''}`);
    },
    masterBookings: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/bookings/master${q ? `?${q}` : ''}`);
    },
    get: (id) => API.get(`/bookings/${id}`),
    create: (data) => API.post('/bookings', data),
    updateStatus: (id, status, reason) => API.put(`/bookings/${id}/status`, { status, cancel_reason: reason }),
    review: (id, data) => API.post(`/bookings/${id}/review`, data),
    adminAll: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/bookings/admin/all${q ? `?${q}` : ''}`);
    }
  },

  // ============================================
  // ACCESS CODES
  // ============================================

  accessCodes: {
    list: () => API.get('/access-codes'),
    create: (data) => API.post('/access-codes', data),
    delete: (id) => API.delete(`/access-codes/${id}`),
    validate: (code) => API.post('/access-codes/validate', { code })
  },

  // ============================================
  // PORTFOLIO
  // ============================================

  portfolio: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/portfolio${q ? `?${q}` : ''}`);
    },
    masterPortfolio: (masterId, category) =>
      API.get(`/portfolio/master/${masterId}${category ? `?category=${category}` : ''}`),
    create: async (formData) => {
      const url = `${Config.API_URL}/portfolio`;
      const headers = {
        'X-Telegram-Init-Data': API._initData || ''
      };
      if (API._devUserId) headers['X-Dev-User-Id'] = API._devUserId;

      const response = await fetch(url, { method: 'POST', headers, body: formData });
      const data = await response.json();
      if (!response.ok) throw { status: response.status, message: data.error, data };
      return data;
    },
    update: (id, data) => API.put(`/portfolio/${id}`, data),
    delete: (id) => API.delete(`/portfolio/${id}`)
  },

  // ============================================
  // ADMIN
  // ============================================

  admin: {
    dashboard: () => API.get('/admin/dashboard'),
    users: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/admin/users${q ? `?${q}` : ''}`);
    },
    updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
    crm: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/admin/crm${q ? `?${q}` : ''}`);
    },
    updateCrm: (userId, data) => API.put(`/admin/crm/${userId}`, data),
    analytics: (period) => API.get(`/admin/analytics${period ? `?period=${period}` : ''}`),
    notify: (data) => API.post('/admin/notify', data),
    dialog: (userId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return API.get(`/admin/dialog/${userId}${q ? `?${q}` : ''}`);
    },
    sendDialog: (userId, data) => API.post(`/admin/dialog/${userId}`, data),
    getCategories: () => API.get('/admin/categories'),
    createCategory: (data) => API.post('/admin/categories', data),
    updateCategory: (id, data) => API.put(`/admin/categories/${id}`, data),
    deleteCategory: (id) => API.delete(`/admin/categories/${id}`),
    getBanner: () => API.get('/admin/banner'),
    updateBanner: (image_url) => API.put('/admin/banner', { image_url }),
    deleteBanner: () => API.delete('/admin/banner')
  }
};
