import { $, showToast, formatTime } from './utils.js';

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
  
  const focusBtn = $('#focusBtn');
  const focusModeEl = $('#focusMode');
  const exitBtn = $('#exitFocusBtn');
  
  const startBtn = $('#focusStartBtn');
  const pauseBtn = $('#focusPauseBtn');
  const resetBtn = $('#focusResetBtn');
  
  const durationBtns = document.querySelectorAll('.duration-btn');
  const opacitySlider = $('#focusOpacitySlider');
  const opacityValue = $('#focusOpacityValue');
  
  const addTaskBtn = $('#addFocusTaskBtn');
  const newTaskInput = $('#newFocusTaskInput');
  
  // Open/Close
  if (focusBtn && focusModeEl) {
    focusBtn.addEventListener('click', () => {
      focusModeEl.classList.remove('hidden');
      checkDateReset();
      updateStatsUI();
    });
  }
  
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      if (isRunning) {
        if (confirm('专注计时正在进行中，确定要退出吗？')) {
          resetTimer();
          focusModeEl.classList.add('hidden');
        }
      } else {
        focusModeEl.classList.add('hidden');
      }
    });
  }
  
  // Timer Controls
  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);
  
  // Duration Selection
  durationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) return;
      
      durationBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const mins = parseInt(btn.dataset.duration);
      timeLeft = mins * 60;
      initialTime = timeLeft;
      updateTimerDisplay();
      updateProgress(0);
    });
  });
  
  // Opacity Control
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const val = e.target.value;
      if (opacityValue) opacityValue.textContent = `${val}%`;
      focusModeEl.style.backgroundColor = `rgba(0, 0, 0, ${val / 100})`;
    });
    // Init default
    focusModeEl.style.backgroundColor = `rgba(0, 0, 0, 0.85)`;
  }
  
  // Tasks
  if (addTaskBtn && newTaskInput) {
    addTaskBtn.addEventListener('click', () => {
      newTaskInput.classList.toggle('hidden');
      if (!newTaskInput.classList.contains('hidden')) {
        newTaskInput.focus();
      }
    });
    
    newTaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const text = newTaskInput.value.trim();
        if (text) {
          addFocusTask(text);
          newTaskInput.value = '';
          newTaskInput.classList.add('hidden');
        }
      }
    });
  }
  
  renderFocusTasks();
  updateStatsUI();
}

function loadFocusData() {
  try {
    const tasks = localStorage.getItem('startpage.focusTasks');
    if (tasks) focusTasks = JSON.parse(tasks);
    
    const stats = localStorage.getItem('startpage.focusStats');
    if (stats) focusStats = JSON.parse(stats);
    
    checkDateReset();
  } catch (e) {
    console.error('Load focus data error', e);
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
    
    const progress = 1 - (timeLeft / initialTime);
    updateProgress(progress);
    
    if (timeLeft <= 0) {
      completeTimer();
    }
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
  
  // Reset to selected duration
  const activeBtn = document.querySelector('.duration-btn.active');
  const mins = activeBtn ? parseInt(activeBtn.dataset.duration) : 25;
  timeLeft = mins * 60;
  initialTime = timeLeft;
  
  updateTimerDisplay();
  updateProgress(0);
  
  $('#focusStartBtn').classList.remove('hidden');
  $('#focusPauseBtn').classList.add('hidden');
  $('#focusTimerLabel').textContent = '准备开始';
}

function completeTimer() {
  resetTimer();
  
  // Play sound
  try {
    const audio = new Audio('music/bell.mp3'); // Ensure this file exists or use a data URI
    audio.play().catch(() => {});
  } catch (e) {}
  
  // Update stats
  const mins = Math.floor(initialTime / 60);
  focusStats.todayCount++;
  focusStats.todayMinutes += mins;
  saveData();
  updateStatsUI();
  
  showToast('专注完成！休息一下吧');
  
  if (Notification.permission === 'granted') {
    new Notification('专注完成', { body: `你刚刚完成了 ${mins} 分钟的专注！` });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function updateTimerDisplay() {
  const display = $('#focusTimeDisplay');
  if (display) {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    display.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}

function updateProgress(percent) {
  // percent 0 to 1
  const circle = document.querySelector('.focus-progress-ring .progress-ring-circle');
  if (!circle) return;
  
  const radius = 85; // from HTML r="85"
  const circumference = 2 * Math.PI * radius;
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  const offset = circumference - (percent * circumference);
  circle.style.strokeDashoffset = offset;
}

function addFocusTask(text) {
  focusTasks.push({
    id: Date.now(),
    text: text,
    completed: false
  });
  saveData();
  renderFocusTasks();
}

function renderFocusTasks() {
  const list = $('#focusTasksList');
  if (!list) return;
  
  list.innerHTML = '';
  
  focusTasks.forEach(task => {
    const item = document.createElement('div');
    item.className = `focus-task-item ${task.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''}>
      <span>${task.text}</span>
      <button class="delete-task-btn">×</button>
    `;
    
    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveData();
      item.classList.toggle('completed');
    });
    
    const delBtn = item.querySelector('.delete-task-btn');
    delBtn.addEventListener('click', () => {
      focusTasks = focusTasks.filter(t => t.id !== task.id);
      saveData();
      renderFocusTasks();
    });
    
    list.appendChild(item);
  });
}

function updateStatsUI() {
  const countEl = $('#todayPomodoroCount');
  const timeEl = $('#todayFocusTime');
  
  if (countEl) countEl.textContent = focusStats.todayCount;
  if (timeEl) timeEl.textContent = `${focusStats.todayMinutes}分钟`;
}
