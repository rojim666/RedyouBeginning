import { $, showToast, escapeHtml } from './utils.js';

const defaultEngines = [
  { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { name: 'Google', url: 'https://www.google.com/search?q=' },
  { name: '百度', url: 'https://www.baidu.com/s?wd=' },
];

let searchEngines = [];
let searchHistory = [];
let preventHideSuggestions = false;

export function initSearch() {
  loadSearchEngines();
  loadSearchHistory();
  
  const searchForm = $('#searchForm');
  const searchInput = $('#searchInput');
  const engineSelect = $('#engineSelect');
  
  if (searchForm) searchForm.addEventListener('submit', onSearch);
  
  if (searchInput) {
    searchInput.addEventListener('input', showSearchSuggestions);
    searchInput.addEventListener('focus', showSearchSuggestions);
    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (!preventHideSuggestions) hideSearchSuggestions();
      }, 200);
    });
  }
  
  if (engineSelect) {
    engineSelect.addEventListener('change', () => {
      localStorage.setItem('startpage.engine', engineSelect.value);
      searchInput.focus();
    });
    
    const lastEngine = localStorage.getItem('startpage.engine');
    if (lastEngine && searchEngines.some(e => e.url === lastEngine)) {
      engineSelect.value = lastEngine;
    }
  }
}

export function loadSearchEngines() {
  try {
    const saved = localStorage.getItem('startpage.searchEngines');
    searchEngines = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultEngines));
    if (!saved) saveSearchEngines();
    syncEngineSelect();
  } catch (e) {
    console.error('Failed to load search engines:', e);
    searchEngines = [...defaultEngines];
  }
}

function loadSearchHistory() {
  try {
    searchHistory = JSON.parse(localStorage.getItem('startpage.searchHistory') || '[]');
  } catch {
    searchHistory = [];
  }
}

function saveSearchEngines() {
  localStorage.setItem('startpage.searchEngines', JSON.stringify(searchEngines));
}

export function syncEngineSelect() {
  const select = $('#engineSelect');
  if (!select) return;
  
  const current = select.value;
  select.innerHTML = searchEngines.map(e => 
    `<option value="${e.url}">${escapeHtml(e.name)}</option>`
  ).join('');
  
  if (select.querySelector(`option[value="${current}"]`)) {
    select.value = current;
  } else if (searchEngines.length) {
    select.value = searchEngines[0].url;
  }
}

function onSearch(e) {
  e.preventDefault();
  const input = $('#searchInput');
  const select = $('#engineSelect');
  
  const q = input.value.trim();
  const engine = select.value;
  
  if (!q) return;
  
  saveSearchHistory(q, engine);
  
  if (isUrl(q)) {
    window.location.href = q.startsWith('http') ? q : `https://${q}`;
  } else {
    window.open(engine + encodeURIComponent(q), '_blank');
  }
  
  input.value = '';
  hideSearchSuggestions();
}

function isUrl(s) {
  return /^https?:\/\//.test(s) || /^([a-z0-9-]+\.)+[a-z]{2,}/i.test(s);
}

function saveSearchHistory(query, engine) {
  if (!query) return;
  
  const record = { query, engine, timestamp: Date.now() };
  
  searchHistory = [
    record,
    ...searchHistory.filter(item => item.query !== query || item.engine !== engine)
  ].slice(0, 6);
  
  localStorage.setItem('startpage.searchHistory', JSON.stringify(searchHistory));
}

function clearSearchHistory() {
  searchHistory = [];
  localStorage.removeItem('startpage.searchHistory');
  hideSearchSuggestions();
  showToast('搜索记录已清空');
}

function showSearchSuggestions() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const items = query 
    ? searchHistory.filter(i => i.query.toLowerCase().includes(query)).slice(0, 6)
    : searchHistory.slice(0, 6);
    
  renderSearchSuggestions(items);
}

function renderSearchSuggestions(items) {
  const container = $('#searchSuggestions');
  if (!container) return;
  
  if (!items.length) {
    container.classList.add('hidden');
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="search-suggestion-item">
      <span class="search-suggestion-text">${escapeHtml(item.query)}</span>
      <select class="search-suggestion-engine-select">
        ${searchEngines.map(e => 
          `<option value="${e.url}" ${e.url === item.engine ? 'selected' : ''}>${escapeHtml(e.name)}</option>`
        ).join('')}
      </select>
      <span class="search-suggestion-time">${formatTime(item.timestamp)}</span>
    </div>
  `).join('') + (searchHistory.length ? '<button class="clear-history-btn">清空搜索记录</button>' : '');
  
  // Event delegation
  container.querySelectorAll('.search-suggestion-item').forEach((el, idx) => {
    const item = items[idx];
    
    el.querySelector('.search-suggestion-text').addEventListener('click', () => {
      $('#searchInput').value = item.query;
      $('#engineSelect').value = el.querySelector('select').value;
      hideSearchSuggestions();
      $('#searchForm')?.dispatchEvent(new Event('submit'));
    });
    
    const select = el.querySelector('select');
    select.addEventListener('pointerdown', e => {
      e.stopPropagation();
      preventHideSuggestions = true;
    });
    select.addEventListener('change', e => {
      e.stopPropagation();
      item.engine = e.target.value;
      saveSearchHistory(item.query, item.engine); // Update history
      setTimeout(() => preventHideSuggestions = false, 300);
    });
  });
  
  container.querySelector('.clear-history-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSearchHistory();
  });
  
  container.classList.remove('hidden');
}

function hideSearchSuggestions() {
  $('#searchSuggestions')?.classList.add('hidden');
}

function formatTime(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return new Date(ts).toLocaleDateString();
}

// Editor
export function renderEnginesEditor() {
  const container = $('#enginesEditor');
  if (!container) return;
  
  if (!searchEngines.length) {
    container.innerHTML = `<div class="empty-state">还没有搜索引擎</div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="editor-header">
      <div>名称</div><div>搜索URL</div><div></div>
    </div>
    ${searchEngines.map((e, i) => `
      <div class="engine-row">
        <div class="name">${escapeHtml(e.name)}</div>
        <div class="url">${escapeHtml(e.url)}</div>
        <div class="actions">
          <button class="icon-btn edit-btn" data-idx="${i}">✎</button>
          <button class="icon-btn delete-btn" data-idx="${i}">×</button>
        </div>
      </div>
    `).join('')}
    <button class="btn primary add-engine-btn">+ 添加搜索引擎</button>
  `;
  
  container.querySelectorAll('.edit-btn').forEach(btn => 
    btn.addEventListener('click', () => openEngineEditor(searchEngines[btn.dataset.idx], btn.dataset.idx))
  );
  
  container.querySelectorAll('.delete-btn').forEach(btn => 
    btn.addEventListener('click', () => {
      if (confirm('确定删除?')) {
        searchEngines.splice(btn.dataset.idx, 1);
        saveSearchEngines();
        syncEngineSelect();
        renderEnginesEditor();
      }
    })
  );
  
  container.querySelector('.add-engine-btn').addEventListener('click', () => openEngineEditor(null));
}

function openEngineEditor(engine, idx) {
  const isEdit = !!engine;
  const dialog = document.createElement('dialog');
  dialog.className = 'engine-editor-dialog';
  
  dialog.innerHTML = `
    <div class="editor-content">
      <h3>${isEdit ? '编辑' : '添加'}搜索引擎</h3>
      <div class="form-group">
        <label>名称</label>
        <input id="engineName" value="${escapeHtml(engine?.name || '')}" placeholder="例如：Google">
      </div>
      <div class="form-group">
        <label>URL ({q} 代表搜索词)</label>
        <input id="engineUrl" value="${escapeHtml(engine?.url || '')}" placeholder="https://google.com/search?q=">
      </div>
      <div class="form-actions">
        <button class="btn" id="cancelBtn">取消</button>
        <button class="btn primary" id="saveBtn">保存</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  dialog.showModal();
  
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  
  dialog.querySelector('#cancelBtn').addEventListener('click', close);
  dialog.querySelector('#saveBtn').addEventListener('click', () => {
    const name = dialog.querySelector('#engineName').value.trim();
    const url = dialog.querySelector('#engineUrl').value.trim();
    
    if (!name || !url) return showToast('请填写完整信息');
    
    if (isEdit) {
      searchEngines[idx] = { name, url };
    } else {
      searchEngines.push({ name, url });
    }
    
    saveSearchEngines();
    syncEngineSelect();
    renderEnginesEditor();
    close();
  });
}
