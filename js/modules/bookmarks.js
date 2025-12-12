import { $, showToast, escapeHtml } from './utils.js';
import { renderLinks } from './links.js';

const defaultBookmarks = [
  {
    "title": "深圳技术大学OA系统",
    "url": "https://home.sztu.edu.cn/bmportal/index.portal",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=home.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
  },
  {
    "title": "数据结构课程组",
    "url": "https://acm-sztu-edu-cn-40080-p.webvpn.sztu.edu.cn:8118/course/index",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=acm-sztu-edu-cn-40080-p.webvpn.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
  },
  {
    "title": "深圳技术大学信息中心公文通",
    "url": "https://nbw.sztu.edu.cn/",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=nbw.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
  },
  {
    "title": "教务系统",
    "url": "https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain?entityId=jiaowu",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=auth.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
  },
  {
    "title": "豆包",
    "url": "https://www.doubao.com/chat/",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=www.doubao.com&sz=64",
    "visible": true,
    "showLogo": true,
  }
];

let bookmarks = [];
let bookmarksEnabled = false;

export function initBookmarks() {
  loadBookmarks();
  
  const panel = $('#bookmarksPanel');
  const overlay = $('#bookmarksOverlay');
  
  const togglePanel = (show) => {
    if (show) {
      panel.classList.remove('hidden');
      overlay.classList.remove('hidden');
      requestAnimationFrame(() => {
        panel.classList.add('open');
        overlay.classList.add('open');
      });
      renderBookmarksList();
      playBookmarkEntrance();
    } else {
      panel.classList.remove('open');
      overlay.classList.remove('open');
      setTimeout(() => {
        panel.classList.add('hidden');
        overlay.classList.add('hidden');
      }, 300);
    }
  };
  
  $('#bookmarksBtn')?.addEventListener('click', () => togglePanel(true));
  $('#panelBookmarksBtn')?.addEventListener('click', () => togglePanel(true));
  $('#closeBookmarksBtn')?.addEventListener('click', () => togglePanel(false));
  overlay?.addEventListener('click', () => togglePanel(false));
  
  $('#addBookmarkBtn')?.addEventListener('click', promptAddBookmark);
  $('#importBookmarksBtn')?.addEventListener('click', handleBookmarkImport);
  $('#exportBookmarksBtn')?.addEventListener('click', exportBookmarks);
  
  $('#bookmarksSearch')?.addEventListener('input', (e) => renderBookmarksList(e.target.value));
  
  const toggle = $('#desktopBookmarksToggle');
  if (toggle) {
    toggle.checked = bookmarksEnabled;
    toggle.addEventListener('change', (e) => {
      bookmarksEnabled = e.target.checked;
      localStorage.setItem('startpage.bookmarksEnabled', bookmarksEnabled);
      renderDesktopBookmarks();
    });
  }
  
  renderDesktopBookmarks();
  $('#bookmarksList')?.addEventListener('click', handleBookmarkActions);
}

function loadBookmarks() {
  try {
    const saved = localStorage.getItem('startpage.bookmarks');
    bookmarks = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultBookmarks));
    if (!saved) saveBookmarks();
  } catch {
    bookmarks = [...defaultBookmarks];
  }
  
  bookmarks = bookmarks.map(b => ({ 
    ...b, 
    visible: b.visible !== false,
    showLogo: b.showLogo !== false
  }));
  
  bookmarksEnabled = localStorage.getItem('startpage.bookmarksEnabled') === 'true';
}

function saveBookmarks() {
  localStorage.setItem('startpage.bookmarks', JSON.stringify(bookmarks));
}

function renderBookmarksList(searchTerm = '') {
  const container = $('#bookmarksList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!bookmarks.length) {
    container.innerHTML = `<div class="empty-state">还没有收藏夹<br>点击 + 按钮添加书签</div>`;
    return;
  }
  
  const term = searchTerm.toLowerCase();
  const filtered = bookmarks.filter(b => 
    b.title.toLowerCase().includes(term) || b.url.toLowerCase().includes(term)
  );
  
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state">没有找到匹配的书签</div>`;
    return;
  }
  
  container.innerHTML = filtered.map(b => `
    <div class="bookmark-item ${b.visible === false ? 'hidden-bookmark' : ''}" data-bookmark-id="${b.id}">
      <a href="${b.url}" target="_blank" class="bookmark-link-content">
        <div class="bookmark-icon">
          ${b.favicon ? `<img src="${escapeHtml(b.favicon)}" onerror="this.parentElement.innerText='${(b.title[0]||'?').toUpperCase()}'">` : (b.title[0]||'?').toUpperCase()}
        </div>
        <div class="bookmark-content">
          <div class="bookmark-title">${escapeHtml(b.title)}</div>
          <div class="bookmark-url">${escapeHtml(b.url)}</div>
        </div>
      </a>
      <button class="icon-btn visibility-btn" data-action="toggle-visibility" title="${b.visible ? '隐藏' : '显示'}">
        ${b.visible ? 
          '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' : 
          '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'}
      </button>
      <button class="icon-btn delete-btn" data-action="delete" title="删除">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  `).join('');
}

function playBookmarkEntrance() {
  document.querySelectorAll('#bookmarksList .bookmark-item').forEach(el => el.classList.add('visible'));
}

export function renderDesktopBookmarks() {
  const container = $('#linksGrid');
  if (!container) return;

  if (!bookmarksEnabled) return renderLinks();

  container.innerHTML = '';
  container.classList.add('desktop-bookmarks');

  if (!bookmarks.length) {
    container.innerHTML = `<div class="empty-state">没有桌面书签</div>`;
    return;
  }

  const visible = bookmarks.filter(b => b.visible !== false);
  
  container.innerHTML = visible.map(b => {
    const initial = (b.title || b.url || '?')[0].toUpperCase();
    const hasIcon = b.showLogo !== false && b.favicon;
    
    return `
    <a href="${b.url}" target="_blank" class="link-card desktop-bookmark-card" title="${escapeHtml(b.url)}">
      <div class="desktop-bookmark-content">
        ${b.showLogo !== false ? 
          `<div class="desktop-bookmark-favicon ${!hasIcon ? 'initial' : ''}">
             ${hasIcon ? `<img src="${escapeHtml(b.favicon)}" onerror="this.parentElement.classList.add('initial');this.parentElement.innerText='${initial}'">` : initial}
           </div>` 
          : ''}
        <span>${escapeHtml(b.title || b.url)}</span>
      </div>
      <button class="bookmark-edit-btn" onclick="event.preventDefault(); event.stopPropagation(); window.openBookmarkEditor(${b.id})">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
      </button>
    </a>
  `}).join('');
  
  // Bind edit events manually since inline onclick is limited in modules
  container.querySelectorAll('.bookmark-edit-btn').forEach((btn, i) => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBookmarkEditor(visible[i]);
    };
  });
}

function handleBookmarkActions(e) {
  const btn = e.target.closest('[data-action]');
  const item = e.target.closest('.bookmark-item');
  if (!btn || !item) return;
  
  const id = Number(item.dataset.bookmarkId);
  const bookmark = bookmarks.find(b => b.id === id);
  if (!bookmark) return;
  
  const action = btn.dataset.action;
  
  if (action === 'delete') {
    if (confirm('确定删除?')) {
      bookmarks = bookmarks.filter(b => b.id !== id);
      saveBookmarks();
      renderBookmarksList($('#bookmarksSearch')?.value);
      renderDesktopBookmarks();
    }
  } else if (action === 'toggle-visibility') {
    bookmark.visible = !bookmark.visible;
    saveBookmarks();
    renderBookmarksList($('#bookmarksSearch')?.value);
    renderDesktopBookmarks();
    showToast(bookmark.visible ? '已显示' : '已隐藏');
  }
}

function promptAddBookmark() {
  const title = prompt('标题:');
  if (!title) return;
  
  let url = prompt('地址:');
  if (!url) return;
  
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  
  const bookmark = {
    id: Date.now(),
    title: title.trim(),
    url: url.trim(),
    folder: 'default',
    favicon: null,
    visible: true,
    showLogo: true,
    timestamp: Date.now()
  };
  
  bookmarks.push(bookmark);
  saveBookmarks();
  renderBookmarksList();
  renderDesktopBookmarks();
  showToast('已添加');
  
  loadBookmarkFavicon(bookmark);
}

async function loadBookmarkFavicon(bookmark) {
  try {
    const { hostname } = new URL(bookmark.url);
    const candidates = [
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `https://${hostname}/favicon.ico`
    ];

    for (const src of candidates) {
      try {
        await checkImage(src);
        bookmark.favicon = src;
        saveBookmarks();
        renderDesktopBookmarks();
        renderBookmarksList();
        return;
      } catch {}
    }
  } catch {}
}

function checkImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.width > 0 && img.height > 0) ? resolve() : reject();
    img.onerror = reject;
    img.src = src;
  });
}

function handleBookmarkImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.html,.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = e => parseBookmarkFile(e.target.result, file.type);
    reader.readAsText(file);
  };
  input.click();
}

function parseBookmarkFile(content, type) {
  let items = [];
  
  try {
    if (type.includes('json')) {
      items = JSON.parse(content).map(i => ({
        title: i.title || i.name || 'Untitled',
        url: i.url || i.href
      }));
    } else {
      const doc = new DOMParser().parseFromString(content, 'text/html');
      doc.querySelectorAll('a[href^="http"]').forEach(a => {
        items.push({ title: a.textContent.trim(), url: a.href });
      });
    }
    
    const newItems = items.filter(i => i.url && !bookmarks.some(b => b.url === i.url))
      .map(i => ({
        id: Date.now() + Math.random(),
        title: i.title,
        url: i.url,
        folder: 'imported',
        visible: true,
        showLogo: true,
        timestamp: Date.now()
      }));
      
    if (newItems.length) {
      bookmarks.push(...newItems);
      saveBookmarks();
      renderBookmarksList();
      renderDesktopBookmarks();
      showToast(`导入 ${newItems.length} 个书签`);
      newItems.forEach(loadBookmarkFavicon);
    } else {
      showToast('没有新书签');
    }
  } catch {
    showToast('格式错误');
  }
}

function exportBookmarks() {
  const blob = new Blob([JSON.stringify(bookmarks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookmarks-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function renderBookmarksEditor() {
  const container = $('#bookmarksEditor');
  if (!container) return;
  
  if (!bookmarks.length) {
    container.innerHTML = `<div class="empty-state">无书签</div>`;
    return;
  }
  
  container.innerHTML = `
    <div class="editor-header"><div>显示</div><div>书签</div><div></div></div>
    ${bookmarks.map(b => `
      <div class="bookmark-row">
        <div class="center"><input type="checkbox" ${b.visible ? 'checked' : ''} data-id="${b.id}"></div>
        <div class="info">
          <div class="title">${escapeHtml(b.title)}</div>
          <div class="url">${escapeHtml(b.url)}</div>
        </div>
        <div class="center"><button class="icon-btn edit-btn" data-id="${b.id}">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button></div>
      </div>
    `).join('')}
  `;
  
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.onchange = e => {
      const b = bookmarks.find(x => x.id == e.target.dataset.id);
      if (b) {
        b.visible = e.target.checked;
        saveBookmarks();
        renderDesktopBookmarks();
      }
    };
  });
  
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      $('#editDialog')?.close();
      openBookmarkEditor(bookmarks.find(b => b.id == btn.dataset.id));
    };
  });
}

function openBookmarkEditor(bookmark) {
  if (!bookmark) return;
  
  const dialog = document.createElement('dialog');
  dialog.className = 'bookmark-editor-dialog';
  dialog.innerHTML = `
    <div class="editor-content">
      <h3>编辑书签</h3>
      <div class="form-group"><label>标题</label><input id="e-title" value="${escapeHtml(bookmark.title)}"></div>
      <div class="form-group"><label>链接</label><input id="e-url" value="${escapeHtml(bookmark.url)}"></div>
      <div class="form-group row"><input type="checkbox" id="e-logo" ${bookmark.showLogo ? 'checked' : ''}><label>显示Logo</label></div>
      <div class="form-actions">
        <button id="e-cancel" class="btn">取消</button>
        <button id="e-save" class="btn primary">保存</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  dialog.showModal();
  
  const close = () => { dialog.close(); dialog.remove(); };
  
  dialog.querySelector('#e-cancel').onclick = close;
  dialog.querySelector('#e-save').onclick = () => {
    bookmark.title = dialog.querySelector('#e-title').value.trim() || bookmark.url;
    bookmark.url = dialog.querySelector('#e-url').value.trim();
    bookmark.showLogo = dialog.querySelector('#e-logo').checked;
    saveBookmarks();
    renderDesktopBookmarks();
    renderBookmarksList();
    renderBookmarksEditor();
    close();
  };
}
