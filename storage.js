/* ===== STORAGE MODULE ===== */
const LifeOS = {
  // Encryption helpers (simple XOR + base64 for offline)
  _key: null,

  init(userKey) {
    this._key = userKey;
  },

  _encrypt(str) {
    if (!this._key) return btoa(str);
    let result = '';
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(str.charCodeAt(i) ^ this._key.charCodeAt(i % this._key.length));
    }
    return btoa(result);
  },

  _decrypt(str) {
    if (!this._key) return atob(str);
    try {
      const decoded = atob(str);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ this._key.charCodeAt(i % this._key.length));
      }
      return result;
    } catch {
      return atob(str);
    }
  },

  save(key, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem('los_' + key, this._encrypt(json));
    } catch (e) { console.error('Save error', e); }
  },

  load(key, fallback = null) {
    try {
      const raw = localStorage.getItem('los_' + key);
      if (!raw) return fallback;
      return JSON.parse(this._decrypt(raw));
    } catch {
      return fallback;
    }
  },

  remove(key) { localStorage.removeItem('los_' + key); },

  // Goals
  getGoals() { return this.load('goals', []); },
  saveGoals(goals) { this.save('goals', goals); },

  // Habits
  getHabits() { return this.load('habits', []); },
  saveHabits(h) { this.save('habits', h); },

  // Finances
  getFinances() { return this.load('finances', { salary: 0, budget: [], expenses: [] }); },
  saveFinances(f) { this.save('finances', f); },

  // Analytics
  getAnalytics() { return this.load('analytics', { logs: [] }); },
  saveAnalytics(a) { this.save('analytics', a); },

  // Settings
  getSettings() { return this.load('settings', { name: 'User', currency: 'KES', theme: 'dark' }); },
  saveSettings(s) { this.save('settings', s); },

  // Today log
  logDay(data) {
    const analytics = this.getAnalytics();
    const today = new Date().toISOString().split('T')[0];
    const idx = analytics.logs.findIndex(l => l.date === today);
    if (idx >= 0) { analytics.logs[idx] = { ...analytics.logs[idx], ...data, date: today }; }
    else { analytics.logs.push({ date: today, ...data }); }
    this.saveAnalytics(analytics);
  }
};

// Export for use in other scripts (module-like pattern without ESM)
window.LifeOS = LifeOS;
