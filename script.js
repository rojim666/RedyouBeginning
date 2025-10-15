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
    
    // 获取首字母作为默认显示
    function getInitialLetter(title, url) {
      // 优先使用标题
      if (title && title.trim()) {
        const firstChar = title.trim()[0].toUpperCase();
        // 如果是中文或其他非ASCII字符，直接返回
        if (firstChar.charCodeAt(0) > 127) {
          return firstChar;
        }
        // 如果是英文字母，返回大写
        if (/[A-Za-z]/.test(firstChar)) {
          return firstChar;
        }
      }
      
      // 如果标题不可用，从URL中提取域名首字母
      try {
        const hostname = new URL(url).hostname;
        const domainName = hostname.replace(/^www\./, '').split('.')[0];
        if (domainName) {
          return domainName[0].toUpperCase();
        }
      } catch (e) {
        // URL解析失败
      }
      
      // 最后的备选方案
      return '?';
    }
    
    // 默认显示首字母
    const initialLetter = getInitialLetter(l.title, l.url);
    faviconDiv.textContent = initialLetter;
    faviconDiv.setAttribute('data-initial', initialLetter);
    
    // 尝试加载真实的favicon
    const logoSources = getLogoSources(l.url);
    let logoLoaded = false;
    
    // 尝试加载Logo
    if (logoSources.length > 0) {
      let sourceIndex = 0;
      faviconDiv.classList.add('loading');
      
      function tryNextSource() {
        if (sourceIndex >= logoSources.length || logoLoaded) {
          faviconDiv.classList.remove('loading');
          // 如果所有源都失败，确保显示首字母
          if (!logoLoaded) {
            faviconDiv.textContent = initialLetter;
            faviconDiv.classList.add('initial-letter');
          }
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
              faviconDiv.classList.remove('initial-letter');
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
    } else {
      // 没有图标源，直接显示首字母
      faviconDiv.classList.add('initial-letter');
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

// 优化的图片压缩函数 - 使用先进算法保持最佳画质
function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
        const {
            maxWidth = 2560,
            maxHeight = 1440,
            quality = 0.92,
            mimeType = 'image/jpeg',
            targetSize = null
        } = options;

        const img = new Image();
        
        img.onerror = () => reject(new Error('图片加载失败'));
        
        img.onload = function() {
            try {
                // 计算新的尺寸，保持宽高比
                let { width, height } = img;
                let scale = 1;
                
                if (width > maxWidth || height > maxHeight) {
                    const widthScale = maxWidth / width;
                    const heightScale = maxHeight / height;
                    scale = Math.min(widthScale, heightScale);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                
                console.log(`图片尺寸: ${img.width}x${img.height} → ${width}x${height} (缩放: ${(scale * 100).toFixed(1)}%)`);
                
                // 使用先进的缩放算法
                let finalCanvas;
                if (scale < 1) {
                    // 需要缩小图片，使用高质量的分步缩放算法
                    finalCanvas = downscaleImage(img, width, height);
                } else {
                    // 不需要缩放或放大，直接绘制
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { 
                        alpha: false,
                        desynchronized: true 
                    });
                    canvas.width = width;
                    canvas.height = height;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    finalCanvas = canvas;
                }
                
                // 应用锐化滤镜提升清晰度
                sharpenImage(finalCanvas);
                
                // 如果指定了目标大小，使用二分查找最佳质量
                if (targetSize) {
                    findOptimalQuality(finalCanvas, mimeType, targetSize, 0.75, 0.98)
                        .then(resolve)
                        .catch(() => {
                            finalCanvas.toBlob(resolve, mimeType, quality);
                        });
                } else {
                    finalCanvas.toBlob(resolve, mimeType, quality);
                }
                
                // 释放资源
                URL.revokeObjectURL(img.src);
                
            } catch (error) {
                reject(error);
            }
        };
        
        if (file instanceof Blob) {
            img.src = URL.createObjectURL(file);
        } else {
            reject(new Error('不支持的文件类型'));
        }
    });
}

// 高质量降采样算法（Hermite重采样）
function downscaleImage(img, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    
    let currentWidth = img.width;
    let currentHeight = img.height;
    
    // 如果缩小比例大于50%，使用分步缩放
    const scaleRatio = Math.min(targetWidth / currentWidth, targetHeight / currentHeight);
    
    if (scaleRatio < 0.5) {
        console.log('使用分步缩放算法提升清晰度');
        
        // 第一步：缩小到2倍目标尺寸
        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d', { alpha: false });
        
        // 计算中间尺寸
        const steps = [];
        let ratio = scaleRatio;
        while (ratio < 0.5) {
            steps.push(0.5);
            ratio = ratio / 0.5;
        }
        steps.push(ratio);
        
        console.log(`分${steps.length}步缩放:`, steps.map(s => (s * 100).toFixed(1) + '%').join(' → '));
        
        let sourceCanvas = createCanvasFromImage(img);
        
        for (let i = 0; i < steps.length; i++) {
            const stepRatio = steps[i];
            const newWidth = Math.round(currentWidth * stepRatio);
            const newHeight = Math.round(currentHeight * stepRatio);
            
            tempCanvas.width = newWidth;
            tempCanvas.height = newHeight;
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            if (i === 0) {
                tempCtx.drawImage(img, 0, 0, newWidth, newHeight);
            } else {
                tempCtx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);
            }
            
            currentWidth = newWidth;
            currentHeight = newHeight;
            
            // 交换画布
            if (i < steps.length - 1) {
                sourceCanvas = tempCanvas;
                tempCanvas = document.createElement('canvas');
                tempCtx = tempCanvas.getContext('2d', { alpha: false });
            }
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
        
    } else {
        // 缩小比例较小，直接缩放
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    }
    
    return canvas;
}

// 创建画布从图片
function createCanvasFromImage(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return canvas;
}

// 锐化滤镜 - 提升图像清晰度
function sharpenImage(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 创建输出数据
    const outputData = new Uint8ClampedArray(data);
    
    // 锐化卷积核 (适度锐化，避免过度)
    const kernel = [
        0,  -0.15,  0,
        -0.15,  1.6,  -0.15,
        0,  -0.15,  0
    ];
    
    console.log('应用锐化滤镜提升清晰度');
    
    // 应用卷积
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            for (let c = 0; c < 3; c++) { // RGB通道
                let sum = 0;
                
                // 3x3卷积
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        sum += data[pixelIdx] * kernel[kernelIdx];
                    }
                }
                
                outputData[idx + c] = Math.max(0, Math.min(255, sum));
            }
            
            // 保持Alpha通道不变
            outputData[idx + 3] = data[idx + 3];
        }
    }
    
    // 将锐化后的数据写回画布
    const outputImageData = new ImageData(outputData, width, height);
    ctx.putImageData(outputImageData, 0, 0);
}

// 二分查找最佳压缩质量
function findOptimalQuality(canvas, mimeType, targetSize, minQuality = 0.75, maxQuality = 0.98) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 12; // 增加尝试次数以获得最精确的结果
        
        function tryQuality(quality) {
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve({ blob, size: blob.size, quality });
                }, mimeType, quality);
            });
        }
        
        async function binarySearch() {
            let low = minQuality;
            let high = maxQuality;
            let bestBlob = null;
            let bestQuality = minQuality;
            
            // 先尝试最高质量
            const highResult = await tryQuality(maxQuality);
            const highSizeKB = (highResult.size / 1024).toFixed(0);
            const targetSizeKB = (targetSize / 1024).toFixed(0);
            console.log(`最高质量测试: 质量=${maxQuality.toFixed(2)}, 大小=${highSizeKB}KB, 目标=${targetSizeKB}KB`);
            
            if (highResult.size <= targetSize) {
                console.log(`✓ 最高质量(${maxQuality})满足要求，直接使用`);
                resolve(highResult.blob);
                return;
            }
            
            // 二分查找
            while (attempts < maxAttempts && high - low > 0.015) {
                attempts++;
                const mid = (low + high) / 2;
                const result = await tryQuality(mid);
                const sizeKB = (result.size / 1024).toFixed(0);
                
                console.log(`尝试 ${attempts}/${maxAttempts}: 质量=${mid.toFixed(3)}, 大小=${sizeKB}KB`);
                
                if (result.size <= targetSize) {
                    bestBlob = result.blob;
                    bestQuality = mid;
                    low = mid; // 尝试更高质量
                } else {
                    high = mid; // 降低质量
                }
            }
            
            if (bestBlob) {
                const finalSizeKB = (bestBlob.size / 1024).toFixed(0);
                console.log(`✓ 找到最佳质量: ${bestQuality.toFixed(3)}, 最终大小: ${finalSizeKB}KB`);
                resolve(bestBlob);
            } else {
                console.log(`使用最低质量: ${minQuality}`);
                const result = await tryQuality(minQuality);
                resolve(result.blob);
            }
        }
        
        binarySearch().catch(reject);
    });
}

// 智能压缩 - 根据图片特征自动选择最佳压缩策略
function smartCompress(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const fileSizeMB = file.size / 1024 / 1024;
            const targetSizeMB = 2; // 目标2MB
            const targetSizeBytes = targetSizeMB * 1024 * 1024;
            
            console.log(`原始文件大小: ${fileSizeMB.toFixed(2)}MB`);
            
            let compressOptions;
            
            // 如果文件已经小于2MB，只进行轻度优化并锐化以提升画质
            if (file.size < targetSizeBytes) {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    quality: 0.97,     // 极高质量
                    mimeType: 'image/jpeg'
                };
                console.log('文件小于2MB，使用极高画质模式(0.97) + 锐化');
            } 
            // 文件在2-4MB之间
            else if (fileSizeMB < 4) {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    quality: 0.95,
                    targetSize: targetSizeBytes,
                    mimeType: 'image/jpeg'
                };
                console.log('文件2-4MB，使用超高画质(0.95)模式 + 锐化');
            }
            // 文件在4-8MB之间
            else if (fileSizeMB < 8) {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    targetSize: targetSizeBytes,
                    mimeType: 'image/jpeg'
                };
                console.log('文件4-8MB，自动优化画质(最高0.98) + 锐化');
            }
            // 超大文件
            else {
                compressOptions = {
                    maxWidth: 2560,
                    maxHeight: 1440,
                    targetSize: targetSizeBytes,
                    mimeType: 'image/jpeg'
                };
                console.log('超大文件，智能压缩到2MB以内 + 锐化');
            }
            
            console.log('压缩配置:', compressOptions);
            const compressedBlob = await compressImage(file, compressOptions);
            
            if (compressedBlob) {
                const compressedSizeMB = compressedBlob.size / 1024 / 1024;
                const ratio = ((1 - compressedSizeMB / fileSizeMB) * 100).toFixed(1);
                console.log(`✓ 压缩完成: ${fileSizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (压缩${ratio}%)`);
                
                if (compressedBlob.size > targetSizeBytes) {
                    const overMB = ((compressedBlob.size - targetSizeBytes) / 1024 / 1024).toFixed(2);
                    console.warn(`⚠ 压缩后仍超过目标${overMB}MB，可能无法保存到localStorage`);
                }
                
                resolve(compressedBlob);
            } else {
                reject(new Error('压缩失败'));
            }
            
        } catch (error) {
            console.error('智能压缩出错:', error);
            reject(error);
        }
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
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 10) {
        showToast('图片较大，正在智能压缩，请稍候...');
    } else {
        showToast('正在优化图片质量...');
    }
    
    // 所有图片都使用智能压缩以保证在2MB以下且质量最优
    smartCompress(file).then(compressedBlob => {
        if (compressedBlob) {
            const compressedSizeMB = compressedBlob.size / 1024 / 1024;
            console.log('处理完成，最终大小:', compressedSizeMB.toFixed(2) + 'MB');
            
            if (compressedSizeMB > 2) {
                showToast(`图片已优化但仍较大(${compressedSizeMB.toFixed(1)}MB)，可能无法保存`);
            }
            
            processImageFile(compressedBlob);
        } else {
            showToast('图片处理失败');
        }
    }).catch(error => {
        console.error('处理出错:', error);
        showToast('图片处理失败，请尝试其他图片');
    });
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
                console.warn('localStorage配额超出，尝试更高压缩率...');
                
                // 如果还是太大，尝试更激进的压缩
                if (file instanceof Blob) {
                    const originalFile = new File([file], 'compressed.jpg', { type: 'image/jpeg' });
                    compressImage(originalFile, {
                        maxWidth: 1280,
                        maxHeight: 720,
                        targetSize: 800 * 1024, // 目标800KB
                        quality: 0.75
                    }).then(smallerBlob => {
                        if (smallerBlob) {
                            console.log('二次压缩完成:', (smallerBlob.size / 1024).toFixed(0) + 'KB');
                            processImageFile(smallerBlob);
                        } else {
                            showToast('图片过大，仅临时应用');
                            closeBackgroundDialog();
                        }
                    }).catch(() => {
                        showToast('图片压缩失败，仅临时应用');
                        closeBackgroundDialog();
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
