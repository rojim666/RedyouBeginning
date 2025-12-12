import { $, showToast } from './utils.js';
import { renderEnginesEditor } from './search.js';
import { renderLinksEditor } from './links.js';
import { renderBookmarksEditor } from './bookmarks.js';
import { openBackgroundDialog } from './background.js';
import { fetchQuote } from '../api/api.js';

const defaultSettings = {
  showGlassCard: true,
  showWeather: true,
  showMusicPlayer: true,
  clockSize: 48,
  clockTextOpacity: 100,
  clockBgOpacity: 80,
  clockColor: null,
  showClock: true,
  showSeconds: false,
  greetingSize: 16,
  greetingTextOpacity: 100,
  greetingBgOpacity: 80,
  greetingColor: null,
  showGreeting: true,
  quoteSize: 13,
  quoteTextOpacity: 85,
  quoteBgOpacity: 80,
  quoteColor: null,
  showQuote: true,
  searchSize: 100,
  searchBgOpacity: 72,
  showSearch: true,
  showSearchBtn: true,
  bookmarkColumns: 6,
  showBookmarks: true,
  bookmarkSize: 140,
  searchBtnColor: null
};

let currentSettings = { ...defaultSettings };

export function initSettings() {
  loadSettings();
  initPanel();
  initAppearance();
  initDataManagement();
  initEditDialog();
  initTheme();
  applySettings();
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('startpage.appearance') || '{}');
    currentSettings = { ...defaultSettings, ...saved };
  } catch {
    currentSettings = { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem('startpage.appearance', JSON.stringify(currentSettings));
}

function initPanel() {
  const fab = $('#settingsFab');
  const panel = $('#settingsPanel');
  
  if (!fab || !panel) return;

  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('show');
    fab.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !fab.contains(e.target)) {
      panel.classList.remove('show');
      fab.classList.remove('active');
    }
  });

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('.settings-panel-item');
    if (!btn) return;

    const action = btn.id;
    panel.classList.remove('show');
    fab.classList.remove('active');

    if (action === 'panelSoundBtn') $('#soundPanel')?.classList.remove('hidden');
    else if (action === 'panelFocusBtn') $('#focusMode')?.classList.remove('hidden');
    else if (action === 'panelBgBtn') openBackgroundDialog();
    else if (action === 'panelBookmarksBtn') {
      $('#bookmarksPanel')?.classList.remove('hidden');
      $('#bookmarksOverlay')?.classList.remove('hidden');
    } else if (action === 'panelAppearanceBtn') $('#appearanceDialog')?.showModal();
  });
}

function initAppearance() {
  const dialog = $('#appearanceDialog');
  if (!dialog) return;

  dialog.addEventListener('input', (e) => {
    const target = e.target;
    const key = target.dataset.setting;
    if (!key) return;

    if (target.type === 'checkbox') {
      currentSettings[key] = target.checked;
    } else if (target.type === 'range') {
      currentSettings[key] = parseInt(target.value);
      const display = target.nextElementSibling; // Assuming value display is next sibling
      if (display?.classList.contains('value-display')) {
        display.textContent = key.includes('Opacity') || key.includes('Size') ? `${target.value}%` : target.value;
      }
    } else if (target.type === 'color') {
      currentSettings[key] = target.value;
    }

    applySettings();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'reset-color') {
      const key = e.target.dataset.setting;
      currentSettings[key] = null;
      const input = dialog.querySelector(`input[data-setting="${key}"]`);
      if (input) input.value = '#ffffff';
      applySettings();
    }
  });

  // 每日一言行为
  $('#saveAppearanceBtn')?.addEventListener('click', () => {
    saveSettings();
    dialog.close();
    showToast('设置已保存');
  });

  $('#cancelAppearanceBtn')?.addEventListener('click', () => {
    loadSettings(); // Revert
    applySettings();
    updateControls();
    dialog.close();
  });

  $('#resetAppearanceBtn')?.addEventListener('click', () => {
    currentSettings = { ...defaultSettings };
    applySettings();
    updateControls();
  });

  // 主题更换
  new MutationObserver((mutations) => {
    if (mutations.some(m => m.attributeName === 'data-theme')) applySettings();
  }).observe(document.documentElement, { attributes: true });

  updateControls();
}

function updateControls() {
  const dialog = $('#appearanceDialog');
  if (!dialog) return;

  Object.keys(currentSettings).forEach(key => {
    const input = dialog.querySelector(`[data-setting="${key}"]`);
    if (!input) return;

    if (input.type === 'checkbox') {
      input.checked = currentSettings[key];
    } else {
      input.value = currentSettings[key] || '#ffffff';
      const display = input.nextElementSibling;
      if (display?.classList.contains('value-display')) {
        display.textContent = key.includes('Opacity') || key.includes('Size') ? `${input.value}%` : input.value;
      }
    }
  });
}

function applySettings() {
  const s = currentSettings;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const baseColor = isDark ? '28, 28, 30' : '255, 255, 255';

  const setGlass = (el, opacity) => {
    if (!el) return;
    if (s.showGlassCard) {
      el.style.background = `linear-gradient(135deg, rgba(${baseColor}, ${opacity/100}) 0%, rgba(255,255,255, 0.05) 100%)`;
      el.style.backdropFilter = '';
      el.style.border = '';
      el.style.boxShadow = '';
    } else {
      el.style.background = 'transparent';
      el.style.backdropFilter = 'none';
      el.style.border = 'none';
      el.style.boxShadow = 'none';
    }
  };

  // 可见
  toggleDisplay('#clock', s.showClock);
  toggleDisplay('#greeting', s.showGreeting);
  toggleDisplay('#quote', s.showQuote);
  toggleDisplay('.search-container', s.showSearch);
  toggleDisplay('#weather', s.showWeather);
  toggleDisplay('#floatingPlayer', s.showMusicPlayer, 'flex');
  toggleDisplay('#linksGrid', s.showBookmarks, 'grid');

  // 时钟
  const clock = $('#clock');
  if (clock) {
    clock.style.fontSize = `${s.clockSize}px`;
    const span = clock.querySelector('span') || clock;
    const color = s.clockColor || 'var(--text)';
    span.style.background = `linear-gradient(180deg, color-mix(in srgb, ${color}, transparent ${100-s.clockTextOpacity}%) 0%, color-mix(in srgb, ${color}, transparent ${100-(s.clockTextOpacity*0.7)}%) 100%)`;
    span.style.webkitBackgroundClip = 'text';
    span.style.webkitTextFillColor = 'transparent';
    setGlass(clock, s.clockBgOpacity);
  }

  const greeting = $('#greeting');
  if (greeting) {
    greeting.style.fontSize = `${s.greetingSize}px`;
    greeting.style.color = `color-mix(in srgb, ${s.greetingColor || 'var(--text)'}, transparent ${100-s.greetingTextOpacity}%)`;
    setGlass(greeting, s.greetingBgOpacity);
  }
  // 引用
  const quote = $('#quote');
  if (quote) {
    setGlass(quote, s.quoteBgOpacity);
    const text = $('#quoteText');
    if (text) {
      text.style.fontSize = `${s.quoteSize}px`;
      text.style.color = `color-mix(in srgb, ${s.quoteColor || 'var(--text)'}, transparent ${100-s.quoteTextOpacity}%)`;
    }
    const author = $('#quoteAuthor');
    if (author) {
      author.style.fontSize = `${Math.max(10, s.quoteSize - 2)}px`;
      author.style.color = `color-mix(in srgb, ${s.quoteColor || 'var(--muted)'}, transparent ${100-s.quoteTextOpacity}%)`;
    }
  }

  const searchForm = $('#searchForm');
  if (searchForm) {
    searchForm.style.transform = `scale(${s.searchSize / 100})`;
    const input = searchForm.querySelector('input');
    if (input) input.style.backgroundColor = `rgba(${baseColor}, ${s.searchBgOpacity / 100})`;
    
    const btn = searchForm.querySelector('.search-btn');
    if (btn) {
      btn.style.display = s.showSearchBtn ? '' : 'none';
      if (s.searchBtnColor) {
        btn.style.background = s.searchBtnColor;
        btn.style.color = '#fff';
      } else {
        btn.style.background = '';
        btn.style.color = '';
      }
    }
  }

  const grid = $('#linksGrid');
  if (grid) {
    grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${s.bookmarkSize}px, 1fr))`;
  }
}

function toggleDisplay(selector, show, displayType = '') {
  const el = $(selector);
  if (el) {
    if (show) el.style.removeProperty('display');
    else el.style.setProperty('display', 'none', 'important');
  }
}

function initDataManagement() {
  $('#exportDataBtn')?.addEventListener('click', exportData);
  $('#importDataBtn')?.addEventListener('click', () => $('#importFile')?.click());
  $('#importFile')?.addEventListener('change', importData);
  $('#resetDataBtn')?.addEventListener('click', resetData);
}

function exportData() {
  const data = {
    bookmarks: getJson('startpage.bookmarks'),
    engine: localStorage.getItem('startpage.engine'),
    background: localStorage.getItem('startpage.background'),
    blur: localStorage.getItem('startpage.blur'),
    brightness: localStorage.getItem('startpage.brightness'),
    greeting: localStorage.getItem('startpage.greeting'),
    weather: localStorage.getItem('startpage.weather'),
    musicId: localStorage.getItem('startpage.musicId'),
    musicApi: localStorage.getItem('startpage.musicApi'),
    musicCookie: localStorage.getItem('startpage.musicCookie'),
    appearance: currentSettings,
    focusTasks: getJson('startpage.focusTasks'),
    focusStats: getJson('startpage.focusStats')
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `startpage-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据导出成功');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      Object.entries(data).forEach(([k, v]) => {
        if (v) localStorage.setItem(`startpage.${k}`, typeof v === 'object' ? JSON.stringify(v) : v);
      });
      showToast('导入成功，即将刷新...');
      setTimeout(() => location.reload(), 1500);
    } catch {
      showToast('文件格式错误');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function resetData() {
  if (confirm('确定要重置所有数据吗？')) {
    localStorage.clear();
    showToast('已重置，即将刷新...');
    setTimeout(() => location.reload(), 1500);
  }
}

function getJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function initEditDialog() {
  const dialog = $('#editDialog');
  if (!dialog) return;

  $('#editLinksBtn')?.addEventListener('click', () => {
    dialog.showModal();
    switchTab('links');
  });

  dialog.querySelector('.close-btn')?.addEventListener('click', () => dialog.close());
  $('#cancelEditBtn')?.addEventListener('click', () => dialog.close());

  dialog.querySelectorAll('.tab-btn').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(tabName) {
  const dialog = $('#editDialog');
  if (!dialog) return;

  dialog.querySelectorAll('.tab-btn').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  dialog.querySelectorAll('.edit-panel').forEach(p => p.classList.remove('active'));

  const panels = {
    links: '#linksPanel',
    bookmarks: '#bookmarksEditPanel',
    engines: '#enginesPanel'
  };

  $(panels[tabName])?.classList.add('active');

  const addBtn = $('#addLinkBtn');
  const saveBtn = $('#saveLinksBtn');
  if (addBtn) addBtn.style.display = tabName === 'links' ? '' : 'none';
  if (saveBtn) saveBtn.style.display = tabName === 'links' ? '' : 'none';

  if (tabName === 'links') renderLinksEditor();
  else if (tabName === 'bookmarks') renderBookmarksEditor();
  else if (tabName === 'engines') renderEnginesEditor();
}

function initTheme() {
  const toggle = $('#themeToggle');
  if (!toggle) return;

  const isDark = localStorage.getItem('startpage.theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  toggle.setAttribute('aria-pressed', isDark);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('startpage.theme', next);
    toggle.setAttribute('aria-pressed', next === 'dark');
  });
}

export async function loadQuote() {
  const text = $('#quoteText');
  const author = $('#quoteAuthor');
  if (!text) return;

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    
    const res = await fetchQuote();
    if (res?.yiyan) {
      text.textContent = `"${res.yiyan}"`;
      if (author) author.textContent = res.nick || '佚名';
      return;
    }
  } catch (e) {
    console.warn('Quote load failed:', e);
  }
  
  const local = [
    { text: '成功的秘密在于每天好好吃饭( $ _ $ )', author: '肉夹馍' }
  ];
  const q = local[Math.floor(Math.random() * local.length)];
  text.textContent = `"${q.text}"`;
  if (author) author.textContent = q.author;
}

export function updateGreeting() {
  const el = $('#greeting');
  if (!el) return;

  const custom = localStorage.getItem('startpage.greeting');
  if (custom) {
    el.textContent = custom;
    return;
  }

  const h = new Date().getHours();
  const map = [
    [6, '夜深了，注意休息，不要熬夜哦！(❁´◡`❁)'],
    [9, '枣尚耗！！又到了新的一天哦！今天要干点什么呢，嘿嘿o(*￣︶￣*)o'],
    [12, '快到中午啦，要好好吃饭哦！\(￣︶￣*\))'],
    [14, '下午好喵，有没有午休呢？ヾ(•ω•`)o'],
    [18, '要天黑啦！早点下班，继续加油喵！(ง •̀_•́)ง'],
    [23, '夜生活来啦，享受生活！٩(˃̶͈̀௰˂̶͈́)و']
  ];
  
  const match = map.find(([t]) => h < t) || [24, '夜深了，注意休息，不要熬夜哦！(❁´◡`❁)'];
  el.textContent = match[1];
}

export function updateClock() {
  const el = $('#clock');
  if (!el) return;

  const showSeconds = currentSettings.showSeconds;
  const now = new Date();
  const time = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    showSeconds ? String(now.getSeconds()).padStart(2, '0') : null
  ].filter(Boolean).join(':');

  const span = el.querySelector('span');
  if (span) span.textContent = time;
  else el.innerHTML = `<span>${time}</span>`;
}
