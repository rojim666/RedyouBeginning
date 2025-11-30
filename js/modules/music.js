
import { $, showToast, formatTime } from './utils.js';
import { fetchMusicPlaylist } from './api.js';

const ambientSounds = [
  { 
    id: 'rain', 
    name: '雨声', 
    url: 'music/rain.mp3',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M8 16l-1 2M12 14l-1 2M16 16l-1 2M8 10l-1 2M12 8l-1 2M16 10l-1 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  { 
    id: 'ocean', 
    name: '海浪', 
    url: 'music/waves.mp3',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5c.5-2 2-3.5 4-3.5M2 16c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5c.5-2 2-3.5 4-3.5M2 20c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5c.5-2 2-3.5 4-3.5s3.5 1.5 4 3.5c.5-2 2-3.5 4-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  { 
    id: 'forest', 
    name: '森林', 
    url: 'music/forest.mp3',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L8 8h8l-4-6zM12 8L8 14h8l-4-6zM12 14L6 22h12l-6-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 22v-4h4v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  { 
    id: 'cafe', 
    name: '咖啡厅', 
    url: 'music/cafe.mp3',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 1v3M10 1v3M14 1v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  },
  { 
    id: 'fireplace', 
    name: '壁炉', 
    url: 'music/fire.mp3',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  { 
    id: 'thunder', 
    name: '雷雨', 
    url: 'music/rain and thunder.mp3',
    svg: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 16l-1 2M12 14l-1 2M16 16l-1 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  }
];

let currentAudio = null;
let currentSoundId = null;

let musicState = {
    playlist: [],
    currentIndex: 0,
    isPlaying: false,
    playMode: 'sequence',
    audio: null,
    duration: 0,
    currentTime: 0
};

export function initSoundPanel() {
  const soundList = $('#soundList');
  const soundBtn = $('#soundBtn');
  const soundPanel = $('#soundPanel');
  const closeSoundBtn = $('#closeSoundBtn');
  const volumeSlider = $('#volumeSlider');
  const volumeValue = $('#volumeValue');
  
  if (!soundList || !soundBtn) return;
  
  soundList.innerHTML = ambientSounds.map(sound => `
    <div class="sound-item" data-sound-id="${sound.id}">
      <div class="sound-info">
        <span class="sound-icon">${sound.svg}</span>
        <span class="sound-name">${sound.name}</span>
      </div>
      <div class="sound-status"></div>
    </div>
  `).join('');
  
  const tabs = soundPanel.querySelectorAll('.tab-btn');
  const panels = soundPanel.querySelectorAll('.sound-content');
  
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const targetId = tab.dataset.tab === 'music' ? 'musicPanel' : 'ambientPanel';
        panels.forEach(p => {
          if (p.id === targetId) {
              p.classList.remove('hidden');
              p.classList.add('active');
          } else {
              p.classList.add('hidden');
              p.classList.remove('active');
          }
        });
      });
    });
  }

  const musicIdInput = document.getElementById('musicIdInput');
  const loadMusicBtn = document.getElementById('loadMusicBtn');
  const musicHelpBtn = document.getElementById('musicHelpBtn');
  const musicSettingsBtn = document.getElementById('musicSettingsBtn');
  const saveMusicSettingsBtn = document.getElementById('saveMusicSettingsBtn');
  
  if (musicIdInput && loadMusicBtn) {
      const savedId = localStorage.getItem('startpage.musicId');
      if (savedId) {
          musicIdInput.value = savedId;
          setTimeout(() => loadNeteaseMusic(savedId), 1000);
      }
      
      loadMusicBtn.addEventListener('click', () => {
          let inputVal = musicIdInput.value.trim();
          
          if (inputVal.includes('music.163.com')) {
              const match = inputVal.match(/id=(\d+)/);
              if (match && match[1]) {
                  inputVal = match[1];
                  musicIdInput.value = inputVal;
                  showToast('已自动提取歌单ID');
              }
          }
          
          if (inputVal && /^\d+$/.test(inputVal)) {
              loadNeteaseMusic(inputVal);
          } else if (inputVal === 'test') {
              loadNeteaseMusic('test');
          } else {
              showToast('请输入有效的歌单ID或链接');
          }
      });

      if (musicHelpBtn) {
          musicHelpBtn.addEventListener('click', () => {
              alert('如何获取歌单ID：\n\n1. 打开网易云音乐官网或客户端\n2. 进入你喜欢的歌单\n3. 复制链接 (例如: .../playlist?id=123456)\n4. 直接粘贴链接到输入框，点击加载即可\n\n提示：也可以直接输入 id 数字');
          });
      }
      
      if (musicSettingsBtn) {
          musicSettingsBtn.addEventListener('click', () => {
              const dialog = document.getElementById('musicSettingsDialog');
              const apiInput = document.getElementById('customMusicApiInput');
              const cookieInput = document.getElementById('musicCookieInput');
              
              apiInput.value = localStorage.getItem('startpage.musicApi') || '';
              cookieInput.value = localStorage.getItem('startpage.musicCookie') || '';
              
              dialog.showModal();
          });
      }
      
      if (saveMusicSettingsBtn) {
          saveMusicSettingsBtn.addEventListener('click', () => {
              const apiInput = document.getElementById('customMusicApiInput');
              const cookieInput = document.getElementById('musicCookieInput');
              
              const api = apiInput.value.trim();
              const cookie = cookieInput.value.trim();
              
              if (api) {
                  localStorage.setItem('startpage.musicApi', api);
              } else {
                  localStorage.removeItem('startpage.musicApi');
              }
              
              if (cookie) {
                  localStorage.setItem('startpage.musicCookie', cookie);
              } else {
                  localStorage.removeItem('startpage.musicCookie');
              }
              
              showToast('音乐设置已保存');
              document.getElementById('musicSettingsDialog').close();
              
              if (musicIdInput.value) {
                  if (confirm('设置已更新，是否重新加载歌单？')) {
                      loadNeteaseMusic(musicIdInput.value);
                  }
              }
          });
      }
  }
  
  soundBtn.addEventListener('click', () => {
    soundPanel.classList.toggle('hidden');
  });
  
  if (closeSoundBtn) {
    closeSoundBtn.addEventListener('click', () => {
      soundPanel.classList.add('hidden');
    });
  }
  
  soundList.querySelectorAll('.sound-item').forEach(item => {
    item.addEventListener('click', () => {
      const soundId = item.dataset.soundId;
      toggleSound(soundId);
    });
  });
  
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const volume = e.target.value;
      volumeValue.textContent = `${volume}%`;
      if (currentAudio) {
        currentAudio.volume = volume / 100;
      }
      localStorage.setItem('startpage.soundVolume', volume);
    });
    
    const savedVolume = localStorage.getItem('startpage.soundVolume') || '50';
    volumeSlider.value = savedVolume;
    volumeValue.textContent = `${savedVolume}%`;
  }
  
  document.addEventListener('click', (e) => {
    const panelSoundBtn = $('#panelSoundBtn');
    const isClickInsidePanel = soundPanel && soundPanel.contains(e.target);
    const isClickOnSoundBtn = soundBtn && soundBtn.contains(e.target);
    const isClickOnPanelBtn = panelSoundBtn && panelSoundBtn.contains(e.target);
    
    if (!isClickInsidePanel && !isClickOnSoundBtn && !isClickOnPanelBtn) {
      soundPanel.classList.add('hidden');
    }
  });

  const fpPrev = document.getElementById('fpPrevBtn');
  const fpPlay = document.getElementById('fpPlayBtn');
  const fpNext = document.getElementById('fpNextBtn');
  const fpList = document.getElementById('fpListBtn');
  
  if (fpPrev) fpPrev.addEventListener('click', previousMusic);
  if (fpPlay) fpPlay.addEventListener('click', toggleMusicPlay);
  if (fpNext) fpNext.addEventListener('click', nextMusic);
  if (fpList) fpList.addEventListener('click', (e) => {
      e.stopPropagation();
      soundPanel.classList.remove('hidden');
      const musicTab = document.querySelector('[data-tab="music"]');
      if (musicTab) musicTab.click();
  });
}

async function fetchNeteaseMusicList(id) {
    try {
        const customApi = localStorage.getItem('startpage.musicApi');
        const customCookie = localStorage.getItem('startpage.musicCookie');
        
        const playlist = await fetchMusicPlaylist(id, customApi, customCookie);
        
        if (playlist.length === 0) {
             // If empty, it might be due to error caught inside fetchMusicPlaylist or actually empty
             // We can try to show a toast if we want, but the UI handles empty list
        }
        return playlist;
    } catch (error) {
        console.error('Fetch music list error:', error);
        return [];
    }
}

// Removed fetchNeteaseMusicListBackup as it is now integrated into api.js

export async function loadNeteaseMusic(id) {
    const container = document.getElementById('musicPlayerContainer');
    if (!container) return;
    
    if (!id) {
        container.innerHTML = '<div class="music-placeholder"><p>请输入歌单ID并加载</p><small>提示: 网页版歌单URL中的 id 参数<br>例如: https://music.163.com/#/playlist?id=7452421</small></div>';
        return;
    }
    
    if (id === 'test') {
        const testPlaylist = [
            { id: 1, name: '测试歌曲 1', artist: '测试艺术家', album: '测试专辑', duration: 180000, url: 'https://music.163.com/song/media/outer/url?id=1' },
            { id: 2, name: '测试歌曲 2', artist: '测试艺术家', album: '测试专辑', duration: 200000, url: 'https://music.163.com/song/media/outer/url?id=2' },
            { id: 3, name: '测试歌曲 3', artist: '测试艺术家', album: '测试专辑', duration: 220000, url: 'https://music.163.com/song/media/outer/url?id=3' }
        ];
        musicState.playlist = testPlaylist;
        musicState.currentIndex = 0;
        musicState.isPlaying = false;
        renderMusicPlayer(container);
        showToast('✅ 已加载测试歌单（3首歌曲）');
        const fp = document.getElementById('floatingPlayer');
        if (fp) fp.classList.remove('hidden');
        return;
    }
    
    container.innerHTML = '<div class="music-placeholder"><p>⏳ 正在加载歌单...</p><small>这可能需要几秒钟</small></div>';
    
    try {
        const playlist = await fetchNeteaseMusicList(id);
        
        if (playlist.length === 0) {
            container.innerHTML = `
                <div class="music-placeholder">
                    <p>❌ 加载歌单失败</p>
                    <small>
                        可能原因：<br>
                        1. 歌单ID不正确<br>
                        2. 歌单受版权保护<br>
                        3. 网络连接问题<br><br>
                        💡 提示：输入 "test" 可以加载测试数据
                    </small>
                </div>
            `;
            return;
        }
        
        musicState.playlist = playlist;
        musicState.currentIndex = 0;
        musicState.isPlaying = false;
        
        renderMusicPlayer(container);
        
        localStorage.setItem('startpage.musicId', id);
        showToast(` 已加载 ${playlist.length} 首歌曲`);

        const fp = document.getElementById('floatingPlayer');
        if (fp) fp.classList.remove('hidden');
    } catch (error) {
        container.innerHTML = `
            <div class="music-placeholder">
                <p> 加载失败</p>
                <small>${error.message}<br><br>请稍后重试</small>
            </div>
        `;
    }
}

function renderMusicPlayer(container) {
    container.innerHTML = `
        <div class="music-player-ui">
            <div class="music-now-playing">
                <div class="music-cover" style="background:linear-gradient(135deg,#667eea,#764ba2);"></div>
                <div class="music-track-info">
                    <div class="music-track-name" id="musicTrackName">未选择歌曲</div>
                    <div class="music-track-artist" id="musicTrackArtist">-</div>
                </div>
            </div>
            
            <div class="music-progress">
                <input type="range" id="musicProgressBar" min="0" max="100" value="0">
                <div class="music-time-labels">
                    <span id="musicCurrentTime">0:00</span>
                    <span id="musicDuration">0:00</span>
                </div>
            </div>
            
            <div class="music-controls">
                <button id="musicModeBtn" class="music-btn" title="顺序播放">
                    <svg id="iconSequence" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 1l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg id="iconSingle" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;">
                        <path d="M17 1l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <text x="10" y="17" font-size="8" fill="currentColor" font-weight="bold">1</text>
                    </svg>
                    <svg id="iconRandom" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;">
                        <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button id="musicPrevBtn" class="music-btn" title="上一首">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 20L9 12l10-8v16zM5 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button id="musicPlayBtn" class="music-btn music-play-btn" title="播放/暂停">
                    <svg id="musicPlayIcon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg id="musicPauseIcon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="display:none;">
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="14" y="4" width="4" height="16" rx="1"/>
                    </svg>
                </button>
                <button id="musicNextBtn" class="music-btn" title="下一首">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 4l10 8-10 8V4zM19 5v14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
            <div class="music-playlist" id="musicPlaylist">
            </div>
        </div>
    `;
    
    updateMusicDisplay();
    renderMusicPlaylist();
    bindMusicPlayerEvents();
}

function updateMusicDisplay() {
    const track = musicState.playlist[musicState.currentIndex];
    if (!track) return;
    
    const nameEl = document.getElementById('musicTrackName');
    const artistEl = document.getElementById('musicTrackArtist');
    if(nameEl) nameEl.textContent = track.name;
    if(artistEl) artistEl.textContent = track.artist;
    
    const coverEl = document.querySelector('.music-cover');
    if (coverEl) {
        if (track.cover) {
            coverEl.style.background = `url(${track.cover}) center/cover no-repeat`;
        } else {
            coverEl.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
        }
    }

    const fpTitle = document.getElementById('fpTitle');
    const fpArtist = document.getElementById('fpArtist');
    const fpCover = document.querySelector('.fp-cover');
    
    if (fpTitle) fpTitle.textContent = track.name;
    if (fpArtist) fpArtist.textContent = track.artist;
    if (fpCover) {
        if (track.cover) {
            fpCover.style.background = `url(${track.cover}) center/cover no-repeat`;
        } else {
            fpCover.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
        }
    }
}

function renderMusicPlaylist() {
    const container = document.getElementById('musicPlaylist');
    container.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    musicState.playlist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = 'music-list-item' + (index === musicState.currentIndex ? ' active' : '');
        
        const playingIndicator = index === musicState.currentIndex && musicState.isPlaying ? 
            `<div class="playing-indicator">
                <div class="playing-bar"></div>
                <div class="playing-bar"></div>
                <div class="playing-bar"></div>
             </div>` : '';
        
        item.innerHTML = `
            <div class="music-list-item-info">
                <div class="music-list-item-title">${track.name}</div>
                <div class="music-list-item-artist">${track.artist}</div>
            </div>
            ${playingIndicator}
        `;
        
        item.addEventListener('click', () => {
            musicState.currentIndex = index;
            updateMusicDisplay();
            playMusic();
            updateMusicPlaylistUI();
        });
        
        fragment.appendChild(item);
    });
    
    container.appendChild(fragment);
}

function updateMusicPlaylistUI() {
    renderMusicPlaylist();
    
    const activeItem = document.querySelector('.music-list-item.active');
    if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function bindMusicPlayerEvents() {
    const playBtn = document.getElementById('musicPlayBtn');
    const prevBtn = document.getElementById('musicPrevBtn');
    const nextBtn = document.getElementById('musicNextBtn');
    const modeBtn = document.getElementById('musicModeBtn');
    const progressBar = document.getElementById('musicProgressBar');
    
    if (playBtn) playBtn.addEventListener('click', toggleMusicPlay);
    if (prevBtn) prevBtn.addEventListener('click', previousMusic);
    if (nextBtn) nextBtn.addEventListener('click', () => nextMusic(true));
    if (modeBtn) modeBtn.addEventListener('click', togglePlayMode);
    if (progressBar) progressBar.addEventListener('input', seekMusic);
}

function togglePlayMode() {
    const modes = ['sequence', 'single', 'random'];
    const nextIndex = (modes.indexOf(musicState.playMode) + 1) % modes.length;
    musicState.playMode = modes[nextIndex];
    updatePlayModeUI();
    
    const modeNames = {
        'sequence': '顺序播放',
        'single': '单曲循环',
        'random': '随机播放'
    };
    showToast(`已切换到${modeNames[musicState.playMode]}`);
}

function updatePlayModeUI() {
    const btn = document.getElementById('musicModeBtn');
    const iconSequence = document.getElementById('iconSequence');
    const iconSingle = document.getElementById('iconSingle');
    const iconRandom = document.getElementById('iconRandom');
    
    if (!btn) return;
    
    if(iconSequence) iconSequence.style.display = 'none';
    if(iconSingle) iconSingle.style.display = 'none';
    if(iconRandom) iconRandom.style.display = 'none';
    
    switch (musicState.playMode) {
        case 'sequence':
            if(iconSequence) iconSequence.style.display = 'block';
            btn.title = '顺序播放';
            break;
        case 'single':
            if(iconSingle) iconSingle.style.display = 'block';
            btn.title = '单曲循环';
            break;
        case 'random':
            if(iconRandom) iconRandom.style.display = 'block';
            btn.title = '随机播放';
            break;
    }
}

function toggleMusicPlay() {
    if (musicState.isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function playMusic() {
    const track = musicState.playlist[musicState.currentIndex];
    if (!track) return;
    
    if (musicState.audio) {
        if (typeof musicState.audio._index === 'number' && musicState.audio._index === musicState.currentIndex) {
            if (musicState.audio.paused) {
                musicState.audio.play().catch(error => {
                    musicState.audio.load();
                    musicState.audio.play().catch(e => console.error('重试失败:', e));
                });
            }
            return;
        }
        
        musicState.audio.pause();
        musicState.audio = null;
    }
    
    musicState.audio = new Audio(track.url);
    musicState.audio._index = musicState.currentIndex;
    musicState.audio.crossOrigin = 'anonymous';
    
    musicState.audio.addEventListener('play', () => {
        musicState.isPlaying = true;
        updatePlayButtonIcon();
    });
    
    musicState.audio.addEventListener('pause', () => {
        musicState.isPlaying = false;
        updatePlayButtonIcon();
    });
    
    musicState.audio.addEventListener('timeupdate', updateMusicProgress);
    
    musicState.audio.addEventListener('loadedmetadata', () => {
        musicState.duration = musicState.audio.duration;
        document.getElementById('musicDuration').textContent = formatTime(musicState.duration);
    });
    
    musicState.audio.addEventListener('ended', () => nextMusic(false));
    
    musicState.audio.addEventListener('error', (e) => {
        showToast('歌曲加载失败，尝试下一首');
        setTimeout(() => {
            if (musicState.isPlaying) nextMusic();
        }, 1000);
    });
    
    const playPromise = musicState.audio.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            musicState.isPlaying = false;
            updatePlayButtonIcon();
            
            if (error.name === 'NotAllowedError') {
                showToast('需要用户交互才能播放');
            } else {
                showToast('无法播放此歌曲');
            }
        });
    }
}

function pauseMusic() {
    if (musicState.audio) {
        musicState.audio.pause();
        musicState.isPlaying = false;
        updatePlayButtonIcon();
    }
}

function previousMusic() {
    if (musicState.playlist.length === 0) return;
    
    if (musicState.playMode === 'random') {
        let newIndex = musicState.currentIndex;
        while (newIndex === musicState.currentIndex && musicState.playlist.length > 1) {
            newIndex = Math.floor(Math.random() * musicState.playlist.length);
        }
        musicState.currentIndex = newIndex;
    } else {
        musicState.currentIndex = (musicState.currentIndex - 1 + musicState.playlist.length) % musicState.playlist.length;
    }
    
    updateMusicDisplay();
    updateMusicPlaylistUI();
    playMusic();
}

function nextMusic(isManual = false) {
    if (musicState.playlist.length === 0) return;
    
    if (musicState.playMode === 'single' && !isManual) {
        musicState.audio.currentTime = 0;
        musicState.audio.play();
        return;
    }
    
    if (musicState.playMode === 'random') {
        let newIndex = musicState.currentIndex;
        while (newIndex === musicState.currentIndex && musicState.playlist.length > 1) {
            newIndex = Math.floor(Math.random() * musicState.playlist.length);
        }
        musicState.currentIndex = newIndex;
    } else {
        musicState.currentIndex = (musicState.currentIndex + 1) % musicState.playlist.length;
    }
    
    updateMusicDisplay();
    updateMusicPlaylistUI();
    playMusic();
}

function updatePlayButtonIcon() {
    const playIcon = document.getElementById('musicPlayIcon');
    const pauseIcon = document.getElementById('musicPauseIcon');
    
    const fpPlayIcon = document.getElementById('fpPlayIcon');
    const fpPauseIcon = document.getElementById('fpPauseIcon');
    
    if (musicState.isPlaying) {
        if(playIcon) playIcon.style.display = 'none';
        if(pauseIcon) pauseIcon.style.display = 'block';
        if(fpPlayIcon) fpPlayIcon.classList.add('hidden');
        if(fpPauseIcon) fpPauseIcon.classList.remove('hidden');
    } else {
        if(playIcon) playIcon.style.display = 'block';
        if(pauseIcon) pauseIcon.style.display = 'none';
        if(fpPlayIcon) fpPlayIcon.classList.remove('hidden');
        if(fpPauseIcon) fpPauseIcon.classList.add('hidden');
    }
}

function updateMusicProgress() {
    if (!musicState.audio) return;
    
    const current = musicState.audio.currentTime;
    const duration = musicState.audio.duration;
    
    if (!isNaN(duration)) {
        document.getElementById('musicProgressBar').value = (current / duration) * 100;
        document.getElementById('musicCurrentTime').textContent = formatTime(current);
    }
}

function seekMusic(event) {
    if (!musicState.audio) return;
    
    const percent = event.target.value / 100;
    const newTime = percent * musicState.audio.duration;
    musicState.audio.currentTime = newTime;
}

function toggleSound(soundId) {
  const sound = ambientSounds.find(s => s.id === soundId);
  if (!sound) return;
  
  if (currentSoundId === soundId && currentAudio) {
    stopSound();
    return;
  }
  
  if (currentAudio) {
    stopSound();
  }
  
  playSound(sound);
}

function playSound(sound) {
  try {
    currentAudio = new Audio(sound.url);
    currentAudio.loop = true;
    currentAudio.volume = ($('#volumeSlider')?.value || 50) / 100;
    
    currentAudio.play().then(() => {
      currentSoundId = sound.id;
      updateSoundUI();
      showToast(`正在播放: ${sound.name}`, 1500);
    }).catch(error => {
      showToast('播放失败，请重试', 2000);
      currentAudio = null;
      currentSoundId = null;
    });
  } catch (error) {
    showToast('音频加载失败', 2000);
  }
}

function stopSound() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  currentSoundId = null;
  updateSoundUI();
}

function updateSoundUI() {
  document.querySelectorAll('.sound-item').forEach(item => {
    const soundId = item.dataset.soundId;
    if (soundId === currentSoundId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  const soundBtn = $('#soundBtn');
  if (soundBtn) {
    if (currentSoundId) {
      soundBtn.style.color = 'var(--accent)';
    } else {
      soundBtn.style.color = '';
    }
  }
}
