// ===== HABITS MODULE =====
const Habits = {
  init() {
    this.renderHabits();
    const addBtn = document.getElementById('add-habit-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.addHabit());
  },

  renderHabits() {
    const habits = LifeOS.getHabits();
    const container = document.getElementById('habits-list');
    if (!container) return;
    if (!habits.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-title">No habits yet</div><div class="empty-desc">Build great habits to transform your life.</div></div>`;
      return;
    }
    container.innerHTML = habits.map(h => this._habitHTML(h)).join('');
    container.querySelectorAll('.habit-checkbox').forEach(cb => {
      cb.addEventListener('click', () => this.toggleToday(cb.dataset.id));
    });
    container.querySelectorAll('.habit-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deleteHabit(btn.dataset.id));
    });
  },

  _habitHTML(h) {
    const today = new Date().toISOString().split('T')[0];
    const doneToday = (h.log || []).includes(today);
    const streak = this._calcStreak(h.log || []);
    // Last 7 days
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const isToday = ds === today;
      const done = (h.log || []).includes(ds);
      week.push(`<div class="week-dot ${done ? 'done' : (isToday ? 'today' : '')}" title="${ds}"></div>`);
    }
    return `
    <div class="habit-item">
      <div class="habit-checkbox ${doneToday ? 'checked' : ''}" data-id="${h.id}" title="Mark done today">${doneToday ? '✓' : ''}</div>
      <div class="habit-info">
        <div class="habit-name">${h.icon || '✨'} ${h.name}</div>
        <div class="habit-streak">Streak: <span class="habit-streak-badge">🔥 ${streak} days</span></div>
        <div class="habit-week" style="margin-top:6px;">${week.join('')}</div>
      </div>
      <button class="goal-action-btn habit-delete" data-id="${h.id}" title="Delete">🗑️</button>
    </div>`;
  },

  _calcStreak(log) {
    if (!log.length) return 0;
    const sorted = [...log].sort().reverse();
    let streak = 0;
    let d = new Date(); d.setHours(0,0,0,0);
    for (const entry of sorted) {
      const entryDate = new Date(entry); entryDate.setHours(0,0,0,0);
      const diff = (d - entryDate) / 86400000;
      if (diff <= 1) { streak++; d = entryDate; }
      else break;
    }
    return streak;
  },

  toggleToday(id) {
    const habits = LifeOS.getHabits();
    const idx = habits.findIndex(h => h.id === id);
    if (idx < 0) return;
    const today = new Date().toISOString().split('T')[0];
    if (!habits[idx].log) habits[idx].log = [];
    const li = habits[idx].log.indexOf(today);
    if (li >= 0) { habits[idx].log.splice(li, 1); Toast.show('Habit unchecked.', 'info'); }
    else { habits[idx].log.push(today); Toast.show('🔥 Habit done!', 'success'); }
    LifeOS.saveHabits(habits);
    this.renderHabits();
  },

  addHabit() {
    const name = prompt('Habit name:');
    if (!name) return;
    const icon = prompt('Emoji icon (optional):', '✨') || '✨';
    const habits = LifeOS.getHabits();
    habits.push({ id: uuid(), name, icon, log: [], created: Date.now() });
    LifeOS.saveHabits(habits);
    this.renderHabits();
    Toast.show('Habit added!', 'success');
  },

  deleteHabit(id) {
    if (!confirm('Delete habit?')) return;
    LifeOS.saveHabits(LifeOS.getHabits().filter(h => h.id !== id));
    this.renderHabits();
  }
};
window.Habits = Habits;

// ===== FINANCES MODULE =====
const Finances = {
  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const f = LifeOS.getFinances();
    const salaryEl = document.getElementById('salary-display');
    if (salaryEl) salaryEl.textContent = fmt.ksh(f.salary || 0);
    this.renderBudget();
    this.renderExpenses();
    this.renderGoalSummary();
  },

  renderBudget() {
    const f = LifeOS.getFinances();
    const salary = f.salary || 0;
    const container = document.getElementById('budget-list');
    if (!container) return;
    if (!f.budget || !f.budget.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-title">No budget set</div></div>';
      return;
    }
    container.innerHTML = f.budget.map(b => {
      const pct = salary ? Math.min((b.allocated / salary) * 100, 100) : 0;
      const used = (f.expenses || []).filter(e => e.category === b.name).reduce((s, e) => s + e.amount, 0);
      const usedPct = b.allocated ? Math.min((used / b.allocated) * 100, 100) : 0;
      const status = usedPct > 90 ? 'red' : usedPct > 70 ? 'orange' : 'green';
      return `
      <div class="budget-bar">
        <div class="budget-bar-header">
          <span class="budget-bar-name">${b.icon || '💼'} ${b.name}</span>
          <span class="budget-bar-amount text-dim">${fmt.ksh(used)} / <span class="text-gold">${fmt.ksh(b.allocated)}</span></span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill progress-${status === 'red' ? 'pink' : status === 'orange' ? 'gold' : 'green'}" style="width:${usedPct}%;animation:progressGrow 0.8s ease;"></div>
        </div>
        <div class="text-xs text-dim mt-4" style="display:flex;justify-content:space-between;">
          <span>${usedPct.toFixed(0)}% used</span>
          ${usedPct > 90 ? '<span class="text-red">⚠️ Over budget!</span>' : ''}
        </div>
      </div>`;
    }).join('');
  },

  renderExpenses() {
    const f = LifeOS.getFinances();
    const container = document.getElementById('expenses-list');
    if (!container) return;
    const recent = (f.expenses || []).slice(-10).reverse();
    if (!recent.length) { container.innerHTML = '<div class="text-dim text-sm text-center" style="padding:20px;">No expenses logged.</div>'; return; }
    container.innerHTML = recent.map(e => `
      <div class="metric-card" style="margin-bottom:8px;">
        <div class="metric-icon">${e.icon || '💸'}</div>
        <div class="metric-info">
          <div class="metric-label">${e.category || 'General'}</div>
          <div style="font-size:0.88rem;">${e.name}</div>
          <div class="text-xs text-dim">${fmt.date(e.date)}</div>
        </div>
        <div class="font-mono text-pink font-bold">-${fmt.ksh(e.amount)}</div>
      </div>`).join('');
  },

  renderGoalSummary() {
    const goals = LifeOS.getGoals();
    const total = goals.reduce((s, g) => s + (g.price || 0), 0);
    const achieved = goals.filter(g => g.achieved).reduce((s, g) => s + (g.price || 0), 0);
    const el = document.getElementById('goals-total-cost');
    if (el) el.textContent = fmt.ksh(total);
    const el2 = document.getElementById('goals-achieved-cost');
    if (el2) el2.textContent = fmt.ksh(achieved);
  },

  bindEvents() {
    const salaryBtn = document.getElementById('set-salary-btn');
    if (salaryBtn) salaryBtn.addEventListener('click', () => {
      const val = prompt('Enter your monthly salary (KSh):');
      if (!val) return;
      const f = LifeOS.getFinances();
      f.salary = Number(val.replace(/,/g, '')) || 0;
      LifeOS.saveFinances(f);
      this.render();
      Toast.show('Salary updated!', 'success');
    });

    const addBudgetBtn = document.getElementById('add-budget-btn');
    if (addBudgetBtn) addBudgetBtn.addEventListener('click', () => {
      const name = prompt('Budget category name (e.g. Food, Rent):');
      if (!name) return;
      const amount = Number(prompt('Allocated amount (KSh):') || 0);
      const icon = prompt('Emoji icon:', '💼') || '💼';
      const f = LifeOS.getFinances();
      if (!f.budget) f.budget = [];
      f.budget.push({ name, allocated: amount, icon });
      LifeOS.saveFinances(f);
      this.render();
      Toast.show('Budget category added!', 'success');
    });

    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => this.addExpense());

    const saveExpenseBtn = document.getElementById('save-expense-btn');
    if (saveExpenseBtn) saveExpenseBtn.addEventListener('click', () => this.saveExpense());
  },

  addExpense() {
    const f = LifeOS.getFinances();
    const cats = (f.budget || []).map(b => b.name);
    // Populate category dropdown
    const catSel = document.getElementById('expense-category');
    if (catSel) {
      catSel.innerHTML = `<option value="">Select category</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
    }
    Modal.open('expense-modal');
  },

  saveExpense() {
    const name = document.getElementById('expense-name')?.value.trim();
    const amount = Number(document.getElementById('expense-amount')?.value || 0);
    const category = document.getElementById('expense-category')?.value;
    const icon = document.getElementById('expense-icon')?.value || '💸';
    if (!name || !amount) { Toast.show('Fill in expense details.', 'error'); return; }
    const f = LifeOS.getFinances();
    if (!f.expenses) f.expenses = [];
    f.expenses.push({ id: uuid(), name, amount, category, icon, date: new Date().toISOString() });
    LifeOS.saveFinances(f);
    Modal.close('expense-modal');
    this.render();
    Toast.show('Expense logged!', 'success');
  }
};
window.Finances = Finances;

// ===== CHARTS MODULE (pure Canvas/SVG, no libraries) =====
const Charts = {
  drawBar(canvasId, labels, values, colors) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(...values, 1);
    const barW = (W - 40) / labels.length - 8;
    const padBottom = 30, padTop = 20;
    const chartH = H - padBottom - padTop;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W, y); ctx.stroke();
    }

    labels.forEach((label, i) => {
      const x = 30 + i * (barW + 8) + 4;
      const pct = values[i] / max;
      const bH = pct * chartH;
      const y = padTop + chartH - bH;

      // Gradient bar
      const grad = ctx.createLinearGradient(x, y, x, padTop + chartH);
      const c = colors[i % colors.length];
      grad.addColorStop(0, c);
      grad.addColorStop(1, c + '44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bH, [4, 4, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(240,240,255,0.6)';
      ctx.font = '10px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barW / 2, H - 8);

      // Value
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Space Mono, monospace';
      ctx.fillText(values[i].toLocaleString(), x + barW / 2, y - 4);
    });
  },

  drawLine(canvasId, labels, datasets) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const allVals = datasets.flatMap(d => d.values);
    const max = Math.max(...allVals, 1);
    const padL = 40, padR = 20, padT = 20, padB = 30;
    const cW = W - padL - padR, cH = H - padT - padB;

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px Space Mono';
      ctx.fillText(Math.round(max - (max / 4) * i).toLocaleString(), 0, y + 3);
    }

    datasets.forEach(ds => {
      const pts = ds.values.map((v, i) => ({
        x: padL + (i / (ds.values.length - 1 || 1)) * cW,
        y: padT + cH - (v / max) * cH
      }));

      // Area fill
      const grad = ctx.createLinearGradient(0, padT, 0, padT + cH);
      grad.addColorStop(0, ds.color + '44');
      grad.addColorStop(1, ds.color + '00');
      ctx.beginPath();
      ctx.moveTo(pts[0].x, padT + cH);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length - 1].x, padT + cH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Dots
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ds.color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      });
    });

    // X labels
    labels.forEach((l, i) => {
      const x = padL + (i / (labels.length - 1 || 1)) * cW;
      ctx.fillStyle = 'rgba(240,240,255,0.5)';
      ctx.font = '9px Space Mono';
      ctx.textAlign = 'center';
      ctx.fillText(l, x, H - 8);
    });
  },

  drawDonut(canvasId, segments) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const r = Math.min(cx, cy) - 10;
    const inner = r * 0.55;
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
    let start = -Math.PI / 2;
    segments.forEach(seg => {
      const angle = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      start += angle;
    });
    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a12';
    ctx.fill();
    // Center text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Space Mono';
    ctx.textAlign = 'center';
    ctx.fillText(total.toLocaleString(), cx, cy + 5);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px DM Sans';
    ctx.fillText('Total', cx, cy + 20);
  }
};
window.Charts = Charts;
