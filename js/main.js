import { initIndexedDB } from './modules/storage.js';
import { initSearch } from './modules/search.js';
import { initBookmarks } from './modules/bookmarks.js';
import { initLinks } from './modules/links.js';
import { initWeather } from './modules/weather.js';
import { initBackground, loadSavedBackground } from './modules/background.js';
import { initSoundPanel } from './modules/music.js';
import { initFocusMode } from './modules/focus.js';
import { initSettings, updateClock, updateGreeting, loadQuote } from './modules/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initIndexedDB();
    initSearch();
    initLinks();
    initBookmarks();
    initWeather();
    initBackground();
    initSoundPanel();
    initFocusMode();
    initSettings();
    updateClock();
    updateGreeting();
    loadQuote();
    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60000 * 30);
    loadSavedBackground();
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }, 500);
    }
  } catch (error) {
    console.error('Init Error:', error);
  }
});
