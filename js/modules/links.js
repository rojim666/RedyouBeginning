
import { $, showToast, escapeHtml } from './utils.js';

const defaultLinks = [
  {title: 'GitHub', url: 'https://github.com'},
  {title: 'Gmail', url: 'https://mail.google.com'},
  {title: '知乎', url: 'https://www.zhihu.com'},
  {title: '掘金', url: 'https://juejin.cn'}
];

let links = [];

export function initLinks() {
  loadState();
  renderLinks();
  
  const addLinkBtn = $('#addLinkBtn');
  const saveLinksBtn = $('#saveLinksBtn');
  
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', addLinkRow);
  }
  
  if (saveLinksBtn) {
    saveLinksBtn.addEventListener('click', (e) => {
      // Only save if the active tab is "links"
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab && activeTab.dataset.tab === 'links') {
        e.preventDefault();
        saveEditor();
      }
    });
  }
}

function loadState() {
  const raw = localStorage.getItem('startpage.links');
  if (raw) {
    try { links = JSON.parse(raw); } catch (e) { links = defaultLinks; }
  } else {
    links = defaultLinks;
  }
}

function saveState() {
  localStorage.setItem('startpage.links', JSON.stringify(links));
}

export function renderLinks() {
  const container = $('#linksGrid');
  if (!container) return;
  
  // Check if desktop bookmarks are enabled
  const bookmarksEnabled = localStorage.getItem('startpage.bookmarksEnabled') === 'true';
  if (bookmarksEnabled) {
    // If desktop bookmarks are enabled, we don't render quick links here
    // The bookmarks module will handle rendering desktop bookmarks
    return;
  }
  
  container.classList.remove('desktop-bookmarks');
  container.innerHTML = '';
  
  links.forEach((l) => {
    const a = document.createElement('a');
    a.className = 'link-card';
    a.href = l.url;
    a.target = '_blank';
    
    const faviconDiv = document.createElement('div');
    faviconDiv.className = 'favicon';
    
    const initialLetter = getInitialLetter(l.title, l.url);
    faviconDiv.textContent = initialLetter;
    faviconDiv.setAttribute('data-initial', initialLetter);
    
    // Load favicon
    const logoSources = getLogoSources(l.url);
    if (logoSources.length > 0) {
      loadFavicon(faviconDiv, logoSources, initialLetter);
    } else {
      faviconDiv.classList.add('initial-letter');
    }
    
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<div class="title">${escapeHtml(l.title)}</div><div class="url">${escapeHtml(l.url)}</div>`;
    
    a.appendChild(faviconDiv);
    a.appendChild(meta);
    container.appendChild(a);
  });
}

function getInitialLetter(title, url) {
  if (title && title.trim()) {
    const firstChar = title.trim()[0].toUpperCase();
    if (firstChar.charCodeAt(0) > 127 || /[A-Za-z]/.test(firstChar)) {
      return firstChar;
    }
  }
  try {
    const hostname = new URL(url).hostname;
    const domainName = hostname.replace(/^www\./, '').split('.')[0];
    if (domainName) return domainName[0].toUpperCase();
  } catch (e) {}
  return '?';
}

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

function loadFavicon(faviconDiv, sources, initialLetter) {
  let sourceIndex = 0;
  let logoLoaded = false;
  faviconDiv.classList.add('loading');
  
  function tryNextSource() {
    if (sourceIndex >= sources.length || logoLoaded) {
      faviconDiv.classList.remove('loading');
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
      setTimeout(tryNextSource, 200);
    };
    
    img.src = sources[sourceIndex];
    setTimeout(() => {
      if (!logoLoaded && sourceIndex < sources.length - 1) {
        img.src = '';
        sourceIndex++;
        tryNextSource();
      }
    }, 3000);
  }
  
  tryNextSource();
}

export function renderLinksEditor() {
  const editor = $('#linksEditor');
  if (!editor) return;
  
  editor.innerHTML = '';
  links.forEach((l, idx) => {
    const row = document.createElement('div');
    row.className = 'link-row';
    row.innerHTML = `<input class="title" placeholder="标题" value="${escapeHtml(l.title)}"><input class="url" placeholder="https://..." value="${escapeHtml(l.url)}"><button class="remove">删除</button>`;
    row.querySelector('.remove').addEventListener('click', () => {
      links.splice(idx, 1);
      renderLinksEditor();
    });
    editor.appendChild(row);
  });
}

function addLinkRow() {
  const editor = $('#linksEditor');
  if (!editor) return;
  
  const row = document.createElement('div');
  row.className = 'link-row';
  row.innerHTML = `<input class="title" placeholder="标题"><input class="url" placeholder="https://..."><button class="remove">删除</button>`;
  row.querySelector('.remove').addEventListener('click', () => { row.remove(); });
  editor.appendChild(row);
}

function saveEditor() {
  const editor = $('#linksEditor');
  if (!editor) return;
  
  const rows = Array.from(editor.querySelectorAll('.link-row'));
  const newLinks = rows.map(r => ({
    title: r.querySelector('.title').value.trim(),
    url: r.querySelector('.url').value.trim()
  })).filter(x => x.url);
  
  links = newLinks.length ? newLinks : defaultLinks;
  saveState();
  renderLinks();
  
  const dialog = document.getElementById('editDialog');
  if (dialog) dialog.close();
  showToast('快速链接已保存');
}
