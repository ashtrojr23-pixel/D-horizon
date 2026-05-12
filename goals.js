// ===== GOALS MODULE =====
const Goals = {
  categories: [
    { id: 'all', label: '✨ All', icon: '✨' },
    { id: 'project', label: '🚀 Projects', icon: '🚀' },
    { id: 'dream', label: '💭 Dreams', icon: '💭' },
    { id: 'car', label: '🚗 Cars', icon: '🚗' },
    { id: 'house', label: '🏠 Houses', icon: '🏠' },
    { id: 'furniture', label: '🛋️ Furniture', icon: '🛋️' },
    { id: 'shopping', label: '🛒 Shopping', icon: '🛒' },
    { id: 'education', label: '📚 Education', icon: '📚' },
    { id: 'travel', label: '✈️ Travel', icon: '✈️' },
    { id: 'health', label: '💪 Health', icon: '💪' },
    { id: 'business', label: '💼 Business', icon: '💼' },
    { id: 'other', label: '📌 Other', icon: '📌' },
  ],

  currentCat: 'all',
  _countdownTimers: [],

  init() {
    this.renderCategoryTabs();
    this.renderGoals();
    this.bindAddBtn();
    this.startCountdowns();
  },

  renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;
    container.innerHTML = this.categories.map(c => `
      <button class="cat-tab ${c.id === this.currentCat ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>
    `).join('');
    container.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentCat = btn.dataset.cat;
        container.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderGoals();
      });
    });
  },

  renderGoals() {
    const goals = LifeOS.getGoals();
    const filtered = this.currentCat === 'all' ? goals : goals.filter(g => g.category === this.currentCat);

    // Sort by plan category
    const short = filtered.filter(g => fmt.planCategory(g.targetDate) === 'short');
    const long = filtered.filter(g => fmt.planCategory(g.targetDate) === 'long');
    const future = filtered.filter(g => fmt.planCategory(g.targetDate) === 'future');
    const expired = filtered.filter(g => fmt.planCategory(g.targetDate) === 'expired');

    this._renderSection('goals-short', short, 'short');
    this._renderSection('goals-long', long, 'long');
    this._renderSection('goals-future', future, 'future');
    this._renderSection('goals-expired', expired, 'expired');

    // Update counts
    ['short','long','future','expired'].forEach(cat => {
      const badge = document.getElementById(`count-${cat}`);
      if (badge) badge.textContent = { short, long, future, expired }[cat].length;
    });

    updateFinanceWidget();
  },

  _renderSection(containerId, goals, cat) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!goals.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${{ short: '⏱️', long: '🗓️', future: '🌌', expired: '📦' }[cat]}</div>
          <div class="empty-title">No ${fmt.categoryLabel(cat)} Plans</div>
          <div class="empty-desc">Add a goal with a target date to see it here.</div>
        </div>`;
      return;
    }

    el.innerHTML = `<div class="grid-auto stagger-cards">${goals.map(g => this._goalCardHTML(g)).join('')}</div>`;
    // Bind card actions
    el.querySelectorAll('.goal-action-btn[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => this.deleteGoal(btn.dataset.id));
    });
    el.querySelectorAll('.goal-action-btn[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', () => this.editGoal(btn.dataset.id));
    });
    el.querySelectorAll('.goal-action-btn[data-action="achieve"]').forEach(btn => {
      btn.addEventListener('click', () => this.toggleAchieve(btn.dataset.id));
    });
  },

  _goalCardHTML(g) {
    const cat = fmt.planCategory(g.targetDate);
    const colorMap = { short: 'blue', long: 'pink', future: 'gold', expired: '' };
    const color = colorMap[cat] || '';
    const daysLeft = fmt.daysLeft(g.targetDate);
    const cd = fmt.countdown(g.targetDate);
    const catIcon = this.categories.find(c => c.id === g.category)?.icon || '📌';

    const imageHTML = g.image
      ? `<div class="goal-card-image"><img src="${g.image}" alt="${g.name}" loading="lazy"/></div>`
      : `<div class="goal-card-image flex items-center justify-center goal-card-image-placeholder">${catIcon}<span>${g.category || 'Goal'}</span></div>`;

    return `
    <div class="goal-card goal-card-${color} hover-gold ${g.achieved ? 'opacity-achieved' : ''}" id="goal-${g.id}">
      ${imageHTML}
      <div class="goal-card-header">
        <div>
          <div class="goal-card-title">${g.name}</div>
          ${g.description ? `<div class="text-sm text-dim mt-4">${g.description}</div>` : ''}
        </div>
        <div class="goal-card-actions">
          <button class="goal-action-btn edit" data-action="edit" data-id="${g.id}" title="Edit">✏️</button>
          <button class="goal-action-btn" data-action="achieve" data-id="${g.id}" title="${g.achieved ? 'Mark pending' : 'Mark achieved'}">${g.achieved ? '↩️' : '✅'}</button>
          <button class="goal-action-btn" data-action="delete" data-id="${g.id}" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="flex items-center gap-8" style="flex-wrap:wrap;">
        <span class="badge badge-${color || 'blue'}">${catIcon} ${g.category || 'other'}</span>
        ${g.achieved ? '<span class="badge badge-green">✅ Achieved</span>' : ''}
        <span class="badge badge-gold">📅 ${fmt.date(g.targetDate)}</span>
      </div>
      <div class="goal-card-price">${fmt.ksh(g.price)}</div>
      <div class="goal-countdown">
        ${cd.expired ? '<span class="text-red">⏰ Expired</span>' : `
        <span>⏳</span>
        <div class="countdown-segments" data-target="${g.targetDate}">
          <div class="countdown-seg"><span class="seg-val">${cd.d}</span><span class="seg-label">d</span></div>
          <div class="countdown-seg"><span class="seg-val">${cd.h}</span><span class="seg-label">h</span></div>
          <div class="countdown-seg"><span class="seg-val">${cd.m}</span><span class="seg-label">m</span></div>
          <div class="countdown-seg"><span class="seg-val">${cd.s}</span><span class="seg-label">s</span></div>
        </div>`}
      </div>
      ${g.notes ? `<div class="text-xs text-dim" style="border-top:1px solid var(--glass-border);padding-top:10px;margin-top:4px;">📝 ${g.notes}</div>` : ''}
    </div>`;
  },

  startCountdowns() {
    this._countdownTimers.forEach(t => clearInterval(t));
    this._countdownTimers = [];
    const t = setInterval(() => {
      document.querySelectorAll('.countdown-segments[data-target]').forEach(el => {
        const cd = fmt.countdown(el.dataset.target);
        const segs = el.querySelectorAll('.countdown-seg .seg-val');
        if (segs.length === 4) {
          [cd.d, cd.h, cd.m, cd.s].forEach((v, i) => {
            if (segs[i].textContent != v) {
              segs[i].textContent = v;
              segs[i].style.animation = 'none';
              requestAnimationFrame(() => { segs[i].style.animation = ''; segs[i].classList.add('countdown-tick'); });
              setTimeout(() => segs[i].classList.remove('countdown-tick'), 300);
            }
          });
        }
      });
    }, 1000);
    this._countdownTimers.push(t);
  },

  bindAddBtn() {
    const btn = document.getElementById('add-goal-btn');
    if (btn) btn.addEventListener('click', () => this.openAddModal());
    const saveBtn = document.getElementById('save-goal-btn');
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveGoal());
    const closeBtn = document.getElementById('goal-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => Modal.close('goal-modal'));

    // Image upload
    const imgUpload = document.getElementById('goal-image-upload');
    const imgPreview = document.getElementById('goal-image-preview');
    if (imgUpload) {
      imgUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (imgPreview) { imgPreview.src = ev.target.result; imgPreview.classList.remove('hidden'); }
          this._pendingImage = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
  },

  _editingId: null,
  _pendingImage: null,

  openAddModal(goalId = null) {
    this._editingId = goalId;
    this._pendingImage = null;
    const goal = goalId ? LifeOS.getGoals().find(g => g.id === goalId) : null;

    document.getElementById('goal-modal-title').textContent = goal ? 'Edit Goal' : 'New Goal';
    document.getElementById('goal-name').value = goal?.name || '';
    document.getElementById('goal-category').value = goal?.category || 'dream';
    document.getElementById('goal-price').value = goal?.price || '';
    document.getElementById('goal-target-date').value = goal?.targetDate || '';
    document.getElementById('goal-description').value = goal?.description || '';
    document.getElementById('goal-notes').value = goal?.notes || '';
    const imgPreview = document.getElementById('goal-image-preview');
    if (imgPreview) { imgPreview.src = goal?.image || ''; imgPreview.classList.toggle('hidden', !goal?.image); }
    if (goal?.image) this._pendingImage = goal.image;

    Modal.open('goal-modal');
  },

  saveGoal() {
    const name = document.getElementById('goal-name').value.trim();
    const category = document.getElementById('goal-category').value;
    const price = Number(document.getElementById('goal-price').value) || 0;
    const targetDate = document.getElementById('goal-target-date').value;
    const description = document.getElementById('goal-description').value.trim();
    const notes = document.getElementById('goal-notes').value.trim();

    if (!name) { Toast.show('Please enter a goal name.', 'error'); return; }
    if (!targetDate) { Toast.show('Please set a target date.', 'error'); return; }

    const goals = LifeOS.getGoals();
    if (this._editingId) {
      const idx = goals.findIndex(g => g.id === this._editingId);
      if (idx >= 0) {
        goals[idx] = { ...goals[idx], name, category, price, targetDate, description, notes, image: this._pendingImage || goals[idx].image };
        Toast.show('Goal updated!', 'success');
      }
    } else {
      goals.push({ id: uuid(), name, category, price, targetDate, description, notes, image: this._pendingImage || null, achieved: false, created: Date.now() });
      Toast.show('Goal added!', 'success');
    }
    LifeOS.saveGoals(goals);
    Modal.close('goal-modal');
    this.renderGoals();
  },

  deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    const goals = LifeOS.getGoals().filter(g => g.id !== id);
    LifeOS.saveGoals(goals);
    this.renderGoals();
    Toast.show('Goal removed.', 'info');
  },

  toggleAchieve(id) {
    const goals = LifeOS.getGoals();
    const idx = goals.findIndex(g => g.id === id);
    if (idx >= 0) {
      goals[idx].achieved = !goals[idx].achieved;
      LifeOS.saveGoals(goals);
      this.renderGoals();
      Toast.show(goals[idx].achieved ? '🎉 Marked as achieved!' : 'Marked as pending.', goals[idx].achieved ? 'success' : 'info');
    }
  },

  editGoal(id) { this.openAddModal(id); }
};

window.Goals = Goals;
