let protectionActive = true;

chrome.runtime.onInstalled.addListener(() => {
  console.log('ShieldUI extension installed');
  
  chrome.storage.local.set({
    patternsBlocked: 0,
    timeSaved: 0,
    protectionActive: true
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleProtection') {
    protectionActive = message.enabled;
    
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateProtection',
          enabled: protectionActive
        }).catch(() => {});
      });
    });
  }
  
  if (message.action === 'patternDetected') {
    chrome.storage.local.get(['patternsBlocked'], (result) => {
      const newCount = (result.patternsBlocked || 0) + 1;
      chrome.storage.local.set({ patternsBlocked: newCount });
    });
  }
  
  if (message.action === 'timeSaved') {
    chrome.storage.local.get(['timeSaved'], (result) => {
      const newTime = (result.timeSaved || 0) + message.seconds;
      chrome.storage.local.set({ timeSaved: newTime });
    });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && protectionActive) {
    chrome.tabs.sendMessage(tabId, {
      action: 'startMonitoring'
    }).catch(() => {});
  }
});
