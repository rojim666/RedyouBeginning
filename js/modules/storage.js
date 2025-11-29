
const DB_NAME = 'StartPageDB';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

let db = null;
let backgroundCache = null;
let backgroundCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

export function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('IndexedDB打开失败:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB已就绪');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('type', 'type', { unique: false });
                console.log('IndexedDB对象仓库已创建');
            }
        };
    });
}

export function getDB() {
    return db;
}

export function saveBackgroundToDB(bgData, bgType) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('IndexedDB未初始化'));
            return;
        }
        
        clearBackgroundCache();
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        const data = {
            id: 'current_background',
            data: bgData,
            type: bgType,
            timestamp: Date.now()
        };
        
        const request = objectStore.put(data);
        
        request.onsuccess = () => {
            console.log('背景已保存到IndexedDB');
            resolve();
        };
        
        request.onerror = () => {
            console.error('保存到IndexedDB失败:', request.error);
            reject(request.error);
        };
    });
}

export function loadBackgroundFromDB() {
    return new Promise((resolve, reject) => {
        const now = Date.now();
        if (backgroundCache && (now - backgroundCacheTime) < CACHE_DURATION) {
            console.log('使用缓存的背景数据');
            resolve(backgroundCache);
            return;
        }
        
        if (!db) {
            reject(new Error('IndexedDB未初始化'));
            return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get('current_background');
        
        request.onsuccess = () => {
            if (request.result) {
                backgroundCache = request.result;
                backgroundCacheTime = now;
                console.log('从IndexedDB加载背景成功并缓存');
                resolve(request.result);
            } else {
                resolve(null);
            }
        };
        
        request.onerror = () => {
            console.error('从IndexedDB加载失败:', request.error);
            reject(request.error);
        };
    });
}

export function clearBackgroundCache() {
    backgroundCache = null;
    backgroundCacheTime = 0;
}

export function deleteBackgroundFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('IndexedDB未初始化'));
            return;
        }
        
        clearBackgroundCache();
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete('current_background');
        
        request.onsuccess = () => {
            console.log('IndexedDB中的背景已删除');
            resolve();
        };
        
        request.onerror = () => {
            console.error('删除IndexedDB数据失败:', request.error);
            reject(request.error);
        };
    });
}
