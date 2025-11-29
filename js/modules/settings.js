import { $, showToast } from './utils.js';
import { loadSearchEngines, renderEnginesEditor } from './search.js';
import { initFocusMode } from './focus.js';
import { renderLinksEditor } from './links.js';
import { renderBookmarksEditor } from './bookmarks.js';
import { openBackgroundDialog } from './background.js';

export function initSettings() {
  const settingsBtn = $('#settingsBtn');
  const settingsPanel = $('#settingsPanel');
  const closeSettingsBtn = $('#closeSettingsBtn');
  
  // New settings panel logic (FAB and Panel)
  const settingsFab = $('#settingsFab');
  
  if (settingsFab && settingsPanel) {
    settingsFab.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.classList.toggle('show');
      settingsFab.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && !settingsFab.contains(e.target)) {
        settingsPanel.classList.remove('show');
        settingsFab.classList.remove('active');
      }
    });
    
    // Panel items
    const panelSoundBtn = $('#panelSoundBtn');
    const panelFocusBtn = $('#panelFocusBtn');
    const panelBgBtn = $('#panelBgBtn');
    const panelBookmarksBtn = $('#panelBookmarksBtn');
    const panelAppearanceBtn = $('#panelAppearanceBtn');
    
    if (panelSoundBtn) {
      panelSoundBtn.addEventListener('click', () => {
        $('#soundPanel').classList.remove('hidden');
        settingsPanel.classList.remove('show');
      });
    }
    
    if (panelFocusBtn) {
      panelFocusBtn.addEventListener('click', () => {
        $('#focusMode').classList.remove('hidden');
        settingsPanel.classList.remove('show');
      });
    }
    
    if (panelBgBtn) {
      panelBgBtn.addEventListener('click', () => {
        openBackgroundDialog();
        settingsPanel.classList.remove('show');
      });
    }
    
    if (panelBookmarksBtn) {
      panelBookmarksBtn.addEventListener('click', () => {
        $('#bookmarksPanel').classList.remove('hidden');
        $('#bookmarksOverlay').classList.remove('hidden');
        settingsPanel.classList.remove('show');
      });
    }
    
    if (panelAppearanceBtn) {
      panelAppearanceBtn.addEventListener('click', () => {
        const appearanceDialog = document.getElementById('appearanceDialog');
        if (appearanceDialog) appearanceDialog.showModal();
        settingsPanel.classList.remove('show');
      });
    }
  }
  
  initAppearanceSettings();
  initDataSettings();
  initEditDialog();
  initThemeToggle();
}

function initEditDialog() {
  const editLinksBtn = $('#editLinksBtn');
  const editDialog = document.getElementById('editDialog');
  const closeBtn = editDialog?.querySelector('.close-btn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  
  if (!editLinksBtn || !editDialog) return;
  
  editLinksBtn.addEventListener('click', () => {
    editDialog.showModal();
    // Default to links tab or remember last? Default is fine.
    switchTab('links');
  });
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => editDialog.close());
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => editDialog.close());
  }
  
  const tabs = editDialog.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  const editDialog = document.getElementById('editDialog');
  if (!editDialog) return;
  
  // Update tabs
  const tabs = editDialog.querySelectorAll('.tab-btn');
  tabs.forEach(t => {
    if (t.dataset.tab === tabName) t.classList.add('active');
    else t.classList.remove('active');
  });
  
  // Update panels
  const panels = editDialog.querySelectorAll('.edit-panel');
  panels.forEach(p => p.classList.remove('active'));
  
  const addBtn = document.getElementById('addLinkBtn');
  const saveBtn = document.getElementById('saveLinksBtn');
  
  if (tabName === 'links') {
    document.getElementById('linksPanel').classList.add('active');
    renderLinksEditor();
    if (addBtn) addBtn.style.display = '';
    if (saveBtn) saveBtn.style.display = '';
  } else if (tabName === 'bookmarks') {
    document.getElementById('bookmarksEditPanel').classList.add('active');
    renderBookmarksEditor();
    if (addBtn) addBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
  } else if (tabName === 'engines') {
    document.getElementById('enginesPanel').classList.add('active');
    renderEnginesEditor();
    if (addBtn) addBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';
  }
}

function initAppearanceSettings() {
  const appearanceDialog = document.getElementById('appearanceDialog');
  const cancelBtn = document.getElementById('cancelAppearanceBtn');
  const saveBtn = document.getElementById('saveAppearanceBtn');
  const resetBtn = document.getElementById('resetAppearanceBtn');
  
  if (!appearanceDialog) return;
  
  const defaults = {
    clockSize: 48,
    clockTextOpacity: 100,
    clockBgOpacity: 80,
    clockColor: null,
    showClock: true,
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
    bookmarkColumns: 6,
    showBookmarks: true,
    bookmarkSize: 140,
    searchBtnColor: null
  };
  
  let saved = JSON.parse(localStorage.getItem('startpage.appearance') || '{}');
  let settings = { ...defaults, ...saved };
  
  const elements = {
    clock: document.getElementById('clock'),
    greeting: document.getElementById('greeting'),
    quote: document.getElementById('quote'),
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    searchInput: document.querySelector('.search input'),
    searchBtn: document.querySelector('.search-btn'),
    searchContainer: document.querySelector('.search-container'),
    linksGrid: document.getElementById('linksGrid')
  };
  
  const sliders = {
    clockSize: document.getElementById('clockSizeSlider'),
    clockTextOpacity: document.getElementById('clockTextOpacitySlider'),
    clockBgOpacity: document.getElementById('clockBgOpacitySlider'),
    greetingSize: document.getElementById('greetingSizeSlider'),
    greetingTextOpacity: document.getElementById('greetingTextOpacitySlider'),
    greetingBgOpacity: document.getElementById('greetingBgOpacitySlider'),
    quoteSize: document.getElementById('quoteSizeSlider'),
    quoteTextOpacity: document.getElementById('quoteTextOpacitySlider'),
    quoteBgOpacity: document.getElementById('quoteBgOpacitySlider'),
    searchSize: document.getElementById('searchSizeSlider'),
    searchBgOpacity: document.getElementById('searchBgOpacitySlider'),
    bookmarkColumns: document.getElementById('bookmarkColumnsSlider'),
    bookmarkSize: document.getElementById('bookmarkSizeSlider')
  };

  const checkboxes = {
    showClock: document.getElementById('showClockCheck'),
    showGreeting: document.getElementById('showGreetingCheck'),
    showQuote: document.getElementById('showQuoteCheck'),
    showSearch: document.getElementById('showSearchCheck'),
    showBookmarks: document.getElementById('showBookmarksCheck')
  };
  
  const values = {
    clockSize: document.getElementById('clockSizeValue'),
    clockTextOpacity: document.getElementById('clockTextOpacityValue'),
    clockBgOpacity: document.getElementById('clockBgOpacityValue'),
    greetingSize: document.getElementById('greetingSizeValue'),
    greetingTextOpacity: document.getElementById('greetingTextOpacityValue'),
    greetingBgOpacity: document.getElementById('greetingBgOpacityValue'),
    quoteSize: document.getElementById('quoteSizeValue'),
    quoteTextOpacity: document.getElementById('quoteTextOpacityValue'),
    quoteBgOpacity: document.getElementById('quoteBgOpacityValue'),
    searchSize: document.getElementById('searchSizeValue'),
    searchBgOpacity: document.getElementById('searchBgOpacityValue'),
    bookmarkColumns: document.getElementById('bookmarkColumnsValue'),
    bookmarkSize: document.getElementById('bookmarkSizeValue')
  };
  
  function applySettings(newSettings) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const baseColor = isDark ? '28, 28, 30' : '255, 255, 255';
    
    if (elements.clock) elements.clock.style.display = newSettings.showClock ? '' : 'none';
    if (elements.greeting) elements.greeting.style.display = newSettings.showGreeting ? '' : 'none';
    if (elements.quote) elements.quote.style.display = newSettings.showQuote ? '' : 'none';
    if (elements.searchContainer) elements.searchContainer.style.display = newSettings.showSearch ? '' : 'none';
    if (elements.linksGrid) {
        if (newSettings.showBookmarks) {
            elements.linksGrid.style.removeProperty('display');
        } else {
            elements.linksGrid.style.setProperty('display', 'none', 'important');
        }
    }

    if (elements.clock) {
      elements.clock.style.fontSize = `${newSettings.clockSize}px`;
      const textColor = newSettings.clockColor || 'var(--text)';
      elements.clock.style.color = `color-mix(in srgb, ${textColor}, transparent ${100 - newSettings.clockTextOpacity}%)`;
      elements.clock.style.background = `linear-gradient(135deg, rgba(${baseColor}, ${newSettings.clockBgOpacity/100}) 0%, rgba(255,255,255, 0.05) 100%)`;
      elements.clock.style.opacity = '';
    }
    
    if (elements.greeting) {
      elements.greeting.style.fontSize = `${newSettings.greetingSize}px`;
      const textColor = newSettings.greetingColor || 'var(--text)';
      elements.greeting.style.color = `color-mix(in srgb, ${textColor}, transparent ${100 - newSettings.greetingTextOpacity}%)`;
      elements.greeting.style.background = `linear-gradient(135deg, rgba(${baseColor}, ${newSettings.greetingBgOpacity/100}) 0%, rgba(255,255,255, 0.05) 100%)`;
      elements.greeting.style.opacity = '';
    }
    
    if (elements.quote) {
      elements.quote.style.background = `linear-gradient(135deg, rgba(${baseColor}, ${newSettings.quoteBgOpacity/100}) 0%, rgba(255,255,255, 0.05) 100%)`;
      elements.quote.style.opacity = '';
      if (elements.quoteText) {
         const textColor = newSettings.quoteColor || 'var(--text)';
         elements.quoteText.style.color = `color-mix(in srgb, ${textColor}, transparent ${100 - newSettings.quoteTextOpacity}%)`;
         elements.quoteText.style.fontSize = `${newSettings.quoteSize}px`;
      }
      if (elements.quoteAuthor) {
         const textColor = newSettings.quoteColor ? newSettings.quoteColor : 'var(--muted)';
         elements.quoteAuthor.style.color = `color-mix(in srgb, ${textColor}, transparent ${100 - newSettings.quoteTextOpacity}%)`;
         elements.quoteAuthor.style.fontSize = `${Math.max(10, newSettings.quoteSize - 2)}px`;
      }
    }
    
    if (elements.searchContainer) {
        const scale = newSettings.searchSize / 100;
        elements.searchContainer.style.transform = `scale(${scale})`;
        elements.searchContainer.style.transformOrigin = 'center top';
        const baseHeight = 50;
        const extraHeight = baseHeight * (scale - 1);
        elements.searchContainer.style.marginBottom = `${extraHeight}px`;
    }
    if (elements.searchInput) {
        elements.searchInput.style.backgroundColor = `rgba(${baseColor}, ${newSettings.searchBgOpacity / 100})`;
    }
    
    if (elements.searchBtn) {
        if (newSettings.searchBtnColor) {
            elements.searchBtn.style.backgroundColor = newSettings.searchBtnColor;
            elements.searchBtn.style.color = '#fff';
        } else {
            elements.searchBtn.style.backgroundColor = '';
            elements.searchBtn.style.color = '';
        }
    }

    if (elements.linksGrid) {
      elements.linksGrid.style.gridTemplateColumns = `repeat(auto-fill, minmax(${newSettings.bookmarkSize}px, 1fr))`;
      elements.linksGrid.style.setProperty('--bookmark-min-width', `${newSettings.bookmarkSize}px`);
    }
  }
  
  const colorInputs = {
    clockColor: document.getElementById('clockColorInput'),
    greetingColor: document.getElementById('greetingColorInput'),
    quoteColor: document.getElementById('quoteColorInput'),
    searchBtnColor: document.getElementById('searchBtnColorInput')
  };

  const resetColorBtns = {
    clockColor: document.getElementById('resetClockColorBtn'),
    greetingColor: document.getElementById('resetGreetingColorBtn'),
    quoteColor: document.getElementById('resetQuoteColorBtn'),
    searchBtnColor: document.getElementById('resetSearchBtnColorBtn')
  };

  function updateControls() {
    Object.keys(sliders).forEach(key => {
      if (sliders[key] && values[key]) {
        const val = settings[key] !== undefined ? settings[key] : defaults[key];
        sliders[key].value = val;
        
        if (key.includes('Opacity') || key.includes('searchSize')) {
          values[key].textContent = `${val}%`;
        } else {
          values[key].textContent = val;
        }
      }
    });
    
    Object.keys(colorInputs).forEach(key => {
      if (colorInputs[key]) {
        const val = settings[key] || '#ffffff';
        colorInputs[key].value = val;
      }
    });

    Object.keys(checkboxes).forEach(key => {
      if (checkboxes[key]) {
        checkboxes[key].checked = settings[key] !== undefined ? settings[key] : defaults[key];
      }
    });
  }
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        applySettings(settings);
      }
    });
  });
  observer.observe(document.documentElement, { attributes: true });
  
  applySettings(settings);
  updateControls();
  
  Object.keys(sliders).forEach(key => {
    if (sliders[key]) {
      sliders[key].addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        settings[key] = value;
        
        if (key.includes('Opacity') || key.includes('searchSize')) {
          values[key].textContent = `${value}%`;
        } else {
          values[key].textContent = value;
        }
        
        applySettings(settings);
      });
    }
  });

  Object.keys(colorInputs).forEach(key => {
    if (colorInputs[key]) {
      colorInputs[key].addEventListener('input', (e) => {
        settings[key] = e.target.value;
        applySettings(settings);
      });
    }
  });

  Object.keys(checkboxes).forEach(key => {
    if (checkboxes[key]) {
      checkboxes[key].addEventListener('change', (e) => {
        settings[key] = e.target.checked;
        applySettings(settings);
      });
    }
  });

  Object.keys(resetColorBtns).forEach(key => {
    if (resetColorBtns[key]) {
      resetColorBtns[key].addEventListener('click', () => {
        settings[key] = null;
        applySettings(settings);
        if (colorInputs[key]) colorInputs[key].value = '#ffffff';
      });
    }
  });
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      saved = JSON.parse(localStorage.getItem('startpage.appearance') || '{}');
      settings = { ...defaults, ...saved };
      applySettings(settings);
      updateControls();
      appearanceDialog.close();
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      localStorage.setItem('startpage.appearance', JSON.stringify(settings));
      appearanceDialog.close();
      showToast('设置已保存');
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      settings = JSON.parse(JSON.stringify(defaults));
      applySettings(settings);
      updateControls();
    });
  }
}

function initDataSettings() {
  const exportBtn = $('#exportDataBtn');
  const importBtn = $('#importDataBtn');
  const importFile = $('#importFile');
  const resetBtn = $('#resetDataBtn');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }
  
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importData);
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetData);
  }
}

function exportData() {
  const data = {
    bookmarks: JSON.parse(localStorage.getItem('startpage.bookmarks') || '[]'),
    engine: localStorage.getItem('startpage.engine'),
    background: localStorage.getItem('startpage.background'),
    blur: localStorage.getItem('startpage.blur'),
    brightness: localStorage.getItem('startpage.brightness'),
    greeting: localStorage.getItem('startpage.greeting'),
    weather: localStorage.getItem('startpage.weather'),
    musicId: localStorage.getItem('startpage.musicId'),
    musicApi: localStorage.getItem('startpage.musicApi'),
    musicCookie: localStorage.getItem('startpage.musicCookie'),
    appearance: JSON.parse(localStorage.getItem('startpage.appearance') || '{}'),
    focusTasks: JSON.parse(localStorage.getItem('startpage.focusTasks') || '[]'),
    focusStats: JSON.parse(localStorage.getItem('startpage.focusStats') || '{}')
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `startpage-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
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
      
      if (data.bookmarks) localStorage.setItem('startpage.bookmarks', JSON.stringify(data.bookmarks));
      if (data.engine) localStorage.setItem('startpage.engine', data.engine);
      if (data.background) localStorage.setItem('startpage.background', data.background);
      if (data.blur) localStorage.setItem('startpage.blur', data.blur);
      if (data.brightness) localStorage.setItem('startpage.brightness', data.brightness);
      if (data.greeting) localStorage.setItem('startpage.greeting', data.greeting);
      if (data.musicId) localStorage.setItem('startpage.musicId', data.musicId);
      if (data.musicApi) localStorage.setItem('startpage.musicApi', data.musicApi);
      if (data.musicCookie) localStorage.setItem('startpage.musicCookie', data.musicCookie);
      if (data.appearance) localStorage.setItem('startpage.appearance', JSON.stringify(data.appearance));
      if (data.focusTasks) localStorage.setItem('startpage.focusTasks', JSON.stringify(data.focusTasks));
      if (data.focusStats) localStorage.setItem('startpage.focusStats', JSON.stringify(data.focusStats));
      
      showToast('数据导入成功，即将刷新...');
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      showToast('数据文件格式错误');
      console.error(error);
    }
  };
  reader.readAsText(file);
  e.target.value = ''; 
}

function resetData() {
  if (confirm('确定要重置所有数据吗？这将清除所有设置和书签。')) {
    localStorage.clear();
    showToast('数据已重置，即将刷新...');
    setTimeout(() => location.reload(), 1500);
  }
}

const localQuotes = [
  { text: '成功的秘密在于始终如一地忠于目标', author: '富兰克林' },
];

export async function loadQuote() {
  const quoteText = $('#quoteText');
  const quoteAuthor = $('#quoteAuthor');
  if (!quoteText) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://api.nxvav.cn/api/yiyan/?encode=json&charset=utf-8', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result && result.yiyan) {
      quoteText.textContent = `"${result.yiyan}"`;
      const authorText = result.nick || '佚名';
      if (quoteAuthor) quoteAuthor.textContent = authorText;
      return;
    } else {
      throw new Error('API返回数据格式异常');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('一言API请求超时，使用本地语录');
    } else {
      console.warn('一言API加载失败，使用本地语录:', error.message);
    }
    
    const randomQuote = localQuotes[Math.floor(Math.random() * localQuotes.length)];
    quoteText.textContent = `"${randomQuote.text}"`;
    if (quoteAuthor) quoteAuthor.textContent = randomQuote.author;
  }
}

export function updateGreeting() {
  const greetingEl = $('#greeting');
  if (!greetingEl) return;
  
  const customGreeting = localStorage.getItem('startpage.greeting');
  if (customGreeting) {
    greetingEl.textContent = customGreeting;
    return;
  }
  
  const hour = new Date().getHours();
  let text = '';
  
  if (hour < 6) text = '夜深了，注意休息';
  else if (hour < 9) text = '早上好，新的一天';
  else if (hour < 12) text = '上午好，工作顺利';
  else if (hour < 14) text = '中午好，记得午休';
  else if (hour < 18) text = '下午好，继续加油';
  else if (hour < 23) text = '晚上好，享受生活';
  else text = '夜深了，早点休息';
  
  greetingEl.textContent = text;
}

export function updateClock() {
  const clockEl = $('#clock');
  
  if (!clockEl) return;
  
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  clockEl.textContent = `${hours}:${minutes}`;
}

export function initThemeToggle() {
  const themeToggle = $('#themeToggle');
  if (!themeToggle) return;
  
  // Load saved theme
  const savedTheme = localStorage.getItem('startpage.theme');
  const isDark = savedTheme === 'dark';
  
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.setAttribute('aria-pressed', 'true');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.setAttribute('aria-pressed', 'false');
  }
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const isDark = newTheme === 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('startpage.theme', newTheme);
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  });
}

function updateThemeIcon(isDark) {
  // Deprecated: SVG animation is handled by CSS via aria-pressed attribute
}
