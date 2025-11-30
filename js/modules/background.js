import { $, showToast, smartCompress, compressImage } from './utils.js';
import { initIndexedDB, saveBackgroundToDB, loadBackgroundFromDB, getDB } from './storage.js';

let currentBg = '';
let currentBgType = 'color';

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

const presetVideos = [
    { id: 'video1', name: '上杉绘梨衣', type: 'video', value: 'video/上杉绘梨衣.mp4', thumbnail: 'video/上杉绘梨衣.mp4' },
    { id: 'video_elaina1', name: '伊蕾娜1', type: 'video', value: 'video/伊蕾娜1.mp4', thumbnail: 'video/伊蕾娜1.mp4' },
    { id: 'video_elaina2', name: '伊蕾娜2', type: 'video', value: 'video/伊蕾娜2.mp4', thumbnail: 'video/伊蕾娜2.mp4' },
    { id: 'video_elaina3', name: '伊蕾娜3', type: 'video', value: 'video/伊蕾娜3.mp4', thumbnail: 'video/伊蕾娜3.mp4' },
    { id: 'video_keqing', name: '刻晴', type: 'video', value: 'video/刻晴.mp4', thumbnail: 'video/刻晴.mp4' },
    { id: 'video_xi', name: '囍', type: 'video', value: 'video/囍.mp4', thumbnail: 'video/囍.mp4' },
    { id: 'video3', name: '心海', type: 'video', value: 'video/心海.mp4', thumbnail: 'video/心海.mp4' },
    { id: 'video_jiangnan', name: '江南烧酒', type: 'video', value: 'video/江南烧酒.mp4', thumbnail: 'video/江南烧酒.mp4' },
    { id: 'video4', name: '藿藿', type: 'video', value: 'video/藿藿.mp4', thumbnail: 'video/藿藿.mp4' },
    { id: 'video5', name: '胡桃', type: 'video', value: 'video/胡桃.mp4', thumbnail: 'video/胡桃.mp4' },
    { id: 'video_witch', name: '魔女', type: 'video', value: 'video/魔女.mp4', thumbnail: 'video/魔女.mp4' },
    { id: 'video_luming', name: '鹿鸣', type: 'video', value: 'video/鹿鸣.mp4', thumbnail: 'video/鹿鸣.mp4' }
];

const presetColors = [
    { type: 'solid', color: '#FF5733' },
    { type: 'solid', color: '#33FF57' },
    { type: 'solid', color: '#3357FF' },
    { type: 'gradient', color: 'linear-gradient(135deg, #FF5733, #FFC300)' },
    { type: 'gradient', color: 'linear-gradient(135deg, #33FF57, #33FFF5)' },
    { type: 'gradient', color: 'linear-gradient(135deg, #3357FF, #8E44AD)' },
];

export function initBackground() {
    bindBackgroundEvents();
    applyBackground();
}

export function applyBackground() {
    const root = document.documentElement;
    const updates = {};
    let needsVideoCleanup = true;

    if (currentBgType === 'video' && currentBg) {
        createVideoBackground(currentBg);
        updates['--bg'] = 'transparent';
        updates['--bg-image'] = 'none';
        needsVideoCleanup = false;
    } else if (currentBgType === 'image' && currentBg) {
        updates['--bg-image'] = `url(${currentBg})`;
        updates['--bg'] = 'none';
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

    if (Object.keys(updates).length > 0) {
        requestAnimationFrame(() => {
            for (const [key, value] of Object.entries(updates)) {
                root.style.setProperty(key, value);
            }
        });
    }

    if (needsVideoCleanup) {
        removeVideoBackground();
    }
}

function createVideoBackground(videoUrl) {
    const createStart = performance.now();
    let videoContainer = document.getElementById('videoBgContainer');
    let video = document.getElementById('videoBgPlayer');

    if (video && video.src === videoUrl && !video.paused) {
        video.style.opacity = '1';
        return;
    }

    if (!videoContainer) {
        videoContainer = document.createElement('div');
        videoContainer.id = 'videoBgContainer';
        videoContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;overflow:hidden;pointer-events:none;';
        document.body.insertBefore(videoContainer, document.body.firstChild);
    }

    if (!video) {
        video = document.createElement('video');
        video.id = 'videoBgPlayer';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 0.3s;';

        video.addEventListener('loadeddata', () => {
            video.style.opacity = '1';
            const loadTime = (performance.now() - createStart).toFixed(1);
            console.log(`✅ 视频渲染完成，总耗时: ${loadTime}ms`);
        }, { once: true });

        videoContainer.appendChild(video);
    }

    if (video.src !== videoUrl) {
        video.style.opacity = '0';
        video.src = videoUrl;
        video.play().catch(() => {
            document.addEventListener('click', () => video.play(), { once: true });
        });
    }
}

function removeVideoBackground() {
    const videoContainer = document.getElementById('videoBgContainer');
    if (videoContainer) {
        const video = videoContainer.querySelector('video');
        if (video) {
            video.pause();
            video.src = '';
        }
        videoContainer.remove();
    }
}

export async function loadSavedBackground() {
    const cachedVideo = document.getElementById('videoBgPlayer');
    if (cachedVideo && !cachedVideo.paused) {
        return;
    }

    const bgType = localStorage.getItem('startpage.bgType') || 'color';

    if (bgType !== 'video') {
        const localBg = localStorage.getItem('startpage.bg');
        if (localBg) {
            currentBg = localBg;
            currentBgType = bgType;
            applyBackground();
        }
        return;
    }

    const localBg = localStorage.getItem('startpage.bg');

    if (localBg === 'INDEXED_DB_VIDEO') {
        try {
            if (!getDB()) await initIndexedDB();
            const dbData = await loadBackgroundFromDB();

            if (dbData?.data) {
                let videoUrl;
                if (dbData.data instanceof Blob) {
                    videoUrl = URL.createObjectURL(dbData.data);
                } else if (typeof dbData.data === 'string' && dbData.data.startsWith('data:')) {
                    videoUrl = dbData.data;
                } else {
                    throw new Error('未知的视频数据格式');
                }

                currentBg = videoUrl;
                currentBgType = bgType;
                applyBackground();
                return;
            }
        } catch (error) {
            console.warn('❌ IndexedDB加载失败:', error);
        }
        localStorage.removeItem('startpage.bg');
        localStorage.removeItem('startpage.bgType');
        return;
    }

    if (localBg) {
        currentBg = localBg;
        currentBgType = bgType;
        applyBackground();

        if (localBg.startsWith('data:') && localBg.length > 1024 * 1024) {
            setTimeout(async () => {
                try {
                    const response = await fetch(localBg);
                    const blob = await response.blob();

                    if (!getDB()) await initIndexedDB();
                    await saveBackgroundToDB(blob, currentBgType);
                    localStorage.setItem('startpage.bg', 'INDEXED_DB_VIDEO');
                } catch (e) {
                    console.warn('迁移失败:', e);
                }
            }, 3000);
        }
        return;
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
    generatePresetBackgrounds();
    resetCustomUpload();
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.querySelector(`[data-panel="${tabName}"]`);
    
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
}

function generatePresetBackgrounds() {
    const grid = document.getElementById('presetsGrid');
    if (!grid) return;
    
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
    
    presetVideos.forEach(bg => {
        const item = document.createElement('div');
        item.className = 'preset-item video-preset';
        item.onclick = () => selectPresetBackground(bg);
        
        const preview = document.createElement('div');
        preview.className = 'preset-preview video-preview';
        preview.style.backgroundImage = `url(${bg.thumbnail})`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
        
        const playIcon = document.createElement('div');
        playIcon.className = 'play-icon';
        playIcon.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `;
        preview.appendChild(playIcon);
        
        const name = document.createElement('div');
        name.className = 'preset-name';
        name.textContent = `🎬 ${bg.name}`;
        
        item.appendChild(preview);
        item.appendChild(name);
        grid.appendChild(item);
    });
}

function selectPresetBackground(bg) {
    const currentBgValue = localStorage.getItem('startpage.bg');
    if (currentBgValue === 'INDEXED_DB_VIDEO' && bg.type === 'video') {
        const confirmed = confirm('当前有自定义上传的视频背景，切换到预设视频会丢失。确定要切换吗？');
        if (!confirmed) return;
    }
    
    document.querySelectorAll('.preset-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    currentBg = bg.value;
    currentBgType = bg.type;
    applyBackground();
    
    localStorage.setItem('startpage.bg', currentBg);
    localStorage.setItem('startpage.bgType', currentBgType);
    
    showToast(`已应用${bg.name}背景`);
    closeBackgroundDialog();
    setTimeout(() => location.reload(), 500);
}

function resetCustomUpload() {
    const fileInput = document.getElementById('bgFileInput');
    const urlInput = document.getElementById('bgUrlInput');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
}

export function resetBackground() {
    currentBg = '';
    currentBgType = 'color';
    applyBackground();
    localStorage.removeItem('startpage.bg');
    localStorage.removeItem('startpage.bgType');
    showToast('背景已重置');
    closeBackgroundDialog();
    setTimeout(() => location.reload(), 500);
}

function handleFileUpload(file) {
    if (!file) {
        showToast('请选择文件');
        return;
    }
    
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
        showToast('请选择图片或视频文件');
        return;
    }
    
    if (isVideo) {
        handleVideoUpload(file);
    } else {
        handleImageUpload(file);
    }
}

function handleVideoUpload(file) {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 10) {
        showToast('视频较大，正在优化处理...');
        optimizeVideo(file).then(optimizedBlob => {
            if (optimizedBlob) {
                processVideoFile(optimizedBlob);
            } else {
                showToast('正在加载原始视频...');
                processVideoFile(file);
            }
        }).catch(error => {
            showToast('正在加载原始视频...');
            processVideoFile(file);
        });
    } else {
        showToast('正在加载视频...');
        processVideoFile(file);
    }
}

function optimizeVideo(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.preload = 'metadata';
        video.muted = true;
        
        video.onloadedmetadata = function() {
            let targetWidth = video.videoWidth;
            let targetHeight = video.videoHeight;
            const maxWidth = 1920;
            const maxHeight = 1080;
            
            if (video.videoWidth > maxWidth || video.videoHeight > maxHeight) {
                const widthRatio = maxWidth / video.videoWidth;
                const heightRatio = maxHeight / video.videoHeight;
                const ratio = Math.min(widthRatio, heightRatio);
                
                targetWidth = Math.round(video.videoWidth * ratio);
                targetHeight = Math.round(video.videoHeight * ratio);
                
                targetWidth = targetWidth - (targetWidth % 2);
                targetHeight = targetHeight - (targetHeight % 2);
            }
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            video.currentTime = 0;
        };
        
        video.onseeked = function() {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(null); 
        };
        
        video.onerror = function(e) {
            reject(new Error('视频加载失败'));
        };
        
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
    });
}

async function processVideoFile(file) {
    try {
        const blobUrl = URL.createObjectURL(file);
        currentBg = blobUrl;
        currentBgType = 'video';
        applyBackground();
        
        showToast('正在保存视频背景...');
        
        if (!getDB()) await initIndexedDB();
        await saveBackgroundToDB(file, currentBgType);
        
        localStorage.setItem('startpage.bgType', currentBgType);
        localStorage.setItem('startpage.bg', 'INDEXED_DB_VIDEO');
        
        showToast('✅ 视频背景已应用并永久保存');
        setTimeout(() => location.reload(), 500);
        
    } catch (error) {
        showToast('视频背景应用失败: ' + error.message);
    }
}

function handleImageUpload(file) {
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 10) {
        showToast('图片较大，正在智能压缩，请稍候...');
    } else {
        showToast('正在优化图片质量...');
    }
    
    smartCompress(file).then(compressedBlob => {
        if (compressedBlob) {
            processImageFile(compressedBlob);
        } else {
            showToast('图片处理失败');
        }
    }).catch(error => {
        showToast('图片处理失败，请尝试其他图片');
    });
}

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;
        
        try {
            currentBg = imageData;
            currentBgType = 'image';
            applyBackground();
            
            try {
                localStorage.setItem('startpage.bg', currentBg);
                localStorage.setItem('startpage.bgType', currentBgType);
                
                saveBackgroundToDB(currentBg, currentBgType).catch(err => {
                    console.warn('备份到IndexedDB失败:', err);
                });
                closeBackgroundDialog();
                showToast('自定义背景已应用并保存 ✓');
                setTimeout(() => location.reload(), 500);
                
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    try {
                        await saveBackgroundToDB(currentBg, currentBgType);
                        closeBackgroundDialog();
                        showToast('背景已应用并保存到IndexedDB ✓');
                        setTimeout(() => location.reload(), 500);
                    } catch (dbError) {
                        if (file instanceof Blob) {
                            const originalFile = new File([file], 'compressed.jpg', { type: 'image/jpeg' });
                            compressImage(originalFile, {
                                maxWidth: 1280,
                                maxHeight: 720,
                                targetSize: 800 * 1024,
                                quality: 0.75
                            }).then(smallerBlob => {
                                if (smallerBlob) {
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
                            showToast('图片已应用（无法永久保存）');
                            closeBackgroundDialog();
                        }
                    }
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            showToast('保存背景失败: ' + error.message);
        }
    };
    
    reader.onerror = function(e) {
        showToast('文件读取失败');
    };
    
    reader.readAsDataURL(file);
}

function handleUrlBackground() {
    const urlInput = document.getElementById('bgUrlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        showToast('请输入图片或视频URL');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showToast('请输入有效的HTTP或HTTPS链接');
        return;
    }
    
    try {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
        const isVideo = videoExtensions.some(ext => url.toLowerCase().includes(ext));
        
        currentBg = url;
        currentBgType = isVideo ? 'video' : 'image';
        applyBackground();
        
        localStorage.setItem('startpage.bg', currentBg);
        localStorage.setItem('startpage.bgType', currentBgType);
        
        saveBackgroundToDB(currentBg, currentBgType).catch(err => {
            console.warn('保存到IndexedDB失败:', err);
        });
        
        closeBackgroundDialog();
        showToast(isVideo ? '视频背景已应用并保存 ✓' : '背景已应用并保存 ✓');
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        showToast('应用背景失败: ' + error.message);
    }
}

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
        document.getElementById('bgFileInput').click();
    });
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    }
}

export function bindBackgroundEvents() {
    const bgBtn = $('#bgBtn');
    if (bgBtn) {
        bgBtn.addEventListener('click', openBackgroundDialog);
    }
    
    const fileInput = document.getElementById('bgFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileUpload(file);
            }
        });
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
