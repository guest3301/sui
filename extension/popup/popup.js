let isProtectionActive = true;
let backendUrl = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', async () => {
  backendUrl = await getBackendUrl();
  await loadStats();
  setupEventListeners();
});

async function loadStats() {
  try {
    const result = await chrome.storage.local.get(['patternsBlocked', 'timeSaved', 'protectionActive']);
    
    const patternsBlocked = result.patternsBlocked || 0;
    const timeSaved = result.timeSaved || 0;
    isProtectionActive = result.protectionActive !== false;
    
    document.getElementById('patternsBlocked').textContent = patternsBlocked;
    document.getElementById('timeSaved').textContent = formatTime(timeSaved);
    
    updateStatusDisplay();
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function updateStatusDisplay() {
  const statusDiv = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleProtection');
  
  if (isProtectionActive) {
    statusDiv.className = 'status active';
    statusDiv.innerHTML = '<span class="status-dot"></span><span>Protection Active</span>';
    toggleBtn.textContent = 'Pause Protection';
    toggleBtn.className = 'btn-secondary';
  } else {
    statusDiv.className = 'status inactive';
    statusDiv.innerHTML = '<span class="status-dot"></span><span>Protection Paused</span>';
    toggleBtn.textContent = 'Resume Protection';
    toggleBtn.className = 'btn-primary';
  }
}

function setupEventListeners() {
  document.getElementById('openDashboard').addEventListener('click', async () => {
    const url = await getBackendUrl();
    chrome.tabs.create({ url: url });
  });
  
  document.getElementById('toggleProtection').addEventListener('click', async () => {
    isProtectionActive = !isProtectionActive;
    
    await chrome.storage.local.set({ protectionActive: isProtectionActive });
    
    chrome.runtime.sendMessage({
      action: 'toggleProtection',
      enabled: isProtectionActive
    });
    
    updateStatusDisplay();
  });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.patternsBlocked) {
      document.getElementById('patternsBlocked').textContent = changes.patternsBlocked.newValue || 0;
    }
    if (changes.timeSaved) {
      document.getElementById('timeSaved').textContent = formatTime(changes.timeSaved.newValue || 0);
    }
    if (changes.backendUrl) {
      backendUrl = changes.backendUrl.newValue;
    }
  }
});
