const CONFIG = {
  BACKEND_URL: typeof chrome !== 'undefined' && chrome.storage 
    ? null 
    : 'http://localhost:5000',
  
  DEFAULT_BACKEND_URL: 'http://localhost:5000'
};

async function getBackendUrl() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(['backendUrl']);
      return result.backendUrl || CONFIG.DEFAULT_BACKEND_URL;
    } catch (error) {
      console.error('Error getting backend URL:', error);
      return CONFIG.DEFAULT_BACKEND_URL;
    }
  }
  return CONFIG.BACKEND_URL || CONFIG.DEFAULT_BACKEND_URL;
}

async function setBackendUrl(url) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.set({ backendUrl: url });
  }
}
