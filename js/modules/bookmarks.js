
import { $, showToast, escapeHtml } from './utils.js';
import { renderLinks } from './links.js';

const defaultBookmarks = [
  {
    "id": 1764336893197.6904,
    "title": "深圳技术大学OA系统",
    "url": "https://home.sztu.edu.cn/bmportal/index.portal",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=home.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
    "timestamp": 1764336893197
  },
  {
    "id": 1764336893197.658,
    "title": "数据结构课程组",
    "url": "https://acm-sztu-edu-cn-40080-p.webvpn.sztu.edu.cn:8118/course/index",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=acm-sztu-edu-cn-40080-p.webvpn.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
    "timestamp": 1764336893197
  },
  {
    "id": 1764336893197.5527,
    "title": "深圳技术大学信息中心公文通",
    "url": "https://nbw.sztu.edu.cn/",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=nbw.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
    "timestamp": 1764336893197
  },
  {
    "id": 1764336893197.1243,
    "title": "教务系统",
    "url": "https://auth.sztu.edu.cn/idp/authcenter/ActionAuthChain?entityId=jiaowu",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=auth.sztu.edu.cn&sz=64",
    "visible": true,
    "showLogo": false,
    "timestamp": 1764336893197
  },
  {
    "id": 1764336893197.946,
    "title": "豆包",
    "url": "https://www.doubao.com/chat/",
    "folder": "imported",
    "favicon": "https://www.google.com/s2/favicons?domain=www.doubao.com&sz=64",
    "visible": true,
    "showLogo": true,
    "timestamp": 1764336893197
  }
];

let bookmarks = [];
let bookmarksEnabled = false;

export function initBookmarks() {
  loadBookmarks();
  
  const bookmarksBtn = $('#bookmarksBtn'); // Top bar button
  const panelBookmarksBtn = $('#panelBookmarksBtn'); // Settings panel button
  const closeBookmarksBtn = $('#closeBookmarksBtn');
  const bookmarksPanel = $('#bookmarksPanel');
  const bookmarksOverlay = $('#bookmarksOverlay');
  const addBookmarkBtn = $('#addBookmarkBtn');
  const importBookmarksBtn = $('#importBookmarksBtn');
  const exportBookmarksBtn = $('#exportBookmarksBtn');
  const bookmarksSearch = $('#bookmarksSearch');
  const desktopBookmarksToggle = $('#desktopBookmarksToggle');
  
  // Panel toggling
  const openPanel = () => {
    bookmarksPanel.classList.remove('hidden');
    bookmarksOverlay.classList.remove('hidden');
    setTimeout(() => {
        bookmarksPanel.classList.add('open');
        bookmarksOverlay.classList.add('open');
    }, 10);
    renderBookmarksList();
    playBookmarkEntrance();
  };
  
  const closePanel = () => {
    bookmarksPanel.classList.remove('open');
    bookmarksOverlay.classList.remove('open');
    setTimeout(() => {
        bookmarksPanel.classList.add('hidden');
        bookmarksOverlay.classList.add('hidden');
    }, 300);
  };
  
  if (bookmarksBtn) bookmarksBtn.addEventListener('click', openPanel);
  if (panelBookmarksBtn) panelBookmarksBtn.addEventListener('click', openPanel); // This might be redundant if settings.js handles it, but safe
  if (closeBookmarksBtn) closeBookmarksBtn.addEventListener('click', closePanel);
  if (bookmarksOverlay) bookmarksOverlay.addEventListener('click', closePanel);
  
  // Actions
  if (addBookmarkBtn) addBookmarkBtn.addEventListener('click', promptAddBookmark);
  if (importBookmarksBtn) importBookmarksBtn.addEventListener('click', handleBookmarkImport);
  if (exportBookmarksBtn) exportBookmarksBtn.addEventListener('click', exportBookmarks);
  
  if (bookmarksSearch) {
    bookmarksSearch.addEventListener('input', (e) => {
      renderBookmarksList(e.target.value);
    });
  }
  
  if (desktopBookmarksToggle) {
    desktopBookmarksToggle.checked = bookmarksEnabled;
    desktopBookmarksToggle.addEventListener('change', (e) => {
      bookmarksEnabled = e.target.checked;
      localStorage.setItem('startpage.bookmarksEnabled', bookmarksEnabled);
      renderDesktopBookmarks();
    });
  }
  
  // Initial render
  renderDesktopBookmarks();
  
  // Event delegation for bookmark list actions
  const bookmarksList = $('#bookmarksList');
  if (bookmarksList) {
    bookmarksList.addEventListener('click', handleBookmarkActions);
  }
}

function loadBookmarks() {
  const saved = localStorage.getItem('startpage.bookmarks');
  if (saved) {
    bookmarks = JSON.parse(saved);
  } else {
    bookmarks = JSON.parse(JSON.stringify(defaultBookmarks));
    saveBookmarks();
  }
  
  // Migration: ensure fields exist
  bookmarks = bookmarks.map(b => ({ 
    ...b, 
    visible: b.visible !== false ? true : false,
    showLogo: b.showLogo !== false ? true : false
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
  
  if (bookmarks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
        <p>还没有收藏夹</p>
        <p>点击 + 按钮添加书签，或导入书签文件</p>
      </div>
    `;
    return;
  }
  
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
  
  const fragment = document.createDocumentFragment();
  
  filtered.forEach(bookmark => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.bookmarkId = bookmark.id;
    
    if (bookmark.visible === false) {
      item.style.opacity = '0.5';
    }
    
    let iconHTML = '';
    if (bookmark.favicon) {
      iconHTML = `<div class="bookmark-icon"><img src="${escapeHtml(bookmark.favicon)}" onerror="this.parentElement.innerHTML='${bookmark.title.charAt(0).toUpperCase()}'"></div>`;
    } else {
      iconHTML = `<div class="bookmark-icon">${bookmark.title.charAt(0).toUpperCase()}</div>`;
    }
    
    item.innerHTML = `
      <a href="${bookmark.url}" target="_blank" class="bookmark-link-content" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;text-decoration:none;color:inherit;">
        ${iconHTML}
        <div class="bookmark-content">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
        </div>
      </a>
      <button class="icon-btn visibility-btn" type="button" style="opacity:0;" title="${bookmark.visible !== false ? '隐藏书签' : '显示书签'}" data-action="toggle-visibility">
        ${bookmark.visible !== false ? `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5C7 5 2.73 8.11 1 12.46c1.73 4.35 6 7.54 11 7.54s9.27-3.19 11-7.54C21.27 8.11 17 5 12 5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
        ` : `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.19-11-7.54.5-1.35 1.26-2.62 2.22-3.74M9.88 9.88a3 3 0 0 0 4.24 4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `}
      </button>
      <button class="icon-btn delete-btn" type="button" style="opacity:0;" title="删除书签" data-action="delete">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    
    item.addEventListener('mouseenter', () => {
      item.querySelector('.visibility-btn').style.opacity = '1';
      item.querySelector('.delete-btn').style.opacity = '1';
    });
    item.addEventListener('mouseleave', () => {
      item.querySelector('.visibility-btn').style.opacity = '0';
      item.querySelector('.delete-btn').style.opacity = '0';
    });
    
    fragment.appendChild(item);
  });
  
  container.appendChild(fragment);
}

function playBookmarkEntrance() {
  const items = document.querySelectorAll('#bookmarksList .bookmark-item');
  if (!items.length) return;
  items.forEach(it => it.classList.add('visible'));
}

export function renderDesktopBookmarks() {
  const container = $('#linksGrid');
  if (!container) return;

  if (!bookmarksEnabled) {
    renderLinks(); // Fallback to quick links
    return;
  }

  container.innerHTML = '';
  container.classList.add('desktop-bookmarks');

  if (!bookmarks || bookmarks.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:24px;">没有桌面书签，打开设置 → 收藏夹 添加</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  const visibleBookmarks = bookmarks.filter(b => b.visible !== false);

  visibleBookmarks.forEach(b => {
    const a = document.createElement('a');
    a.className = 'link-card desktop-bookmark-card';
    a.href = b.url;
    a.target = '_blank';
    a.title = b.url;
    
    let contentHTML = '<div class="desktop-bookmark-content" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;">';
    
    if (b.showLogo !== false && b.favicon) {
      contentHTML += `<div class="desktop-bookmark-favicon" style="width:32px;height:32px;border-radius:6px;overflow:hidden;"><img src="${escapeHtml(b.favicon)}" style="width:100%;height:100%;object-fit:contain;"></div>`;
    }
    
    contentHTML += `<span style="font-size:13px;font-weight:500;">${escapeHtml(b.title || b.url)}</span>`;
    contentHTML += '</div>';
    
    a.innerHTML = contentHTML;
    
    const editBtn = document.createElement('button');
    editBtn.className = 'bookmark-edit-btn';
    editBtn.innerHTML = '⋮';
    editBtn.type = 'button';
    editBtn.setAttribute('title', '编辑书签');
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openBookmarkEditor(b);
    });
    a.appendChild(editBtn);
    
    fragment.appendChild(a);
  });

  container.appendChild(fragment);
}

function handleBookmarkActions(e) {
  const action = e.target.closest('[data-action]');
  if (!action) return;
  
  const item = e.target.closest('.bookmark-item');
  if (!item) return;
  
  const bookmarkId = Number(item.dataset.bookmarkId);
  const bookmark = bookmarks.find(b => b.id === bookmarkId);
  if (!bookmark) return;
  
  const actionType = action.getAttribute('data-action');
  
  if (actionType === 'delete') {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这个书签吗？')) {
      bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
      saveBookmarks();
      renderBookmarksList(document.getElementById('bookmarksSearch')?.value || '');
      renderDesktopBookmarks();
    }
  } else if (actionType === 'toggle-visibility') {
    e.preventDefault();
    e.stopPropagation();
    bookmark.visible = !bookmark.visible;
    saveBookmarks();
    renderBookmarksList(document.getElementById('bookmarksSearch')?.value || '');
    renderDesktopBookmarks();
    showToast(bookmark.visible ? '已显示书签' : '已隐藏书签');
  }
}

function promptAddBookmark() {
  const title = prompt('书签标题:');
  if (!title) return;
  
  const url = prompt('书签地址:');
  if (!url) return;
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast('请输入有效的URL');
    return;
  }
  
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
  showToast('书签已添加');
  
  loadBookmarkFavicon(bookmark);
}

function loadBookmarkFavicon(bookmark) {
  try {
    const hostname = new URL(bookmark.url).hostname;
    const candidates = [
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `https://${hostname}/favicon.ico`
    ];

    let tried = 0;
    let loaded = false;

    function tryLoad(src) {
      if (loaded) return;
      const img = new Image();
      
      img.onload = function() {
        if (img.width > 0 && img.height > 0) {
          loaded = true;
          bookmark.favicon = src;
          saveBookmarks();
          renderDesktopBookmarks();
          renderBookmarksList();
        } else {
          next();
        }
      };
      img.onerror = next;
      img.src = src;
    }

    function next() {
      tried++;
      if (tried < candidates.length) tryLoad(candidates[tried]);
    }

    tryLoad(candidates[0]);
  } catch (e) {}
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
    const data = JSON.parse(content);
    importedBookmarks = data.map(item => ({
      id: Date.now() + Math.random(),
      title: item.title || item.name || 'Untitled',
      url: item.url || item.href,
      folder: 'imported',
      favicon: null,
      visible: true,
      showLogo: true,
      timestamp: Date.now()
    }));
  } else {
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
          visible: true,
          showLogo: true,
          timestamp: Date.now()
        });
      }
    });
  }
  
  if (importedBookmarks.length > 0) {
    const existingUrls = new Set(bookmarks.map(b => b.url));
    const validImported = importedBookmarks.filter(b => b.url && !existingUrls.has(b.url));
    
    if (validImported.length > 0) {
      bookmarks = [...bookmarks, ...validImported];
      saveBookmarks();
      renderBookmarksList();
      renderDesktopBookmarks();
      showToast(`成功导入 ${validImported.length} 个书签`);
      validImported.forEach(b => loadBookmarkFavicon(b));
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

export function renderBookmarksEditor() {
  const container = document.getElementById('bookmarksEditor');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (bookmarks.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px;">还没有收藏夹</div>`;
    return;
  }
  
  const header = document.createElement('div');
  header.style.cssText = 'display:grid;grid-template-columns:40px 1fr 50px;gap:12px;align-items:center;padding:8px;margin-bottom:12px;border-bottom:1px solid var(--control-border);font-weight:600;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;';
  header.innerHTML = `
    <div style="text-align:center;">显示</div>
    <div>书签</div>
    <div></div>
  `;
  container.appendChild(header);
  
  bookmarks.forEach((b) => {
    const row = document.createElement('div');
    row.className = 'bookmark-row';
    row.style.cssText = 'display:grid;grid-template-columns:40px 1fr 50px;gap:12px;align-items:center;padding:12px;border-radius:8px;border:1px solid var(--control-border);margin-bottom:8px;transition:all 0.2s;background:var(--control-bg);';
    
    const checkboxDiv = document.createElement('div');
    checkboxDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = b.visible !== false;
    checkbox.addEventListener('change', (e) => {
      b.visible = e.target.checked;
      saveBookmarks();
      renderDesktopBookmarks();
    });
    checkboxDiv.appendChild(checkbox);
    
    const info = document.createElement('div');
    info.style.cssText = 'min-width:0;';
    info.innerHTML = `
      <div style="font-size:14px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(b.title)}</div>
      <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${escapeHtml(b.url)}</div>
    `;
    
    const btnDiv = document.createElement('div');
    btnDiv.style.cssText = 'display:flex;justify-content:center;';
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.innerHTML = '✎';
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const dialog = document.getElementById('editDialog');
      if (dialog) dialog.close();
      setTimeout(() => openBookmarkEditor(b), 100);
    });
    btnDiv.appendChild(editBtn);
    
    row.appendChild(checkboxDiv);
    row.appendChild(info);
    row.appendChild(btnDiv);
    container.appendChild(row);
  });
}

function openBookmarkEditor(bookmark) {
  const dialog = document.createElement('dialog');
  dialog.className = 'bookmark-editor-dialog';
  dialog.innerHTML = `
    <div class="bookmark-editor">
      <h3 style="margin-top:0;">编辑书签</h3>
      <div class="editor-field">
        <label>标题</label>
        <input type="text" id="editor-title" placeholder="书签标题" value="${escapeHtml(bookmark.title || '')}">
      </div>
      <div class="editor-field">
        <label>链接</label>
        <input type="text" id="editor-url" placeholder="https://example.com" value="${escapeHtml(bookmark.url || '')}">
      </div>
      <div class="editor-field" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="editor-show-logo" ${bookmark.showLogo !== false ? 'checked' : ''}>
        <label style="margin:0;flex:1;">显示 Logo</label>
      </div>
      <div class="editor-actions">
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button id="editor-cancel" class="btn-secondary" style="flex:1;">取消</button>
          <button id="editor-save" class="btn-primary" style="flex:1;">保存</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  const saveBtn = dialog.querySelector('#editor-save');
  const cancelBtn = dialog.querySelector('#editor-cancel');
  const titleInput = dialog.querySelector('#editor-title');
  const urlInput = dialog.querySelector('#editor-url');
  const logoCheckbox = dialog.querySelector('#editor-show-logo');
  
  saveBtn.addEventListener('click', () => {
    bookmark.title = titleInput.value.trim() || bookmark.url;
    bookmark.url = urlInput.value.trim();
    bookmark.showLogo = logoCheckbox.checked;
    saveBookmarks();
    renderDesktopBookmarks();
    renderBookmarksList();
    renderBookmarksEditor();
    dialog.close();
    document.body.removeChild(dialog);
  });
  
  cancelBtn.addEventListener('click', () => {
    dialog.close();
    document.body.removeChild(dialog);
  });
  
  dialog.showModal();
}
