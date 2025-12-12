
import { $, showToast, compressImage } from './utils.js';
import { initIndexedDB, saveBackgroundToDB, loadBackgroundFromDB } from './storage.js';
import { BACKGROUND_CONFIG, STORAGE_KEYS } from '../config.js';

let currentBg = '';
let currentBgType = 'color';

export function initBackground() {
    bindBackgroundEvents();
}

export function applyBackground() {
    const root = document.documentElement;
    const updates = {};
    let isVideo = false;

    if (currentBgType === 'video' && currentBg) {
        createVideoBackground(currentBg);
        updates['--bg'] = 'transparent';
        updates['--bg-image'] = 'none';
        isVideo = true;
    } else if (currentBgType === 'image' && currentBg) {
        updates['--bg-image'] = `url("${currentBg}")`;
        updates['--bg'] = 'transparent';
        updates['--bg-size'] = 'cover';
        updates['--bg-pos'] = 'center center';
    } else if (currentBgType === 'gradient' && currentBg) {
        updates['--bg'] = currentBg;
        updates['--bg-image'] = 'none';
    } else if (currentBgType === 'color' && currentBg) {
        updates['--bg'] = currentBg;
        updates['--bg-image'] = 'none';
    } else {
        root.style.removeProperty('--bg-image');
        root.style.removeProperty('--bg');
        root.style.removeProperty('--bg-size');
        root.style.removeProperty('--bg-pos');
    }

    requestAnimationFrame(() => {
        for (const [key, value] of Object.entries(updates)) {
            root.style.setProperty(key, value);
        }
    });

    if (!isVideo) {
        removeVideoBackground();
    }
}

function createVideoBackground(videoUrl) {
    let container = document.getElementById('videoBgContainer');
    let video = document.getElementById('videoBgPlayer');

    if (video && video.src === videoUrl && !video.paused) {
        video.style.opacity = '1';
        return;
    }

    if (!container) {
        container = document.createElement('div');
        container.id = 'videoBgContainer';
        container.className = 'video-bg-container';
        document.body.insertBefore(container, document.body.firstChild);
    }

    if (!video) {
        video = document.createElement('video');
        video.id = 'videoBgPlayer';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.className = 'video-bg-player'; // Use CSS class
        
        video.addEventListener('loadeddata', () => {
            video.style.opacity = '1';
        }, { once: true });

        container.appendChild(video);
    }

    if (video.src !== videoUrl) {
        video.style.opacity = '0';
        video.src = videoUrl;
        video.play().catch(() => {
            // Handle autoplay policy
            document.addEventListener('click', () => video.play(), { once: true });
        });
    }
}

function removeVideoBackground() {
    const container = document.getElementById('videoBgContainer');
    if (container) {
        const video = container.querySelector('video');
        if (video) {
            video.pause();
            video.src = '';
        }
        container.remove();
    }
}

export async function loadSavedBackground() {
    const bgType = localStorage.getItem(STORAGE_KEYS.BG_TYPE) || 'color';
    let localBg = localStorage.getItem(STORAGE_KEYS.BG);

    if (!localBg) {
        if (currentBg) {
            currentBg = '';
            currentBgType = 'color';
            applyBackground();
        }
        return;
    }

    if (localBg === 'INDEXED_DB_VIDEO') {
        try {
            await initIndexedDB();
            const dbData = await loadBackgroundFromDB();

            if (dbData?.data) {
                const videoUrl = dbData.data instanceof Blob 
                    ? URL.createObjectURL(dbData.data) 
                    : dbData.data;
                
                currentBg = videoUrl;
                currentBgType = bgType;
                applyBackground();
                return;
            }
        } catch (error) {
            console.warn('Failed to load background from DB:', error);
        }
        localStorage.removeItem(STORAGE_KEYS.BG);
        currentBg = '';
        currentBgType = 'color';
        applyBackground();
        return;
    }

    if (localBg) {
        currentBg = localBg;
        currentBgType = bgType;
        applyBackground();
    }
}

export function openBackgroundDialog() {
    const dialog = document.getElementById('bgDialog');
    if (dialog) {
        initializeBackgroundDialog();
        dialog.showModal();
    }
}

export function closeBackgroundDialog() {
    document.getElementById('bgDialog').close();
}

function initializeBackgroundDialog() {
    switchTab('presets');
    renderPresets();
    
    const fileInput = document.getElementById('bgFileInput');
    const urlInput = document.getElementById('bgUrlInput');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === tabName);
    });
}

function renderPresets() {
    const grid = document.getElementById('presetsGrid');
    if (!grid || grid.children.length > 0) return;
    
    const createItem = (bg, isVideo = false) => {
        const item = document.createElement('div');
        item.className = `preset-item ${isVideo ? 'video-preset' : ''}`;
        item.onclick = () => selectPreset(bg);
        
        const preview = document.createElement('div');
        preview.className = `preset-preview ${isVideo ? 'video-preview' : ''}`;
        
        if (bg.type === 'image') {
            preview.style.backgroundImage = `url("${bg.value}")`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
        } else if (bg.type === 'gradient') {
            preview.style.background = bg.color;
        } else if (bg.type === 'solid') {
            preview.style.backgroundColor = bg.color;
        } else if (isVideo) {
            const video = document.createElement('video');
            video.src = bg.value;
            video.muted = true;
            video.loop = true;
            video.preload = 'metadata';
            video.style.objectFit = 'contain';
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.backgroundColor = '#000';
            
            item.onmouseenter = () => video.play().catch(() => {});
            item.onmouseleave = () => { video.pause(); video.currentTime = 0; };
            
            preview.appendChild(video);
            const playIcon = document.createElement('div');
            playIcon.className = 'play-icon';
            playIcon.textContent = '▶';
            preview.appendChild(playIcon);
        }
        
        const name = document.createElement('div');
        name.className = 'preset-name';
        name.textContent = bg.name || (bg.type === 'solid' ? '纯色' : '渐变');
        
        item.appendChild(preview);
        item.appendChild(name);
        return item;
    };

    BACKGROUND_CONFIG.presets.forEach(bg => grid.appendChild(createItem(bg)));
    BACKGROUND_CONFIG.videos.forEach(bg => grid.appendChild(createItem(bg, true)));
    (BACKGROUND_CONFIG.colors || []).forEach(bg => {
        const colorBg = { ...bg, value: bg.color, name: '' }; 
        grid.appendChild(createItem(colorBg));
    });
}

function selectPreset(bg) {
    currentBg = bg.value || bg.color;
    currentBgType = bg.type;
    applyBackground();
}

async function handleFileUpload(file) {
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/');
    
    if (isVideo) {
        if (file.size > 50 * 1024 * 1024) {
            showToast('视频文件过大 (最大 50MB)');
            return;
        }
        await saveVideoBackground(file);
    } else {
        await saveImageBackground(file);
    }
}

async function saveVideoBackground(file) {
    try {
        showToast('正在处理视频...');
        const blobUrl = URL.createObjectURL(file);
        
        currentBg = blobUrl;
        currentBgType = 'video';
        applyBackground();
        
        await saveBackgroundToDB(file, 'video');
        localStorage.setItem(STORAGE_KEYS.BG_TYPE, 'video');
        localStorage.setItem(STORAGE_KEYS.BG, 'INDEXED_DB_VIDEO');
        
        showToast('视频背景已保存');
        closeBackgroundDialog();
    } catch (error) {
        showToast('保存失败: ' + error.message);
    }
}

async function saveImageBackground(file) {
    try {
        showToast('正在处理图片...');
        
        // Compress if larger than 2MB
        let blobToSave = file;
        if (file.size > 2 * 1024 * 1024) {
            blobToSave = await compressImage(file, { maxWidth: 1920, quality: 0.85 });
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            currentBg = dataUrl;
            currentBgType = 'image';
            applyBackground();
            
            try {
                localStorage.setItem(STORAGE_KEYS.BG, dataUrl);
                localStorage.setItem(STORAGE_KEYS.BG_TYPE, 'image');
            } catch (e) {
                await saveBackgroundToDB(blobToSave, 'image');
                localStorage.setItem(STORAGE_KEYS.BG, 'INDEXED_DB_VIDEO');
                localStorage.setItem(STORAGE_KEYS.BG_TYPE, 'image');
            }
            
            showToast('图片背景已保存');
            closeBackgroundDialog();
        };
        reader.readAsDataURL(blobToSave);
        
    } catch (error) {
        showToast('处理失败: ' + error.message);
    }
}

function handleUrlBackground() {
    const url = document.getElementById('bgUrlInput').value.trim();
    if (!url) return;
    
    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
    
    currentBg = url;
    currentBgType = isVideo ? 'video' : 'image';
    applyBackground();
    
    localStorage.setItem(STORAGE_KEYS.BG, currentBg);
    localStorage.setItem(STORAGE_KEYS.BG_TYPE, currentBgType);
    
    closeBackgroundDialog();
    showToast('网络背景已应用');
}

export function bindBackgroundEvents() {
    const bgBtn = $('#bgBtn');
    if (bgBtn) bgBtn.onclick = openBackgroundDialog;

    const dialog = document.getElementById('bgDialog');
    if (dialog) {
        dialog.addEventListener('close', () => {
            loadSavedBackground();
        });
    }
    
    const fileInput = document.getElementById('bgFileInput');
    if (fileInput) {
        fileInput.onchange = (e) => handleFileUpload(e.target.files[0]);
    }
    
    const resetBtn = document.getElementById('resetBgBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            currentBg = '';
            currentBgType = 'color';
            applyBackground();
            localStorage.removeItem(STORAGE_KEYS.BG);
            localStorage.removeItem(STORAGE_KEYS.BG_TYPE);
            showToast('背景已重置');
            closeBackgroundDialog();
        };
    }
    
    const cancelBtn = document.getElementById('cancelBgBtn');
    if (cancelBtn) cancelBtn.onclick = () => {
        closeBackgroundDialog();
    };

    const saveBgBtn = document.getElementById('saveBgBtn');
    if (saveBgBtn) {
        saveBgBtn.onclick = () => {
            if (currentBg) {
                localStorage.setItem(STORAGE_KEYS.BG, currentBg);
                localStorage.setItem(STORAGE_KEYS.BG_TYPE, currentBgType);
                showToast('背景已保存');
            }
            closeBackgroundDialog();
        };
    }
    
    const applyUrlBtn = document.getElementById('applyUrlBtn');
    if (applyUrlBtn) applyUrlBtn.onclick = handleUrlBackground;
    
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.onclick = () => fileInput && fileInput.click();
        
        uploadArea.ondragover = (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        };
        
        uploadArea.ondragleave = () => {
            uploadArea.classList.remove('dragover');
        };
        
        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        };
    }
}
