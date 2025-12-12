import { $, showToast, escapeHtml } from './utils.js';

let focusTimer = null;
let timeLeft = 25 * 60;
let initialTime = 25 * 60;
let isRunning = false;
let isPaused = false;

let focusTasks = [];
let focusStats = {
  todayCount: 0,
  todayMinutes: 0,
  lastDate: new Date().toDateString()
};

export function initFocusMode() {
  loadFocusData();
  
  const els = {
    btn: $('#focusBtn'),
    panel: $('#focusMode'),
    exit: $('#exitFocusBtn'),
    start: $('#focusStartBtn'),
    pause: $('#focusPauseBtn'),
    reset: $('#focusResetBtn'),
    slider: $('#focusOpacitySlider'),
    addBtn: $('#addFocusTaskBtn'),
    input: $('#newFocusTaskInput'),
    list: $('#focusTasksList')
  };

  // Visibility Controls
  els.btn?.addEventListener('click', () => {
    els.panel.classList.remove('hidden');
    checkDateReset();
    updateStatsUI();
  });

  els.exit?.addEventListener('click', () => {
    if (isRunning && !confirm('确定要退出吗？')) return;
    if (isRunning) resetTimer();
    els.panel.classList.add('hidden');
  });

  els.start?.addEventListener('click', startTimer);
  els.pause?.addEventListener('click', pauseTimer);
  els.reset?.addEventListener('click', resetTimer);

  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) return;
      
      document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const mins = parseInt(btn.dataset.duration);
      timeLeft = initialTime = mins * 60;
      updateTimerDisplay();
      updateProgress(0);
    });
  });

  if (els.slider) {
    els.slider.addEventListener('input', (e) => {
      const val = e.target.value;
      $('#focusOpacityValue').textContent = `${val}%`;
      els.panel.style.backgroundColor = `rgba(0, 0, 0, ${val / 100})`;
    });
    els.panel.style.backgroundColor = `rgba(0, 0, 0, 0.85)`;
  }

  // 任务管理
  els.addBtn?.addEventListener('click', () => {
    els.input.classList.toggle('hidden');
    if (!els.input.classList.contains('hidden')) els.input.focus();
  });

  els.input?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const text = els.input.value.trim();
      if (text) {
        addFocusTask(text);
        els.input.value = '';
        els.input.classList.add('hidden');
      }
    }
  });

  els.list?.addEventListener('click', handleTaskAction);
  
  renderFocusTasks();
  updateStatsUI();
}

function loadFocusData() {
  try {
    focusTasks = JSON.parse(localStorage.getItem('startpage.focusTasks') || '[]');
    focusStats = JSON.parse(localStorage.getItem('startpage.focusStats') || JSON.stringify(focusStats));
    checkDateReset();
  } catch (e) {
    console.error('Load focus data error', e);
    focusTasks = [];
  }
}

function saveData() {
  localStorage.setItem('startpage.focusTasks', JSON.stringify(focusTasks));
  localStorage.setItem('startpage.focusStats', JSON.stringify(focusStats));
}

function checkDateReset() {
  const today = new Date().toDateString();
  if (focusStats.lastDate !== today) {
    focusStats.todayCount = 0;
    focusStats.todayMinutes = 0;
    focusStats.lastDate = today;
    saveData();
  }
}

function startTimer() {
  if (isRunning) return;
  
  isRunning = true;
  isPaused = false;
  
  $('#focusStartBtn').classList.add('hidden');
  $('#focusPauseBtn').classList.remove('hidden');
  $('#focusTimerLabel').textContent = '专注中...';
  
  focusTimer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    updateProgress(1 - (timeLeft / initialTime));
    
    if (timeLeft <= 0) completeTimer();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  
  clearInterval(focusTimer);
  isRunning = false;
  isPaused = true;
  
  $('#focusStartBtn').classList.remove('hidden');
  $('#focusPauseBtn').classList.add('hidden');
  $('#focusTimerLabel').textContent = '已暂停';
}

function resetTimer() {
  clearInterval(focusTimer);
  isRunning = false;
  isPaused = false;
  
  const activeBtn = document.querySelector('.duration-btn.active');
  const mins = activeBtn ? parseInt(activeBtn.dataset.duration) : 25;
  timeLeft = initialTime = mins * 60;
  
  updateTimerDisplay();
  updateProgress(0);
  
  $('#focusStartBtn').classList.remove('hidden');
  $('#focusPauseBtn').classList.add('hidden');
  $('#focusTimerLabel').textContent = '准备开始';
}

function completeTimer() {
  resetTimer();
  
  try {
    new Audio('music/bell.mp3').play().catch(() => {});
  } catch {}
  
  const mins = Math.floor(initialTime / 60);
  focusStats.todayCount++;
  focusStats.todayMinutes += mins;
  saveData();
  updateStatsUI();
  
  showToast('专注完成！休息一下吧喵~');
  
  if (Notification.permission === 'granted') {
    new Notification('专注完成', { body: `你刚刚完成了 ${mins} 分钟的专注！` });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function updateTimerDisplay() {
  const display = $('#focusTimeDisplay');
  if (!display) return;
  
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateProgress(percent) {
  const circle = document.querySelector('.focus-progress-ring .progress-ring-circle');
  if (!circle) return;
  
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference - (percent * circumference);
}

function addFocusTask(text) {
  focusTasks.push({ id: Date.now(), text, completed: false });
  saveData();
  renderFocusTasks();
}

function renderFocusTasks() {
  const list = $('#focusTasksList');
  if (!list) return;
  
  if (!focusTasks.length) {
    list.innerHTML = '<div class="empty-state">暂无任务</div>';
    return;
  }
  
  list.innerHTML = focusTasks.map(task => `
    <div class="focus-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-check">
      <span>${escapeHtml(task.text)}</span>
      <button class="delete-task-btn">×</button>
    </div>
  `).join('');
}

function handleTaskAction(e) {
  const item = e.target.closest('.focus-task-item');
  if (!item) return;
  
  const id = Number(item.dataset.id);
  const task = focusTasks.find(t => t.id === id);
  
  if (e.target.classList.contains('task-check')) {
    if (task) {
      task.completed = e.target.checked;
      saveData();
      item.classList.toggle('completed', task.completed);
    }
  } else if (e.target.classList.contains('delete-task-btn')) {
    focusTasks = focusTasks.filter(t => t.id !== id);
    saveData();
    renderFocusTasks();
  }
}

function updateStatsUI() {
  $('#todayPomodoroCount').textContent = focusStats.todayCount;
  $('#todayFocusTime').textContent = `${focusStats.todayMinutes}分钟`;
}
