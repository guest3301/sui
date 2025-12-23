// Options/Settings Script for DoomScroll Defender

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if this is onboarding
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('onboarding') === 'true') {
    document.getElementById('onboarding').style.display = 'block';
  }
  
  await loadSettings();
  setupEventListeners();
});

// Load settings from storage
async function loadSettings() {
  try {
    const { settings, classifiedSites = {}, darkPatternSettings = {} } = await chrome.storage.local.get(['settings', 'classifiedSites', 'darkPatternSettings']);
    
    if (settings) {
      // Category limits
      document.getElementById('news-limit').value = settings.categories.news.timeLimit;
      document.getElementById('news-sensitivity').value = settings.categories.news.sensitivity;
      
      document.getElementById('social-limit').value = settings.categories.social.timeLimit;
      document.getElementById('social-sensitivity').value = settings.categories.social.sensitivity;
      
      document.getElementById('neutral-limit').value = settings.categories.neutral.timeLimit;
      document.getElementById('neutral-sensitivity').value = settings.categories.neutral.sensitivity;
      
      document.getElementById('productive-limit').value = settings.categories.productive.timeLimit;
      document.getElementById('productive-sensitivity').value = settings.categories.productive.sensitivity;
      
      // Intervention settings
      document.getElementById('intervention-sensitivity').value = settings.interventionSensitivity;
      document.getElementById('enable-notifications').checked = settings.enableNotifications;
      
      // Calm sites
      renderCalmSites(settings.calmSites);
      
      // Blocked times
      if (settings.blockedTimes) {
        renderBlockSchedules(settings.blockedTimes);
      }
    }
    
    // Dark pattern settings
    if (darkPatternSettings) {
      document.getElementById('enable-dark-pattern-detection').checked = darkPatternSettings.enabled !== false;
      document.getElementById('gemini-api-key').value = darkPatternSettings.geminiApiKey || '';
      document.getElementById('dark-pattern-sensitivity').value = darkPatternSettings.sensitivity || 'medium';
      document.getElementById('show-dark-pattern-warnings').checked = darkPatternSettings.showWarnings !== false;
    }
    
    // Classified sites
    renderClassifiedSites(classifiedSites);
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('add-calm-site-btn').addEventListener('click', addCalmSite);
  document.getElementById('add-site-btn').addEventListener('click', addClassifiedSite);
  document.getElementById('add-block-schedule-btn').addEventListener('click', addBlockSchedule);
  document.getElementById('reset-data-btn').addEventListener('click', resetData);
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      categories: {
        news: {
          timeLimit: parseInt(document.getElementById('news-limit').value) || 30,
          sensitivity: document.getElementById('news-sensitivity').value
        },
        social: {
          timeLimit: parseInt(document.getElementById('social-limit').value) || 60,
          sensitivity: document.getElementById('social-sensitivity').value
        },
        neutral: {
          timeLimit: parseInt(document.getElementById('neutral-limit').value) || 0,
          sensitivity: document.getElementById('neutral-sensitivity').value
        },
        productive: {
          timeLimit: parseInt(document.getElementById('productive-limit').value) || 0,
          sensitivity: document.getElementById('productive-sensitivity').value
        }
      },
      interventionSensitivity: document.getElementById('intervention-sensitivity').value,
      enableNotifications: document.getElementById('enable-notifications').checked,
      calmSites: getCalmSitesFromDOM(),
      blockedTimes: getBlockSchedulesFromDOM()
    };
    
    const darkPatternSettings = {
      enabled: document.getElementById('enable-dark-pattern-detection').checked,
      geminiApiKey: document.getElementById('gemini-api-key').value.trim(),
      sensitivity: document.getElementById('dark-pattern-sensitivity').value,
      showWarnings: document.getElementById('show-dark-pattern-warnings').checked
    };
    
    await chrome.storage.local.set({ settings, darkPatternSettings });
    
    // Show notification
    showSaveNotification();
    
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

// Add calm site
function addCalmSite() {
  const input = document.getElementById('calm-site-input');
  const url = input.value.trim();
  
  if (!url) {
    return;
  }
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    alert('Please enter a valid URL');
    return;
  }
  
  const { settings } = chrome.storage.local.get('settings');
  
  // Get current calm sites from DOM
  const calmSites = getCalmSitesFromDOM();
  
  if (!calmSites.includes(url)) {
    calmSites.push(url);
    renderCalmSites(calmSites);
  }
  
  input.value = '';
}

// Render calm sites list
function renderCalmSites(sites) {
  const container = document.getElementById('calm-sites-list');
  
  if (!sites || sites.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #a0aec0;">No calm sites added yet</div>';
    return;
  }
  
  container.innerHTML = sites.map((site, index) => `
    <div class="list-item">
      <span class="list-item-text">${site}</span>
      <button class="btn-remove" onclick="removeCalmSite(${index})">Remove</button>
    </div>
  `).join('');
}

// Get calm sites from DOM
function getCalmSitesFromDOM() {
  const container = document.getElementById('calm-sites-list');
  const items = container.querySelectorAll('.list-item-text');
  return Array.from(items).map(item => item.textContent);
}

// Remove calm site
window.removeCalmSite = function(index) {
  const calmSites = getCalmSitesFromDOM();
  calmSites.splice(index, 1);
  renderCalmSites(calmSites);
};

// Add classified site
function addClassifiedSite() {
  const domain = document.getElementById('site-domain').value.trim();
  const category = document.getElementById('site-category').value;
  
  if (!domain) {
    return;
  }
  
  chrome.storage.local.get('classifiedSites', (result) => {
    const classifiedSites = result.classifiedSites || {};
    classifiedSites[domain] = category;
    
    chrome.storage.local.set({ classifiedSites }, () => {
      renderClassifiedSites(classifiedSites);
      document.getElementById('site-domain').value = '';
    });
  });
}

// Render classified sites
function renderClassifiedSites(sites) {
  const container = document.getElementById('classified-sites');
  
  if (!sites || Object.keys(sites).length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #a0aec0;">No sites classified yet</div>';
    return;
  }
  
  const categoryEmojis = {
    news: '📰',
    social: '👥',
    neutral: '🌐',
    productive: '✅'
  };
  
  container.innerHTML = Object.entries(sites).map(([domain, category]) => `
    <div class="list-item">
      <span class="list-item-text">${categoryEmojis[category]} ${domain} - ${category}</span>
      <button class="btn-remove" onclick="removeClassifiedSite('${domain}')">Remove</button>
    </div>
  `).join('');
}

// Remove classified site
window.removeClassifiedSite = function(domain) {
  chrome.storage.local.get('classifiedSites', (result) => {
    const classifiedSites = result.classifiedSites || {};
    delete classifiedSites[domain];
    
    chrome.storage.local.set({ classifiedSites }, () => {
      renderClassifiedSites(classifiedSites);
    });
  });
};

// Add block schedule
function addBlockSchedule() {
  const start = document.getElementById('block-start').value;
  const end = document.getElementById('block-end').value;
  const categories = Array.from(document.getElementById('block-categories').selectedOptions)
    .map(opt => opt.value);
  
  if (!start || !end || categories.length === 0) {
    alert('Please fill in all fields');
    return;
  }
  
  const schedules = getBlockSchedulesFromDOM();
  schedules.push({ start, end, categories });
  renderBlockSchedules(schedules);
  
  // Clear inputs
  document.getElementById('block-start').value = '';
  document.getElementById('block-end').value = '';
  document.getElementById('block-categories').selectedIndex = -1;
}

// Render block schedules
function renderBlockSchedules(schedules) {
  const container = document.getElementById('block-schedules-list');
  
  if (!schedules || schedules.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; color: #a0aec0;">No schedules configured</div>';
    return;
  }
  
  container.innerHTML = schedules.map((schedule, index) => `
    <div class="list-item">
      <span class="list-item-text">
        ${schedule.start} - ${schedule.end}: Block ${schedule.categories.join(', ')}
      </span>
      <button class="btn-remove" onclick="removeBlockSchedule(${index})">Remove</button>
    </div>
  `).join('');
}

// Get block schedules from DOM
function getBlockSchedulesFromDOM() {
  const container = document.getElementById('block-schedules-list');
  const items = container.querySelectorAll('.list-item-text');
  
  return Array.from(items).map(item => {
    const text = item.textContent.trim();
    const match = text.match(/(\d{2}:\d{2}) - (\d{2}:\d{2}): Block (.+)/);
    
    if (match) {
      return {
        start: match[1],
        end: match[2],
        categories: match[3].split(', ')
      };
    }
    return null;
  }).filter(Boolean);
}

// Remove block schedule
window.removeBlockSchedule = function(index) {
  const schedules = getBlockSchedulesFromDOM();
  schedules.splice(index, 1);
  renderBlockSchedules(schedules);
};

// Reset data
async function resetData() {
  const confirmed = confirm(
    'Are you sure you want to reset all data?\n\n' +
    'This will delete:\n' +
    '- All session history\n' +
    '- Intervention logs\n' +
    '- Mood tracking data\n\n' +
    'Your settings will be preserved.'
  );
  
  if (!confirmed) {
    return;
  }
  
  try {
    // Clear data but keep settings
    const { settings } = await chrome.storage.local.get('settings');
    
    await chrome.storage.local.clear();
    await chrome.storage.local.set({ settings });
    
    alert('Data has been reset successfully!');
  } catch (error) {
    console.error('Error resetting data:', error);
    alert('Error resetting data. Please try again.');
  }
}

// Show save notification
function showSaveNotification() {
  const notification = document.getElementById('save-notification');
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
}
