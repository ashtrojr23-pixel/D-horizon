// ===== ANALYTICS MODULE =====
const Analytics = {
  period: 'week',

  init() {
    this.bindPeriodToggle();
    this.render();
  },

  bindPeriodToggle() {
    document.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.period = btn.dataset.period;
        this.render();
      });
    });
  },

  render() {
    this.renderStats();
    this.renderCharts();
    this.renderAlerts();
    this.renderSuggestions();
    this.renderAchievements();
  },

  _getDays() {
    return { week: 7, month: 30, year: 365 }[this.period] || 7;
  },

  _getDateRange() {
    const days = this._getDays();
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  },

  renderStats() {
    const goals = LifeOS.getGoals();
    const habits = LifeOS.getHabits();
    const f = LifeOS.getFinances();

    const totalGoals = goals.length;
    const achievedGoals = goals.filter(g => g.achieved).length;
    const totalDreams = goals.reduce((s, g) => s + (g.price || 0), 0);
    const totalExpenses = (f.expenses || []).reduce((s, e) => s + e.amount, 0);
    const habitsDoneToday = habits.filter(h => {
      const today = new Date().toISOString().split('T')[0];
      return (h.log || []).includes(today);
    }).length;
    const salary = f.salary || 0;
    const savings = salary - totalExpenses;

    const set = (id, val, from = 0) => {
      const el = document.getElementById(id);
      if (el) animateCount(el, from, val, 800);
    };
    set('stat-goals', totalGoals);
    set('stat-achieved', achievedGoals);
    set('stat-habits', habitsDoneToday);
    set('stat-salary', salary, 0);

    const savingsEl = document.getElementById('stat-savings');
    if (savingsEl) {
      savingsEl.textContent = fmt.ksh(savings);
      savingsEl.style.color = savings >= 0 ? 'var(--green)' : 'var(--red)';
    }

    const progressEl = document.getElementById('goals-progress-bar');
    if (progressEl) {
      const pct = totalGoals ? (achievedGoals / totalGoals) * 100 : 0;
      progressEl.style.width = pct + '%';
    }
  },

  renderCharts() {
    const dates = this._getDateRange();
    const habits = LifeOS.getHabits();
    const f = LifeOS.getFinances();

    // Habit completion per day
    const labels = this.period === 'year'
      ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      : dates.map(d => { const dd = new Date(d); return `${dd.getDate()}/${dd.getMonth()+1}`; });

    let habitData;
    if (this.period === 'year') {
      habitData = Array.from({ length: 12 }, (_, m) => {
        const year = new Date().getFullYear();
        return habits.reduce((sum, h) => {
          return sum + (h.log || []).filter(l => {
            const ld = new Date(l);
            return ld.getFullYear() === year && ld.getMonth() === m;
          }).length;
        }, 0);
      });
    } else {
      habitData = dates.map(date => {
        return habits.filter(h => (h.log || []).includes(date)).length;
      });
    }

    Charts.drawBar('habits-chart', labels, habitData, ['#1a3aff', '#2d5bff', '#4d7cff']);

    // Expense trend
    const expenseData = this.period === 'year'
      ? Array.from({ length: 12 }, (_, m) => {
          const year = new Date().getFullYear();
          return (f.expenses || []).filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === m;
          }).reduce((s, e) => s + e.amount, 0);
        })
      : dates.map(date => {
          return (f.expenses || []).filter(e => e.date?.startsWith(date)).reduce((s, e) => s + e.amount, 0);
        });

    Charts.drawLine('expenses-chart', labels, [
      { values: expenseData, color: '#ff2d78', label: 'Expenses' },
    ]);

    // Goals by category donut
    const goals = LifeOS.getGoals();
    const cats = {};
    goals.forEach(g => { cats[g.category] = (cats[g.category] || 0) + 1; });
    const donutColors = ['#1a3aff','#ff2d78','#c9a84c','#00e5a0','#ff8c42','#4d7cff'];
    const donutSegs = Object.entries(cats).map(([k, v], i) => ({ label: k, value: v, color: donutColors[i % donutColors.length] }));
    if (donutSegs.length) Charts.drawDonut('goals-donut', donutSegs);

    // Render donut legend
    const legendEl = document.getElementById('donut-legend');
    if (legendEl) {
      legendEl.innerHTML = donutSegs.map(s => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${s.color}"></div>
          <span>${s.label}: <strong>${s.value}</strong></span>
        </div>`).join('');
    }
  },

  renderAlerts() {
    const alerts = [];
    const f = LifeOS.getFinances();
    const salary = f.salary || 0;

    // Check budget overruns
    (f.budget || []).forEach(b => {
      const used = (f.expenses || []).filter(e => e.category === b.name).reduce((s, e) => s + e.amount, 0);
      const pct = b.allocated ? (used / b.allocated) * 100 : 0;
      if (pct > 100) alerts.push({ type: 'red', icon: '🚨', title: `Over budget: ${b.name}`, text: `You've spent ${fmt.ksh(used)} of ${fmt.ksh(b.allocated)} allocated (${pct.toFixed(0)}% used).` });
      else if (pct > 80) alerts.push({ type: 'orange', icon: '⚠️', title: `Near limit: ${b.name}`, text: `You've used ${pct.toFixed(0)}% of your ${b.name} budget.` });
    });

    // Check habits
    const habits = LifeOS.getHabits();
    const today = new Date().toISOString().split('T')[0];
    const missed = habits.filter(h => !(h.log || []).includes(today));
    if (missed.length > 0) alerts.push({ type: 'orange', icon: '🔔', title: `${missed.length} habit${missed.length > 1 ? 's' : ''} not done today`, text: missed.map(h => h.name).join(', ') });

    // Check goals due soon
    const goals = LifeOS.getGoals();
    const soonGoals = goals.filter(g => !g.achieved && fmt.daysLeft(g.targetDate) <= 14 && fmt.daysLeft(g.targetDate) > 0);
    if (soonGoals.length) alerts.push({ type: 'blue', icon: '📅', title: `${soonGoals.length} goal${soonGoals.length > 1 ? 's' : ''} due within 2 weeks`, text: soonGoals.map(g => g.name).join(', ') });

    // Salary unset
    if (!salary) alerts.push({ type: 'red', icon: '💳', title: 'Salary not set', text: 'Set your monthly salary in the Finances section for better planning.' });

    const container = document.getElementById('alerts-list');
    if (!container) return;
    if (!alerts.length) {
      container.innerHTML = '<div class="alert-card alert-green"><div class="alert-icon">✅</div><div><div class="alert-title">All clear!</div><div class="alert-text">No warnings at the moment. Keep it up!</div></div></div>';
      return;
    }
    container.innerHTML = alerts.map(a => `
      <div class="alert-card alert-${a.type}">
        <div class="alert-icon">${a.icon}</div>
        <div>
          <div class="alert-title">${a.title}</div>
          <div class="alert-text">${a.text}</div>
        </div>
      </div>`).join('');
  },

  renderSuggestions() {
    const suggestions = [];
    const goals = LifeOS.getGoals();
    const habits = LifeOS.getHabits();
    const f = LifeOS.getFinances();

    if (!habits.length) suggestions.push('Start tracking daily habits — even 1 habit builds momentum over time.');
    if (goals.length === 0) suggestions.push('Add your first goal with a target date to kickstart your planning journey.');
    if (f.salary && !f.budget?.length) suggestions.push('Set budget categories based on your salary to track spending effectively.');
    const achieved = goals.filter(g => g.achieved).length;
    if (goals.length > 0 && achieved === 0) suggestions.push('Mark goals as achieved when you complete them to track your progress.');
    const shortGoals = goals.filter(g => fmt.planCategory(g.targetDate) === 'short');
    if (shortGoals.length > 5) suggestions.push('You have many short-term goals. Prioritize 2–3 to stay focused this month.');
    if (f.salary && f.expenses) {
      const totalExp = (f.expenses || []).reduce((s, e) => s + e.amount, 0);
      if (totalExp > f.salary * 0.8) suggestions.push('Your expenses are high relative to income. Consider reviewing discretionary spending.');
    }
    if (!suggestions.length) suggestions.push('You\'re doing great! Keep maintaining your habits and ticking off those goals.');

    const container = document.getElementById('suggestions-list');
    if (!container) return;
    container.innerHTML = suggestions.map((s, i) => `
      <div class="suggestion-card" style="animation-delay:${i*0.1}s">
        <div class="suggestion-icon">💡</div>
        <div class="suggestion-text">${s}</div>
      </div>`).join('');
  },

  renderAchievements() {
    const goals = LifeOS.getGoals();
    const achieved = goals.filter(g => g.achieved);
    const container = document.getElementById('achievements-list');
    if (!container) return;
    if (!achieved.length) { container.innerHTML = '<div class="text-dim text-sm text-center" style="padding:20px;">No achievements yet — mark goals as done!</div>'; return; }
    container.innerHTML = achieved.slice(0, 6).map(g => `
      <div class="metric-card">
        <div class="metric-icon">🏆</div>
        <div class="metric-info">
          <div class="metric-label">${g.category}</div>
          <div style="font-weight:600;">${g.name}</div>
        </div>
        <div class="badge badge-green">Done</div>
      </div>`).join('');
  }
};
window.Analytics = Analytics;
