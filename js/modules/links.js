import { $, showToast, escapeHtml } from './utils.js';

const defaultLinks = [
  {title: 'GitHub', url: 'https://github.com'},
];

let links = [];

export function initLinks() {
  loadState();
  renderLinks();
  
  $('#addLinkBtn')?.addEventListener('click', addLinkRow);
  
  $('#saveLinksBtn')?.addEventListener('click', (e) => {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab?.dataset.tab === 'links') {
      e.preventDefault();
      saveEditor();
    }
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem('startpage.links');
    links = raw ? JSON.parse(raw) : defaultLinks;
  } catch {
    links = defaultLinks;
  }
}

function saveState() {
  localStorage.setItem('startpage.links', JSON.stringify(links));
}

export function renderLinks() {
  const container = $('#linksGrid');
  if (!container) return;
  
  if (localStorage.getItem('startpage.bookmarksEnabled') === 'true') return;
  
  container.classList.remove('desktop-bookmarks');
  container.innerHTML = '';
  
  const fragment = document.createDocumentFragment();
  
  links.forEach((l) => {
    const a = document.createElement('a');
    a.className = 'link-card';
    a.href = l.url;
    a.target = '_blank';
    
    const initialLetter = getInitialLetter(l.title, l.url);
    const faviconDiv = document.createElement('div');
    faviconDiv.className = 'favicon loading';
    faviconDiv.textContent = initialLetter;
    faviconDiv.setAttribute('data-initial', initialLetter);
    
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<div class="title">${escapeHtml(l.title)}</div><div class="url">${escapeHtml(l.url)}</div>`;
    
    a.append(faviconDiv, meta);
    fragment.appendChild(a);
    
    // Async load favicon
    loadFavicon(faviconDiv, getLogoSources(l.url), initialLetter);
  });
  
  container.appendChild(fragment);
}

function getInitialLetter(title, url) {
  const text = (title || '').trim();
  if (text) {
    const first = text[0].toUpperCase();
    if (first.charCodeAt(0) > 127 || /[A-Z]/.test(first)) return first;
  }
  
  try {
    const { hostname } = new URL(url);
    const domain = hostname.replace(/^www\./, '').split('.')[0];
    return domain ? domain[0].toUpperCase() : '?';
  } catch {
    return '?';
  }
}

function getLogoSources(url) {
  try {
    const { origin, hostname } = new URL(url);
    return [
      `${origin}/favicon.ico`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
      `https://favicon.yandex.net/favicon/${hostname}`,
      `${origin}/apple-touch-icon.png`,
      `${origin}/favicon.png`
    ];
  } catch {
    return [];
  }
}

async function loadFavicon(el, sources, initial) {
  for (const src of sources) {
    try {
      await checkImage(src);
      
      const img = new Image();
      img.src = src;
      
      el.classList.remove('loading');
      el.style.opacity = '0';
      
      // Smooth transition
      requestAnimationFrame(() => {
        el.innerHTML = '';
        el.appendChild(img);
        el.classList.add('has-logo');
        el.classList.remove('initial-letter');
        el.style.opacity = '1';
      });
      return;
    } catch {
      continue;
    }
  }
  
  el.classList.remove('loading');
  el.textContent = initial;
  el.classList.add('initial-letter');
}

function checkImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => (img.width > 0 && img.height > 0) ? resolve() : reject();
    img.onerror = reject;
    img.src = src;
    setTimeout(reject, 3000);
  });
}

export function renderLinksEditor() {
  const editor = $('#linksEditor');
  if (!editor) return;
  
  editor.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  links.forEach((l, idx) => {
    const row = createLinkRow(l.title, l.url, () => {
      links.splice(idx, 1);
      renderLinksEditor();
    });
    fragment.appendChild(row);
  });
  
  editor.appendChild(fragment);
}

function addLinkRow() {
  const editor = $('#linksEditor');
  if (!editor) return;
  
  const row = createLinkRow('', '', () => row.remove());
  editor.appendChild(row);
}

function createLinkRow(title, url, onDelete) {
  const row = document.createElement('div');
  row.className = 'link-row';
  row.innerHTML = `
    <input class="title" placeholder="标题" value="${escapeHtml(title || '')}">
    <input class="url" placeholder="https://..." value="${escapeHtml(url || '')}">
    <button class="remove">删除</button>
  `;
  row.querySelector('.remove').addEventListener('click', onDelete);
  return row;
}

function saveEditor() {
  const editor = $('#linksEditor');
  if (!editor) return;
  
  const rows = editor.querySelectorAll('.link-row');
  const newLinks = [];
  
  rows.forEach(row => {
    const title = row.querySelector('.title').value.trim();
    const url = row.querySelector('.url').value.trim();
    if (url) newLinks.push({ title, url });
  });
  
  links = newLinks.length ? newLinks : defaultLinks;
  saveState();
  renderLinks();
  
  document.getElementById('editDialog')?.close();
  showToast('快速链接已保存');
}
