
import { $, showToast, escapeHtml } from './utils.js';

const defaultEngines = [
  { name: 'Google', url: 'https://www.google.com/search?q=' },
  { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' }
];

let searchEngines = [];
let searchHistory = JSON.parse(localStorage.getItem('startpage.searchHistory') || '[]');
let preventHideSuggestions = false;

export function loadSearchEngines() {
  try {
    const saved = localStorage.getItem('startpage.searchEngines');
    if (saved) {
      searchEngines = JSON.parse(saved);
    } else {
      searchEngines = JSON.parse(JSON.stringify(defaultEngines));
      saveSearchEngines();
    }
    syncEngineSelect();
  } catch (e) {
    console.error('加载搜索引擎失败:', e);
    searchEngines = JSON.parse(JSON.stringify(defaultEngines));
  }
}

function saveSearchEngines() {
  try {
    localStorage.setItem('startpage.searchEngines', JSON.stringify(searchEngines));
  } catch (e) {
    console.error('保存搜索引擎失败:', e);
  }
}

export function syncEngineSelect() {
  const select = document.getElementById('engineSelect');
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '';
  
  searchEngines.forEach(engine => {
    const option = document.createElement('option');
    option.value = engine.url;
    option.textContent = engine.name;
    select.appendChild(option);
  });
  
  if (select.querySelector(`option[value="${currentValue}"]`)) {
    select.value = currentValue;
  } else if (searchEngines.length > 0) {
    select.value = searchEngines[0].url;
  }
}

export function initSearch() {
  loadSearchEngines();
  
  const searchForm = $('#searchForm');
  const searchInput = $('#searchInput');
  const engineSelect = $('#engineSelect');
  const searchSuggestions = $('#searchSuggestions');
  
  if (searchForm) {
    searchForm.addEventListener('submit', onSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', showSearchSuggestions);
    searchInput.addEventListener('focus', showSearchSuggestions);
    
    // Blur handling with delay to allow clicking on suggestions
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (!preventHideSuggestions) {
          hideSearchSuggestions();
        }
      }, 200);
    });
  }
  
  if (engineSelect) {
    engineSelect.addEventListener('change', () => {
      localStorage.setItem('startpage.engine', engineSelect.value);
      searchInput.focus();
    });
    
    // Restore last used engine
    const lastEngine = localStorage.getItem('startpage.engine');
    if (lastEngine && searchEngines.some(e => e.url === lastEngine)) {
      engineSelect.value = lastEngine;
    }
  }
}

function onSearch(e) {
  e.preventDefault();
  const searchInput = $('#searchInput');
  const engineSelect = $('#engineSelect');
  
  const q = searchInput.value.trim();
  const engine = engineSelect.value;
  
  if (!q) return;
  
  saveSearchHistory(q, engine);
  
  if (isProbablyUrl(q)) {
    const url = q.startsWith('http') ? q : 'https://' + q;
    window.location.href = url;
  } else {
    window.open(engine + encodeURIComponent(q), '_blank');
  }
  
  searchInput.value = '';
  hideSearchSuggestions();
}

function isProbablyUrl(s) {
  return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/.test(s) || s.startsWith('http');
}

function saveSearchHistory(query, engine) {
  if (query === undefined && engine === undefined) {
    localStorage.setItem('startpage.searchHistory', JSON.stringify(searchHistory));
    return;
  }
  
  if (isProbablyUrl(query) || !query.trim()) return;
  
  const record = {
    query: query.trim(),
    engine: engine,
    timestamp: Date.now()
  };
  
  searchHistory = searchHistory.filter(item => 
    !(item.query === record.query && item.engine === record.engine)
  );
  
  searchHistory.unshift(record);
  
  if (searchHistory.length > 6) {
    searchHistory = searchHistory.slice(0, 6);
  }
  
  localStorage.setItem('startpage.searchHistory', JSON.stringify(searchHistory));
}

function clearSearchHistory() {
  searchHistory = [];
  localStorage.removeItem('startpage.searchHistory');
  hideSearchSuggestions();
  showToast('搜索记录已清空');
}

function showSearchSuggestions() {
  const input = $('#searchInput');
  const query = input.value.trim().toLowerCase();
  
  if (query.length === 0) {
    renderSearchSuggestions(searchHistory.slice(0, 6));
  } else {
    const filtered = searchHistory
      .filter(item => item.query.toLowerCase().includes(query))
      .slice(0, 6);
    renderSearchSuggestions(filtered);
  }
}

function renderSearchSuggestions(items) {
  const suggestions = $('#searchSuggestions');
  if (!suggestions) return;
  
  suggestions.innerHTML = '';
  
  if (items.length === 0 && searchHistory.length === 0) {
    suggestions.classList.add('hidden');
    return;
  }
  
  const fragment = document.createDocumentFragment();
  
  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'search-suggestion-item';
    
    let engineOptions = '';
    searchEngines.forEach(engine => {
      const selected = engine.url === item.engine ? 'selected' : '';
      engineOptions += `<option value="${engine.url}" ${selected}>${engine.name}</option>`;
    });
    
    div.innerHTML = `
      <span class="search-suggestion-text" style="cursor:pointer;flex:1;">${escapeHtml(item.query)}</span>
      <select class="search-suggestion-engine-select" style="padding:4px 8px;border:1px solid var(--control-border);border-radius:4px;background:var(--control-bg);color:var(--text);font-size:12px;cursor:pointer;">
        ${engineOptions}
      </select>
      <span class="search-suggestion-time">${formatTime(item.timestamp)}</span>
    `;
    
    const textSpan = div.querySelector('.search-suggestion-text');
    textSpan.addEventListener('click', () => {
      const engineSelect = div.querySelector('.search-suggestion-engine-select');
      $('#searchInput').value = item.query;
      $('#engineSelect').value = engineSelect.value;
      hideSearchSuggestions();
      // Trigger search manually
      const form = $('#searchForm');
      if (form) form.dispatchEvent(new Event('submit'));
    });
    
    const engineSel = div.querySelector('.search-suggestion-engine-select');
    engineSel.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      preventHideSuggestions = true;
    });
    engineSel.addEventListener('change', (e) => {
      e.stopPropagation();
      item.engine = e.target.value;
      saveSearchHistory();
      setTimeout(() => { preventHideSuggestions = false; }, 300);
    });
    
    fragment.appendChild(div);
  });
  
  if (searchHistory.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-history-btn';
    clearBtn.textContent = '清空搜索记录';
    clearBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission if inside form
        clearSearchHistory();
    });
    fragment.appendChild(clearBtn);
  }
  
  suggestions.appendChild(fragment);
  suggestions.classList.remove('hidden');
}

function hideSearchSuggestions() {
  const suggestions = $('#searchSuggestions');
  if (suggestions) suggestions.classList.add('hidden');
}

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString();
}

// Editor functions
export function renderEnginesEditor() {
  const container = document.getElementById('enginesEditor');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (searchEngines.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;">还没有搜索引擎</div>`;
    return;
  }
  
  const header = document.createElement('div');
  header.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 80px;gap:12px;align-items:center;padding:8px;margin-bottom:12px;border-bottom:1px solid var(--control-border);font-weight:600;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;';
  header.innerHTML = `
    <div>名称</div>
    <div>搜索URL</div>
    <div></div>
  `;
  container.appendChild(header);
  
  searchEngines.forEach((engine, idx) => {
    const row = document.createElement('div');
    row.className = 'engine-row';
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 80px;gap:12px;align-items:center;padding:12px;border-radius:8px;border:1px solid var(--control-border);margin-bottom:8px;transition:all 0.2s;background:var(--control-bg);';
    
    row.addEventListener('mouseenter', () => {
      row.style.background = 'var(--control-bg-hover)';
      row.style.borderColor = 'rgba(0, 122, 255, 0.3)';
    });
    
    row.addEventListener('mouseleave', () => {
      row.style.background = 'var(--control-bg)';
      row.style.borderColor = 'var(--control-border)';
    });
    
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'font-size:14px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    nameDiv.textContent = engine.name;
    
    const urlDiv = document.createElement('div');
    urlDiv.style.cssText = 'font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    urlDiv.textContent = engine.url;
    
    const btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.type = 'button';
    editBtn.title = '编辑';
    editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    editBtn.style.cssText = 'padding:6px;';
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openEngineEditor(engine, idx);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.type = 'button';
    deleteBtn.title = '删除';
    deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 6H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11v6m6-6v6M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    deleteBtn.style.cssText = 'padding:6px;';
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm(`确定要删除 "${engine.name}" 吗？`)) {
        searchEngines.splice(idx, 1);
        saveSearchEngines();
        syncEngineSelect();
        renderEnginesEditor();
      }
    });
    
    btnDiv.appendChild(editBtn);
    btnDiv.appendChild(deleteBtn);
    
    row.appendChild(nameDiv);
    row.appendChild(urlDiv);
    row.appendChild(btnDiv);
    container.appendChild(row);
  });
  
  const addBtn = document.createElement('button');
  addBtn.className = 'btn primary';
  addBtn.textContent = '+ 添加搜索引擎';
  addBtn.style.cssText = 'margin-top:12px;width:100%;';
  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openEngineEditor(null, -1);
  });
  container.appendChild(addBtn);
}

function openEngineEditor(engine, idx) {
  const name = engine ? engine.name : '';
  const url = engine ? engine.url : '';
  const isEdit = engine !== null;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--panel-bg);border:1px solid var(--control-border);border-radius:12px;padding:24px;z-index:3000;box-shadow:0 8px 32px rgba(0,0,0,0.2);min-width:400px;';
  
  dialog.innerHTML = `
    <div style="font-size:18px;font-weight:600;margin-bottom:16px;color:var(--text);">${isEdit ? '编辑搜索引擎' : '添加搜索引擎'}</div>
    <div style="margin-bottom:16px;">
      <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;">名称</label>
      <input type="text" id="engineName" placeholder="例如：Google" value="${escapeHtml(name)}" style="width:100%;padding:10px 12px;border:1px solid var(--control-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:14px;box-sizing:border-box;">
    </div>
    <div style="margin-bottom:20px;">
      <label style="display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;">搜索URL (用 {0} 或 {q} 表示搜索词)</label>
      <input type="text" id="engineUrl" placeholder="例如：https://www.google.com/search?q=" value="${escapeHtml(url)}" style="width:100%;padding:10px 12px;border:1px solid var(--control-border);border-radius:6px;background:var(--input-bg);color:var(--text);font-size:14px;box-sizing:border-box;">
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end;">
      <button id="cancelEngineBtn" class="btn" style="flex:1;">取消</button>
      <button id="saveEngineBtn" class="btn primary" style="flex:1;">${isEdit ? '保存' : '添加'}</button>
    </div>
  `;
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:2999;';
  
  document.body.appendChild(overlay);
  document.body.appendChild(dialog);
  
  const nameInput = document.getElementById('engineName');
  const urlInput = document.getElementById('engineUrl');
  
  nameInput.focus();
  
  const close = () => {
    overlay.remove();
    dialog.remove();
  };
  
  document.getElementById('cancelEngineBtn').addEventListener('click', close);
  
  document.getElementById('saveEngineBtn').addEventListener('click', () => {
    const newName = nameInput.value.trim();
    const newUrl = urlInput.value.trim();
    
    if (!newName) {
      alert('请输入搜索引擎名称');
      return;
    }
    if (!newUrl) {
      alert('请输入搜索URL');
      return;
    }
    
    if (isEdit) {
      searchEngines[idx].name = newName;
      searchEngines[idx].url = newUrl;
    } else {
      searchEngines.push({ name: newName, url: newUrl });
    }
    
    saveSearchEngines();
    syncEngineSelect();
    renderEnginesEditor();
    close();
  });
  
  overlay.addEventListener('click', close);
}
