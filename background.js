/**
 * Service Worker for 红柚起始页 Extension
 * 处理扩展生命周期事件
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 扩展首次安装时打开新标签页
    chrome.tabs.create({ url: 'chrome://newtab/' });
  } else if (details.reason === 'update') {
    // 扩展更新时的处理（可选）
    console.log('红柚起始页 已更新到 v1.0.0');
  }
});

// 监听来自内容脚本的消息（可选，预留给未来功能）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStorageData') {
    chrome.storage.local.get(request.key, (data) => {
      sendResponse(data);
    });
    return true; // 保持消息通道打开，用于异步响应
  }
});
