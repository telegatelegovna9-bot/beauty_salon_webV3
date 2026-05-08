// ============================================
// GLOBAL STATE STORE
// ============================================

const Store = {
  _state: {
    user: null,
    masterProfile: null,
    clientProfile: null,
    services: [],
    masters: [],
    currentBooking: {
      service: null,
      master: null,
      date: null,
      time: null,
      slot: null
    }
  },

  _listeners: {},

  get(key) {
    return key ? this._state[key] : this._state;
  },

  set(key, value) {
    this._state[key] = value;
    this._notify(key, value);
  },

  update(key, partial) {
    if (typeof this._state[key] === 'object' && this._state[key] !== null) {
      this._state[key] = { ...this._state[key], ...partial };
    } else {
      this._state[key] = partial;
    }
    this._notify(key, this._state[key]);
  },

  on(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(callback);
    return () => this.off(key, callback);
  },

  off(key, callback) {
    if (this._listeners[key]) {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    }
  },

  _notify(key, value) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(cb => cb(value));
    }
  },

  // Helpers
  isAdmin: () => Store._state.user?.role === 'admin',
  isMaster: () => Store._state.user?.role === 'master' || Store._state.user?.role === 'admin',
  isClient: () => Store._state.user?.role === 'client',

  resetBooking() {
    this.set('currentBooking', {
      service: null,
      master: null,
      date: null,
      time: null,
      slot: null
    });
  }
};
