// 基础功能：时钟、问候、搜索、快速链接管理、主题切换、localStorage 持久化
const defaultLinks = [
  {title: 'GitHub', url: 'https://github.com'},
  {title: 'Gmail', url: 'https://mail.google.com'},
  {title: '知乎', url: 'https://www.zhihu.com'},
  {title: '掘金', url: 'https://juejin.cn'}
];

// state
let links = [];

// 收藏夹管理
let bookmarks = JSON.parse(localStorage.getItem('startpage.bookmarks') || '[]');

// helpers
function $(s){return document.querySelector(s)}
function saveState(){localStorage.setItem('startpage.links', JSON.stringify(links));}
function loadState(){
  const raw = localStorage.getItem('startpage.links');
  if(raw){
    try{ links = JSON.parse(raw); }catch(e){ links = defaultLinks; }
  }else links = defaultLinks;
}

// 实用工具函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// clock & greeting
function updateClock(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  $('#clock').textContent = `${hh}:${mm}`;
  const h = now.getHours();
  let g = '你好';
  if(h < 6) g = '夜深了，早点休息';
  else if(h < 12) g = '早上好';
  else if(h < 18) g = '下午好';
  else g = '晚上好';
  $('#greeting').textContent = g;
}

// render links
// 获取网站favicon的函数  
function getFaviconUrl(url) {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return null;
  }
}

// 获取高质量Logo的备选方案
function getLogoSources(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.origin;
    const hostname = urlObj.hostname;
    
    return [
      `${domain}/favicon.ico`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      `https://favicon.yandex.net/favicon/${hostname}`,
      `${domain}/apple-touch-icon.png`,
      `${domain}/favicon.png`
    ];
  } catch {
    return [];
  }
}

function renderLinks(){
  const container = $('#linksGrid');
  container.innerHTML = '';
  links.forEach((l,idx)=>{
    const a = document.createElement('a');
    a.className = 'link-card';
    a.href = l.url;
    a.target = '_blank';
    
    // 创建favicon元素
    const faviconDiv = document.createElement('div');
    faviconDiv.className = 'favicon';
    
    // 尝试加载真实的favicon
    const logoSources = getLogoSources(l.url);
    let logoLoaded = false;
    
    // 默认显示首字母
    faviconDiv.textContent = (l.title || l.url)[0] || '?';
    
    // 尝试加载Logo
    if (logoSources.length > 0) {
      let sourceIndex = 0;
      faviconDiv.classList.add('loading');
      
      function tryNextSource() {
        if (sourceIndex >= logoSources.length || logoLoaded) {
          faviconDiv.classList.remove('loading');
          return;
        }
        
        const img = new Image();
        img.onload = function() {
          if (!logoLoaded && img.width > 0 && img.height > 0) {
            logoLoaded = true;
            faviconDiv.classList.remove('loading');
            
            // 平滑过渡效果
            faviconDiv.style.opacity = '0';
            setTimeout(() => {
              faviconDiv.innerHTML = '';
              faviconDiv.appendChild(img);
              faviconDiv.classList.add('has-logo');
              faviconDiv.style.opacity = '1';
            }, 150);
          }
        };
        img.onerror = function() {
          sourceIndex++;
          setTimeout(tryNextSource, 200); // 短暂延迟后尝试下一个源
        };
        
        // 设置合理的超时时间
        img.src = logoSources[sourceIndex];
        setTimeout(() => {
          if (!logoLoaded && sourceIndex < logoSources.length - 1) {
            img.src = ''; // 取消当前加载
            sourceIndex++;
            tryNextSource();
          }
        }, 3000); // 3秒超时
      }
      
      tryNextSource();
    }
    
    // 创建元数据部分
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<div class="title">${l.title}</div><div class="url">${l.url}</div>`;
    
    a.appendChild(faviconDiv);
    a.appendChild(meta);
    container.appendChild(a);
  })
}

// editor dialog
function openEditor(){
  const dialog = $('#editDialog');
  const editor = $('#linksEditor');
  editor.innerHTML = '';
  links.forEach((l,idx)=>{
    const row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML = `<input class="title" placeholder="标题" value="${escapeHtml(l.title)}"><input class="url" placeholder="https://..." value="${escapeHtml(l.url)}"><button class="remove">删除</button>`;
    row.querySelector('.remove').addEventListener('click',()=>{ links.splice(idx,1); openEditor(); });
    editor.appendChild(row);
  });
  dialog.showModal();
}

function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }

function saveEditor(){
  const editor = $('#linksEditor');
  const rows = Array.from(editor.querySelectorAll('.link-row'));
  const newLinks = rows.map(r=>({title: r.querySelector('.title').value.trim(), url: r.querySelector('.url').value.trim()})).filter(x=>x.url);
  links = newLinks.length? newLinks : defaultLinks;
  saveState();
  renderLinks();
  $('#editDialog').close();
}

// add link row
function addLinkRow(){
  const editor = $('#linksEditor');
  const row = document.createElement('div');
  row.className = 'link-row';
  row.innerHTML = `<input class="title" placeholder="标题"><input class="url" placeholder="https://..."><button class="remove">删除</button>`;
  row.querySelector('.remove').addEventListener('click',()=>{ row.remove(); });
  editor.appendChild(row);
}

// 收藏夹管理（代码已移动到文件顶部）

function openBookmarksPanel() {
  console.log('正在打开收藏夹面板...');
  const panel = document.getElementById('bookmarksPanel');
  const overlay = document.getElementById('bookmarksOverlay');

  if (panel) {
    panel.classList.add('open');
    panel.classList.remove('hidden');
    console.log('面板显示成功');
  } else {
    console.error('找不到收藏夹面板元素');
  }

  if (overlay) {
    overlay.classList.add('open');
    overlay.classList.remove('hidden');
    console.log('遮罩显示成功');
  } else {
    console.error('找不到遮罩元素');
  }
  
  // 暂时注释掉可能有问题的渲染函数
  try {
    renderBookmarks();
    // after render, play staggered entrance animation
    requestAnimationFrame(() => playBookmarkEntrance());
  } catch (error) {
    console.error('渲染书签时出错:', error);
  }
}

function closeBookmarksPanel() {
  const panel = document.getElementById('bookmarksPanel');
  const overlay = document.getElementById('bookmarksOverlay');

  if (panel) {
    panel.classList.remove('open');
    // wait for animation then hide
    setTimeout(() => panel.classList.add('hidden'), 380);
  }
  if (overlay) {
    overlay.classList.remove('open');
    setTimeout(() => overlay.classList.add('hidden'), 320);
  }
  // clear visible state so entrance animation can replay next time
  const items = document.querySelectorAll('#bookmarksList .bookmark-item');
  items.forEach(it => it.classList.remove('visible'));
}

// Staggered entrance for bookmark items
function playBookmarkEntrance() {
  const items = Array.from(document.querySelectorAll('#bookmarksList .bookmark-item'));
  if (!items.length) return;
  items.forEach((it, i) => {
    it.classList.remove('visible');
    setTimeout(() => it.classList.add('visible'), i * 60);
  });
}

function saveBookmarks() {
  localStorage.setItem('startpage.bookmarks', JSON.stringify(bookmarks));
}

function addBookmark(title, url, folder = 'default') {
  const bookmark = {
    id: Date.now(),
    title: title.trim(),
    url: url.trim(),
    folder,
    favicon: null,
    timestamp: Date.now()
  };
  
  bookmarks.push(bookmark);
  saveBookmarks();
  renderBookmarks();
  showToast('书签已添加');
}

function removeBookmark(id) {
  bookmarks = bookmarks.filter(b => b.id !== id);
  saveBookmarks();
  renderBookmarks();
}

function renderBookmarks(searchTerm = '') {
  const container = document.getElementById('bookmarksList');
  container.innerHTML = '';
  
  if (bookmarks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
        <p>还没有收藏夹</p>
        <p>点击 + 按钮添加书签，或导入书签文件</p>
      </div>
    `;
    return;
  }
  
  // 筛选书签
  const filtered = bookmarks.filter(bookmark => 
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--muted);">
        <p>没有找到匹配的书签</p>
      </div>
    `;
    return;
  }
  
  // 渲染书签
  filtered.forEach(bookmark => {
    const item = document.createElement('a');
    item.className = 'bookmark-item';
    item.href = bookmark.url;
    item.target = '_blank';
    
    // 创建图标
    const icon = document.createElement('div');
    icon.className = 'bookmark-icon';
    
    if (bookmark.favicon) {
      const img = document.createElement('img');
      img.src = bookmark.favicon;
      img.onerror = () => {
        icon.innerHTML = bookmark.title.charAt(0).toUpperCase();
      };
      icon.appendChild(img);
    } else {
      icon.textContent = bookmark.title.charAt(0).toUpperCase();
      // 尝试加载favicon
      loadBookmarkFavicon(bookmark, icon);
    }
    
    // 创建内容
    const content = document.createElement('div');
    content.className = 'bookmark-content';
    content.innerHTML = `
      <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
      <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
    `;
    
    // 创建删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn';
    deleteBtn.style.opacity = '0';
    deleteBtn.title = '删除书签';
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm('确定要删除这个书签吗？')) {
        removeBookmark(bookmark.id);
      }
    });
    
    // 悬停显示删除按钮
    item.addEventListener('mouseenter', () => {
      deleteBtn.style.opacity = '1';
    });
    item.addEventListener('mouseleave', () => {
      deleteBtn.style.opacity = '0';
    });
    
    item.appendChild(icon);
    item.appendChild(content);
    item.appendChild(deleteBtn);
    container.appendChild(item);
  });
}

function loadBookmarkFavicon(bookmark, iconElement) {
  try {
    const domain = new URL(bookmark.url).origin;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32`;
    
    const img = new Image();
    img.onload = function() {
      if (img.width > 0 && img.height > 0) {
        iconElement.innerHTML = '';
        iconElement.appendChild(img);
        // 保存favicon URL
        bookmark.favicon = faviconUrl;
        saveBookmarks();
      }
    };
    img.src = faviconUrl;
  } catch (e) {
    // URL无效，保持默认显示
  }
}

function handleBookmarkImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,.json';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          parseBookmarkFile(e.target.result, file.type);
        } catch (error) {
          showToast('书签文件格式不正确');
          console.error('书签导入失败:', error);
        }
      };
      reader.readAsText(file);
    }
  });
  input.click();
}

function parseBookmarkFile(content, fileType) {
  let importedBookmarks = [];
  
  if (fileType.includes('json')) {
    // JSON格式
    const data = JSON.parse(content);
    importedBookmarks = data.map(item => ({
      id: Date.now() + Math.random(),
      title: item.title || item.name || 'Untitled',
      url: item.url || item.href,
      folder: 'imported',
      favicon: null,
      timestamp: Date.now()
    }));
  } else {
    // HTML格式 (Edge/Chrome书签导出格式)
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    
    links.forEach(link => {
      if (link.href && link.href.startsWith('http')) {
        importedBookmarks.push({
          id: Date.now() + Math.random(),
          title: link.textContent.trim() || 'Untitled',
          url: link.href,
          folder: 'imported',
          favicon: null,
          timestamp: Date.now()
        });
      }
    });
  }
  
  if (importedBookmarks.length > 0) {
    // Filter out items without valid URL and dedupe against existing bookmarks
    const existingUrls = new Set(bookmarks.map(b => b.url));
    const validImported = importedBookmarks.filter(b => b.url && typeof b.url === 'string' && b.url.startsWith('http') && !existingUrls.has(b.url));
    if (validImported.length > 0) {
      bookmarks = [...bookmarks, ...validImported];
      saveBookmarks();
      renderBookmarks();
      // play entrance animation for newly rendered items
      requestAnimationFrame(() => playBookmarkEntrance());
      showToast(`成功导入 ${validImported.length} 个书签`);
    } else {
      showToast('没有找到有效或新的书签可导入');
    }
  } else {
    showToast('没有找到有效的书签');
  }
}

function exportBookmarks() {
  const data = JSON.stringify(bookmarks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `startpage-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('书签已导出');
}

function promptAddBookmark() {
  const title = prompt('书签标题:');
  if (!title) return;
  
  const url = prompt('书签地址:');
  if (!url) return;
  
  // 简单的URL验证
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('请输入有效的URL (以http://或https://开头)');
    return;
  }
  
  addBookmark(title, url);
}

// search
// 搜索记录管理
let searchHistory = JSON.parse(localStorage.getItem('startpage.searchHistory') || '[]');

function saveSearchHistory(query, engine) {
  // 避免保存URL和重复项
  if (isProbablyUrl(query) || !query.trim()) return;
  
  const record = {
    query: query.trim(),
    engine: engine,
    timestamp: Date.now()
  };
  
  // 移除已存在的相同搜索
  searchHistory = searchHistory.filter(item => 
    !(item.query === record.query && item.engine === record.engine)
  );
  
  // 添加到开头
  searchHistory.unshift(record);
  
  // 限制记录数量（最多20条）
  if (searchHistory.length > 20) {
    searchHistory = searchHistory.slice(0, 20);
  }
  
  localStorage.setItem('startpage.searchHistory', JSON.stringify(searchHistory));
  console.log('搜索记录已保存:', record);
}

function clearSearchHistory() {
  searchHistory = [];
  localStorage.removeItem('startpage.searchHistory');
  hideSearchSuggestions();
  showToast('搜索记录已清空');
}

function showSearchSuggestions() {
  const input = $('#searchInput');
  const suggestions = $('#searchSuggestions');
  const query = input.value.trim().toLowerCase();
  
  if (query.length === 0) {
    // 显示最近的搜索记录
    renderSearchSuggestions(searchHistory.slice(0, 8));
  } else {
    // 筛选匹配的搜索记录
    const filtered = searchHistory.filter(item => 
      item.query.toLowerCase().includes(query)
    ).slice(0, 8);
    renderSearchSuggestions(filtered);
  }
}

function renderSearchSuggestions(items) {
  const suggestions = $('#searchSuggestions');
  suggestions.innerHTML = '';
  
  if (items.length === 0 && searchHistory.length === 0) {
    suggestions.classList.add('hidden');
    return;
  }
  
  items.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'search-suggestion-item';
    div.innerHTML = `
      <span class="search-suggestion-text">${escapeHtml(item.query)}</span>
      <span class="search-suggestion-engine">${getEngineName(item.engine)}</span>
      <span class="search-suggestion-time">${formatTime(item.timestamp)}</span>
    `;
    
    div.addEventListener('click', () => {
      $('#searchInput').value = item.query;
      $('#engineSelect').value = item.engine;
      hideSearchSuggestions();
      onSearch(new Event('submit'));
    });
    
    suggestions.appendChild(div);
  });
  
  // 添加清空记录按钮
  if (searchHistory.length > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-history-btn';
    clearBtn.textContent = '清空搜索记录';
    clearBtn.addEventListener('click', clearSearchHistory);
    suggestions.appendChild(clearBtn);
  }
  
  suggestions.classList.remove('hidden');
}

function hideSearchSuggestions() {
  const suggestions = $('#searchSuggestions');
  suggestions.classList.add('hidden');
}

function getEngineName(engineUrl) {
  if (engineUrl.includes('google.com')) return 'Google';
  if (engineUrl.includes('bing.com')) return 'Bing';
  if (engineUrl.includes('baidu.com')) return '百度';
  if (engineUrl.includes('duckduckgo.com')) return 'DuckDuckGo';
  return '搜索';
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

function onSearch(e){
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  const engine = $('#engineSelect').value;
  if(!q) return;
  
  // 保存搜索记录
  saveSearchHistory(q, engine);
  
  if(isProbablyUrl(q)){
    const url = q.startsWith('http')? q : 'https://' + q;
    window.location.href = url;
  }else{
    window.open(engine + encodeURIComponent(q), '_blank');
  }
  
  // 清空搜索框并隐藏建议
  $('#searchInput').value = '';
  hideSearchSuggestions();
}

function isProbablyUrl(s){
  return /\.|\//.test(s);
}

// theme
function loadTheme(){
  const t = localStorage.getItem('startpage.theme') || 'light';
  if(t === 'dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  const btn = $('#themeToggle');
  if(btn) btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark':'light';
  const next = cur === 'dark' ? 'light' : 'dark';
  if(next === 'dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('startpage.theme', next);
  // if sync enabled, mirror to body using data-dark-mode attribute
  const sync = localStorage.getItem('startpage.syncBody') === 'true';
  if(sync){
    if(next === 'dark') document.body.setAttribute('data-dark-mode','true');
    else document.body.removeAttribute('data-dark-mode');
  }
  loadTheme();
}

function loadSync(){
  const s = localStorage.getItem('startpage.syncBody') === 'true';
  const el = $('#syncBody');
  if(el) el.checked = s;
}

function bindSync(){
  const el = $('#syncBody');
  if(!el) return;
  el.addEventListener('change', ()=>{
    localStorage.setItem('startpage.syncBody', el.checked ? 'true' : 'false');
    // apply immediately
    if(el.checked){
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      if(dark) document.body.setAttribute('data-dark-mode','true');
      else document.body.removeAttribute('data-dark-mode');
    }else{
      document.body.removeAttribute('data-dark-mode');
    }
  });
}

// 背景设置
let currentBg = localStorage.getItem('startpage.bg') || '';
let currentBgType = localStorage.getItem('startpage.bgType') || 'color';

function loadSavedBackground() {
    currentBg = localStorage.getItem('startpage.bg') || '';
    currentBgType = localStorage.getItem('startpage.bgType') || 'color';
    if (currentBg) {
        applyBackground();
        console.log('已加载保存的背景:', currentBgType, currentBg);
    }
}

// 预设背景数据
const presetBackgrounds = [
    { id: 'gradient1', name: '彩虹渐变', type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'gradient2', name: '日落', type: 'gradient', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'gradient3', name: '海洋', type: 'gradient', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'gradient4', name: '森林', type: 'gradient', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'solid1', name: '深蓝', type: 'color', value: '#1e3a8a' },
    { id: 'solid2', name: '深紫', type: 'color', value: '#581c87' },
    { id: 'solid3', name: '深绿', type: 'color', value: '#064e3b' },
    { id: 'solid4', name: '深红', type: 'color', value: '#7f1d1d' }
];

// 新增预设背景颜色数据
const presetColors = [
  { type: 'solid', color: '#FF5733' },
  { type: 'solid', color: '#33FF57' },
  { type: 'solid', color: '#3357FF' },
  { type: 'gradient', color: 'linear-gradient(135deg, #FF5733, #FFC300)' },
  { type: 'gradient', color: 'linear-gradient(135deg, #33FF57, #33FFF5)' },
  { type: 'gradient', color: 'linear-gradient(135deg, #3357FF, #8E44AD)' },
];

function openBackgroundDialog() {
    console.log('打开背景对话框');
    const dialog = document.getElementById('bgDialog');
    console.log('对话框元素:', dialog);
    if (dialog) {
        initializeBackgroundDialog();
        dialog.showModal();
        console.log('对话框已显示');
    } else {
        console.error('找不到背景对话框 #bgDialog');
    }
}

function closeBackgroundDialog() {
    document.getElementById('bgDialog').close();
}

function initializeBackgroundDialog() {
    // 初始化标签页
    switchTab('presets');
    
    // 生成预设背景
    generatePresetBackgrounds();
    
    // 重置自定义上传区域
    resetCustomUpload();
    
    // 绑定标签页点击事件
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// 渲染预设背景颜色
function renderPresetColors() {
  const presetsGrid = document.getElementById('presetsGrid');
  presetsGrid.innerHTML = '';

  presetColors.forEach((preset) => {
    const div = document.createElement('div');
    div.className = `preset-item color ${preset.type}`;
    div.style.background = preset.color;
    div.setAttribute('tabindex', '0');
    div.addEventListener('click', () => {
      applyBackground(preset.color);
    });
    presetsGrid.appendChild(div);
  });
}

function switchTab(tabName) {
    // 切换标签页状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // 激活对应的标签按钮和面板
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.querySelector(`[data-panel="${tabName}"]`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
}

function generatePresetBackgrounds() {
    const grid = document.getElementById('presetsGrid');
    if (!grid) {
        console.error('找不到预设背景网格 #presetsGrid');
        return;
    }
    
    grid.innerHTML = '';
    
    presetBackgrounds.forEach(bg => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.onclick = () => selectPresetBackground(bg);
        
        const preview = document.createElement('div');
        preview.className = 'preset-preview';
        if (bg.type === 'gradient') {
            preview.style.background = bg.value;
        } else {
            preview.style.backgroundColor = bg.value;
        }
        
        const name = document.createElement('div');
        name.className = 'preset-name';
        name.textContent = bg.name;
        
        item.appendChild(preview);
        item.appendChild(name);
        grid.appendChild(item);
    });
}

function selectPresetBackground(bg) {
    // 移除其他选中状态
    document.querySelectorAll('.preset-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 添加选中状态
    event.currentTarget.classList.add('selected');
    
    // 应用背景
    currentBg = bg.value;
    currentBgType = bg.type;
    applyBackground();
    
    // 保存到本地存储
    localStorage.setItem('startpage.bg', currentBg);
    localStorage.setItem('startpage.bgType', currentBgType);
    
    showToast(`已应用${bg.name}背景`);
    closeBackgroundDialog();
}

function resetCustomUpload() {
    const fileInput = document.getElementById('bgFileInput');
    const urlInput = document.getElementById('bgUrlInput');
    
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

function resetBackground() {
    currentBg = '';
    currentBgType = 'color';
    applyBackground();
    localStorage.removeItem('startpage.bg');
    localStorage.removeItem('startpage.bgType');
    showToast('背景已重置');
    closeBackgroundDialog();
}

function applyBackground(color) {
  document.body.style.background = color;
}

function applyBackground() {
    const root = document.documentElement;
    console.log('应用背景:', currentBgType, currentBg ? currentBg.substring(0, 50) + '...' : 'null');
    
    if (currentBgType === 'image' && currentBg) {
        console.log('设置图片背景');
        root.style.setProperty('--bg-image', `url(${currentBg})`);
        root.style.setProperty('--bg', 'none');
        root.style.setProperty('--bg-size', 'cover');
        root.style.setProperty('--bg-pos', 'center center');
        
        // 验证CSS变量是否设置成功
        const computedBgImage = getComputedStyle(root).getPropertyValue('--bg-image');
        console.log('CSS变量 --bg-image 已设置:', computedBgImage ? '是' : '否');
    } else if (currentBgType === 'gradient' && currentBg) {
        console.log('设置渐变背景');
        root.style.setProperty('--bg', currentBg);
        root.style.setProperty('--bg-image', 'none');
    } else if (currentBgType === 'color' && currentBg) {
        console.log('设置纯色背景');
        root.style.setProperty('--bg', currentBg);
        root.style.setProperty('--bg-image', 'none');
    } else {
        console.log('重置背景');
        // 重置为默认值
        root.style.removeProperty('--bg-image');
        root.style.removeProperty('--bg');
        root.style.removeProperty('--bg-size');
        root.style.removeProperty('--bg-pos');
    }
    
    // 检查body的最终计算样式
    const bodyStyles = getComputedStyle(document.body);
    console.log('Body背景图片:', bodyStyles.backgroundImage);
    console.log('Body背景色:', bodyStyles.backgroundColor);
}

// 图片压缩函数
function compressImage(file, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // 计算新的尺寸，保持宽高比
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制压缩后的图片
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为blob
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

function handleFileUpload(file) {
    console.log('处理文件上传:', file);
    
    if (!file || !file.type.startsWith('image/')) {
        console.error('文件类型不支持:', file ? file.type : 'null');
        showToast('请选择图片文件');
        return;
    }
    
    console.log('原始文件:', file.type, '大小:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // 显示处理中的提示
    showToast('正在处理图片，请稍候...');
    
    // 如果文件很大，先压缩
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        console.log('文件过大，开始压缩...');
        compressImage(file).then(compressedBlob => {
            if (compressedBlob) {
                console.log('压缩完成，新大小:', (compressedBlob.size / 1024 / 1024).toFixed(2) + 'MB');
                processImageFile(compressedBlob);
            } else {
                showToast('图片压缩失败');
            }
        });
    } else {
        processImageFile(file);
    }
}

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('文件读取完成，base64大小:', (e.target.result.length / 1024 / 1024).toFixed(2) + 'MB');
        
        try {
            // 先临时应用背景（不保存到localStorage）
            currentBg = e.target.result;
            currentBgType = 'image';
            applyBackground();
            
            // 尝试保存到localStorage
            localStorage.setItem('startpage.bg', currentBg);
            localStorage.setItem('startpage.bgType', currentBgType);
            
            closeBackgroundDialog();
            showToast('自定义背景已应用并保存');
            console.log('背景已成功保存到localStorage');
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('localStorage配额超出，尝试进一步压缩...');
                
                // 如果还是太大，尝试更高的压缩率
                if (file instanceof Blob) {
                    const originalFile = new File([file], 'compressed.jpg', { type: 'image/jpeg' });
                    compressImage(originalFile, 1280, 0.6).then(smallerBlob => {
                        if (smallerBlob) {
                            processImageFile(smallerBlob);
                        } else {
                            showToast('图片过大，仅临时应用');
                            closeBackgroundDialog();
                        }
                    });
                } else {
                    showToast('图片已应用，但无法永久保存（文件过大）');
                    closeBackgroundDialog();
                }
            } else {
                console.error('保存背景失败:', error);
                showToast('保存背景失败: ' + error.message);
            }
        }
    };
    
    reader.onerror = function(e) {
        console.error('文件读取失败:', e);
        showToast('文件读取失败');
    };
    
    reader.readAsDataURL(file);
}

function handleUrlBackground() {
    const urlInput = document.getElementById('bgUrlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('请输入图片URL');
        return;
    }
    
    // 简单验证URL格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showToast('请输入有效的HTTP或HTTPS链接');
        return;
    }
    
    try {
        // 应用URL背景
        currentBg = url;
        currentBgType = 'image';
        applyBackground();
        
        // 尝试保存到localStorage
        localStorage.setItem('startpage.bg', currentBg);
        localStorage.setItem('startpage.bgType', currentBgType);
        
        closeBackgroundDialog();
        showToast('URL背景已应用');
        console.log('URL背景已保存:', url);
        
    } catch (error) {
        console.error('保存URL背景失败:', error);
        showToast('应用背景失败: ' + error.message);
    }
}

// 拖拽功能
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    uploadArea.addEventListener('click', () => {
        console.log('点击上传区域');
        document.getElementById('bgFileInput').click();
    });
    
    function handleDrop(e) {
        console.log('拖拽放下事件');
        const dt = e.dataTransfer;
        const files = dt.files;
        console.log('拖拽的文件数量:', files.length);
        
        if (files.length > 0) {
            console.log('处理第一个文件:', files[0].name, files[0].type);
            handleFileUpload(files[0]);
        }
    }
}

function bindBackgroundEvents() {
    const bgBtn = $('#bgBtn');
    console.log('绑定背景事件，按钮元素:', bgBtn);
    if (bgBtn) {
        bgBtn.addEventListener('click', openBackgroundDialog);
        console.log('背景按钮事件已绑定');
    } else {
        console.error('找不到背景按钮 #bgBtn');
    }
    
    // 绑定对话框内的事件
    const fileInput = document.getElementById('bgFileInput');
    if (fileInput) {
        console.log('绑定文件输入框事件');
        fileInput.addEventListener('change', (e) => {
            console.log('文件输入框change事件', e.target.files.length);
            const file = e.target.files[0];
            if (file) {
                console.log('选择的文件:', file.name, file.type, file.size);
                handleFileUpload(file);
            }
        });
    } else {
        console.error('找不到文件输入框 #bgFileInput');
    }
    
    const resetBtn = document.getElementById('resetBgBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetBackground);
    }
    
    const cancelBtn = document.getElementById('cancelBgBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeBackgroundDialog);
    }
    
    const applyUrlBtn = document.getElementById('applyUrlBtn');
    if (applyUrlBtn) {
        applyUrlBtn.addEventListener('click', handleUrlBackground);
    }
    
    // 为URL输入框添加回车键事件
    const urlInput = document.getElementById('bgUrlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUrlBackground();
            }
        });
    }
    
    setupDragAndDrop();
}

// init
function init(){
  loadState();
  renderLinks();
  updateClock();
  setInterval(updateClock, 1000*30);

  // events
  $('#searchForm').addEventListener('submit', onSearch);
  $('#editLinksBtn').addEventListener('click', openEditor);
  $('#addLinkBtn').addEventListener('click', addLinkRow);
  $('#saveLinksBtn').addEventListener('click', saveEditor);
  $('#cancelEditBtn').addEventListener('click', ()=>$('#editDialog').close());
  // theme toggle: call toggleTheme and update aria-pressed (loadTheme will sync it)
  $('#themeToggle').addEventListener('click', (e)=>{ toggleTheme(); });
  
  // 搜索建议事件
  const searchInput = $('#searchInput');
  searchInput.addEventListener('focus', showSearchSuggestions);
  searchInput.addEventListener('input', showSearchSuggestions);
  searchInput.addEventListener('blur', () => {
    // 延迟隐藏，允许点击建议项
    setTimeout(hideSearchSuggestions, 200);
  });
  
  // 键盘导航支持
  let selectedSuggestionIndex = -1;
  searchInput.addEventListener('keydown', (e) => {
    const suggestions = document.querySelectorAll('.search-suggestion-item');
    if (suggestions.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
      updateSuggestionSelection(suggestions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
      updateSuggestionSelection(suggestions);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      suggestions[selectedSuggestionIndex].click();
    } else if (e.key === 'Escape') {
      hideSearchSuggestions();
      selectedSuggestionIndex = -1;
    }
  });
  
  function updateSuggestionSelection(suggestions) {
    suggestions.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedSuggestionIndex);
    });
  }
  
  // 点击页面其他地方隐藏建议
  document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer.contains(e.target)) {
      hideSearchSuggestions();
      selectedSuggestionIndex = -1;
    }
  });

  // background
  loadSavedBackground();
  bindBackgroundEvents();
  // bookmarks bindings (defensive: check elements exist before binding)
  const bookmarksBtn = document.getElementById('bookmarksBtn');
  const bookmarksOverlay = document.getElementById('bookmarksOverlay');
  const bookmarksCloseBtn = document.getElementById('closeBookmarksBtn');
  const bookmarkSearchInput = document.getElementById('bookmarksSearch');
  const addBookmarkBtn = document.getElementById('addBookmarkBtn');
  const importBookmarksBtn = document.getElementById('importBookmarksBtn');
  const exportBookmarksBtn = document.getElementById('exportBookmarksBtn');

  if (bookmarksBtn) bookmarksBtn.addEventListener('click', openBookmarksPanel);
  if (bookmarksOverlay) bookmarksOverlay.addEventListener('click', closeBookmarksPanel);
  if (bookmarksCloseBtn) bookmarksCloseBtn.addEventListener('click', closeBookmarksPanel);
  if (bookmarkSearchInput) bookmarkSearchInput.addEventListener('input', (e) => { renderBookmarks(e.target.value); });
  if (addBookmarkBtn) addBookmarkBtn.addEventListener('click', promptAddBookmark);
  if (importBookmarksBtn) importBookmarksBtn.addEventListener('click', handleBookmarkImport);
  if (exportBookmarksBtn) exportBookmarksBtn.addEventListener('click', exportBookmarks);

  loadTheme();
  loadSync();
  bindSync();
}

window.addEventListener('DOMContentLoaded', init);

// Toast helper
function showToast(text, duration = 2500){
  const t = $('#toast');
  if(!t) return;
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(()=>{ t.classList.remove('show'); }, duration);
}

// Note: The app uses a single init() (registered via window.addEventListener('DOMContentLoaded', init))
// and defensive bindings inside init(). Removed the older duplicate bottom DOMContentLoaded handler
// which referenced outdated functions (e.g. bindWallpaperEvents, bindSearchEvents, loadCurrentWallpaper)
// because those caused runtime errors and could interrupt normal initialization.
