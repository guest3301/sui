// Background Service Worker for ShieldUI
// Handles tab monitoring, doomscore calculation, intervention triggering, and backend sync

const BACKEND_URL = 'http://127.0.0.1:5000';

// Simple API client for module context
const apiClient = {
  isAuthenticated: () => false,
  validateToken: async () => false,
  getSettings: async () => ({ success: false }),
  processOfflineQueue: async () => ({ processed: 0 }),
  logDoomscroll: async (data) => console.log('Log doomscroll:', data),
  logDetection: async (data) => console.log('Log detection:', data)
};
const CHECK_INTERVAL = 30000; // 30 seconds
const RESET_HOUR = 4; // 4am daily reset
const SYNC_INTERVAL = 300000; // 5 minutes

// Track active sessions
let activeSessions = new Map();
let currentTabId = null;
let installTime = null;
let syncTimer = null;

// Initialize on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set installation time - interventions active immediately for MVP
    const now = Date.now();
    await chrome.storage.local.set({ 
      installTime: now,
      learningPhase: false, // Disabled for MVP - interventions active immediately
      settings: getDefaultSettings()
    });
    
    // Open dashboard login/register
    chrome.tabs.create({ url: `${BACKEND_URL}/register` });
  }
  
  // Initialize API client and check authentication
  await initializeExtension();
  
  // Set up daily reset alarm
  chrome.alarms.create('dailyReset', {
    when: getNextResetTime(),
    periodInMinutes: 24 * 60
  });
  
  // Set up weekly summary alarm
  chrome.alarms.create('weeklySummary', {
    when: getNextMonday(),
    periodInMinutes: 7 * 24 * 60
  });
  
  // Set up periodic sync alarm
  chrome.alarms.create('periodicSync', {
    periodInMinutes: 5  // Sync every 5 minutes
  });
});

// Initialize extension and sync with backend
async function initializeExtension() {
  // Check if authenticated
  if (apiClient.isAuthenticated()) {
    const valid = await apiClient.validateToken();
    
    if (valid) {
      console.log('ShieldUI: Authenticated successfully');
      await syncSettings();
      await processOfflineQueue();
      startPeriodicSync();
    } else {
      console.log('ShieldUI: Authentication invalid, please login');
      // Could show notification to login
    }
  } else {
    console.log('ShieldUI: Not authenticated');
  }
}

// Sync settings from backend
async function syncSettings() {
  const result = await apiClient.getSettings();
  
  if (result.success) {
    const backendSettings = result.data.settings;
    
    // Convert backend settings to extension format
    const extensionSettings = {
      categories: {
        news: { 
          timeLimit: Math.round(backendSettings.doomscroll_time_threshold / 60), 
          sensitivity: backendSettings.intervention_style 
        },
        social: { 
          timeLimit: Math.round(backendSettings.doomscroll_time_threshold / 60), 
          sensitivity: backendSettings.intervention_style 
        },
        neutral: { timeLimit: 0, sensitivity: 'low' },
        productive: { timeLimit: 0, sensitivity: 'low' }
      },
      calmSites: ['https://www.calm.com', 'https://mynoise.net'],
      blockedTimes: [],
      interventionSensitivity: backendSettings.intervention_style,
      enableNotifications: true,
      darkPatternSensitivity: backendSettings.dark_pattern_sensitivity
    };
    
    await chrome.storage.local.set({ settings: extensionSettings });
    console.log('Settings synced from backend');
  }
}

// Process offline queue
async function processOfflineQueue() {
  const result = await apiClient.processOfflineQueue();
  if (result.processed > 0) {
    console.log(`Processed ${result.processed} offline requests: ${result.succeeded} succeeded, ${result.failed} failed`);
  }
}

// Start periodic sync
function startPeriodicSync() {
  if (syncTimer) clearInterval(syncTimer);
  
  syncTimer = setInterval(async () => {
    if (apiClient.isAuthenticated()) {
      await syncSettings();
      await processOfflineQueue();
    }
  }, SYNC_INTERVAL);
}

// Get default settings
function getDefaultSettings() {
  return {
    categories: {
      news: { timeLimit: 30, sensitivity: 'medium' },
      social: { timeLimit: 60, sensitivity: 'medium' },
      neutral: { timeLimit: 0, sensitivity: 'low' },
      productive: { timeLimit: 0, sensitivity: 'low' }
    },
    calmSites: ['https://www.calm.com', 'https://mynoise.net'],
    blockedTimes: [],
    interventionSensitivity: 'medium',
    enableNotifications: true
  };
}

// Calculate next 4am reset time
function getNextResetTime() {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(RESET_HOUR, 0, 0, 0);
  
  if (now.getHours() >= RESET_HOUR) {
    reset.setDate(reset.getDate() + 1);
  }
  
  return reset.getTime();
}

// Calculate next Monday 9am
function getNextMonday() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() + ((8 - now.getDay()) % 7));
  monday.setHours(9, 0, 0, 0);
  return monday.getTime();
}

// Listen to tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  currentTabId = activeInfo.tabId;
  
  // Get tab details
  const tab = await chrome.tabs.get(currentTabId);
  handleTabChange(tab);
});

// Listen to tab updates (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId === currentTabId && changeInfo.url) {
    handleTabChange(tab);
  }
});

// Handle tab change
async function handleTabChange(tab) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return;
  }
  
  const url = new URL(tab.url);
  const domain = url.hostname;
  
  // End previous session
  if (activeSessions.size > 0) {
    for (let [sessionDomain, session] of activeSessions) {
      if (sessionDomain !== domain) {
        await endSession(sessionDomain, session);
      }
    }
  }
  
  // Start new session
  if (!activeSessions.has(domain)) {
    activeSessions.set(domain, {
      startTime: Date.now(),
      domain: domain,
      url: tab.url,
      tabId: tab.id,
      scrollEvents: [],
      contentSamples: [],
      doomscore: 0,
      timeSpent: 0
    });
  }
}

// End session and save data
async function endSession(domain, session) {
  session.endTime = Date.now();
  session.timeSpent = session.endTime - session.startTime;
  
  // Calculate final doomscore
  session.doomscore = await calculateDoomscore(session);
  
  // Save to storage
  await saveSessionData(session);
  
  // Remove from active sessions
  activeSessions.delete(domain);
}

// Calculate doomscore
async function calculateDoomscore(session) {
  if (!session.contentSamples || session.contentSamples.length === 0) {
    return 0;
  }
  
  // Time factor (0-1): More time = higher score
  const timeMinutes = session.timeSpent / 60000;
  const timeFactor = Math.min(timeMinutes / 30, 1); // Caps at 30 minutes
  
  // Negativity score (0-1): Average from sentiment analysis
  const negativityScores = await Promise.all(
    session.contentSamples.map(sample => analyzeSentiment(sample))
  );
  const avgNegativity = negativityScores.length > 0 
    ? negativityScores.reduce((a, b) => a + b, 0) / negativityScores.length 
    : 0;
  
  // Compulsion factor (0-1): Based on scroll behavior
  const compulsionFactor = calculateCompulsionFactor(session.scrollEvents);
  
  // Combined doomscore (0-100)
  const doomscore = (
    (timeFactor * 0.4) + 
    (avgNegativity * 0.3) + 
    (compulsionFactor * 0.3)
  ) * 100;
  
  return Math.round(doomscore);
}

// Calculate compulsion factor from scroll patterns
function calculateCompulsionFactor(scrollEvents) {
  if (!scrollEvents || scrollEvents.length < 5) {
    return 0;
  }
  
  // Rapid scrolling with little pause indicates compulsion
  let rapidScrolls = 0;
  let totalVelocity = 0;
  
  for (let i = 1; i < scrollEvents.length; i++) {
    const timeDiff = scrollEvents[i].timestamp - scrollEvents[i - 1].timestamp;
    const scrollDiff = Math.abs(scrollEvents[i].position - scrollEvents[i - 1].position);
    
    if (timeDiff > 0) {
      const velocity = scrollDiff / timeDiff;
      totalVelocity += velocity;
      
      if (velocity > 2) { // High velocity threshold
        rapidScrolls++;
      }
    }
  }
  
  const avgVelocity = totalVelocity / scrollEvents.length;
  const rapidScrollRatio = rapidScrolls / scrollEvents.length;
  
  return Math.min((avgVelocity * 0.3 + rapidScrollRatio * 0.7), 1);
}

// Analyze sentiment via Flask backend
async function analyzeSentiment(text) {
  try {
    const response = await fetch(`${BACKEND_URL}/analyze_sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.negativity_score || 0;
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return 0;
  }
}

// Save session data
async function saveSessionData(session) {
  try {
    // Save to local storage
    const { sessions = [] } = await chrome.storage.local.get('sessions');
    sessions.push({
      timestamp: session.startTime,
      domain: session.domain,
      duration: session.timeSpent,
      doomscore: session.doomscore
    });
    
    // Keep only last 1000 sessions
    if (sessions.length > 1000) {
      sessions.shift();
    }
    
    await chrome.storage.local.set({ sessions });
    
    // Sync to backend if authenticated
    if (apiClient.isAuthenticated()) {
      await apiClient.logDoomscroll({
        url: session.url,
        scroll_duration: Math.round(session.timeSpent / 1000),  // Convert to seconds
        intervention_triggered: session.lastInterventionLevel > 0,
        user_response: session.userResponse || ''
      });
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scrollEvent') {
    handleScrollEvent(sender.tab, message.data);
  } else if (message.type === 'contentSample') {
    handleContentSample(sender.tab, message.data);
  } else if (message.type === 'getActiveSession') {
    const session = activeSessions.get(new URL(sender.tab.url).hostname);
    sendResponse({ session });
  } else if (message.type === 'triggerIntervention') {
    triggerIntervention(sender.tab, message.level);
  } else if (message.type === 'userOverride') {
    handleUserOverride(sender.tab, message.reason);
  } else if (message.type === 'darkPatternDetected') {
    handleDarkPatternDetected(message.data);
  }
  
  return true; // Keep channel open for async response
});

// Handle scroll event from content script
function handleScrollEvent(tab, scrollData) {
  const domain = new URL(tab.url).hostname;
  const session = activeSessions.get(domain);
  
  if (session) {
    session.scrollEvents.push({
      timestamp: Date.now(),
      position: scrollData.position,
      velocity: scrollData.velocity,
      depth: scrollData.depth
    });
    
    // Check if intervention needed
    checkInterventionThreshold(tab, session);
  }
}

// Handle content sample from content script
async function handleContentSample(tab, content) {
  const domain = new URL(tab.url).hostname;
  const session = activeSessions.get(domain);
  
  if (session) {
    session.contentSamples.push(content);
    
    // Recalculate doomscore
    session.doomscore = await calculateDoomscore(session);
    
    // Check if intervention needed
    checkInterventionThreshold(tab, session);
  }
}

// Check if intervention threshold reached
async function checkInterventionThreshold(tab, session) {
  const { learningPhase, settings } = await chrome.storage.local.get(['learningPhase', 'settings']);
  
  // Don't intervene during learning phase
  if (learningPhase) {
    return;
  }
  
  const doomscore = session.doomscore;
  
  // Adjust thresholds based on sensitivity
  const sensitivityMultipliers = { low: 1.2, medium: 1.0, high: 0.8 };
  const multiplier = sensitivityMultipliers[settings?.interventionSensitivity || 'medium'];
  
  let level = 0;
  if (doomscore >= 30 * multiplier && doomscore < 50 * multiplier) {
    level = 1;
  } else if (doomscore >= 50 * multiplier && doomscore < 70 * multiplier) {
    level = 2;
  } else if (doomscore >= 70 * multiplier && doomscore < 85 * multiplier) {
    level = 3;
  } else if (doomscore >= 85 * multiplier) {
    level = 4;
  }
  
  if (level > 0 && level !== session.lastInterventionLevel) {
    session.lastInterventionLevel = level;
    triggerIntervention(tab, level);
    
    // Log intervention
    await logIntervention(level, session.domain);
  }
}

// Trigger intervention
async function triggerIntervention(tab, level) {
  const { settings } = await chrome.storage.local.get('settings');
  
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'intervention',
      level: level,
      calmSites: settings?.calmSites || []
    });
  } catch (error) {
    console.error('Error triggering intervention:', error);
  }
}

// Log intervention
async function logIntervention(level, domain) {
  try {
    const { interventions = [] } = await chrome.storage.local.get('interventions');
    interventions.push({
      timestamp: Date.now(),
      level: level,
      domain: domain,
      accepted: false // Will be updated if user accepts
    });
    
    await chrome.storage.local.set({ interventions });
  } catch (error) {
    console.error('Error logging intervention:', error);
  }
}

// Handle user override
async function handleUserOverride(tab, reason) {
  const domain = new URL(tab.url).hostname;
  const session = activeSessions.get(domain);
  
  if (session) {
    // Reset doomscore
    session.doomscore = 0;
    session.lastInterventionLevel = 0;
    
    // Log override
    console.log(`User override: ${reason} for ${domain}`);
  }
}

// Handle dark pattern detection
async function handleDarkPatternDetected(data) {
  try {
    const { darkPatterns = [] } = await chrome.storage.local.get('darkPatterns');
    
    darkPatterns.push({
      pattern: data.pattern,
      confidence: data.confidence,
      severity: data.severity,
      domain: data.domain,
      timestamp: data.timestamp
    });
    
    // Keep only last 1000 dark patterns
    if (darkPatterns.length > 1000) {
      darkPatterns.shift();
    }
    
    await chrome.storage.local.set({ darkPatterns });
    
    // Sync to backend if authenticated
    if (apiClient.isAuthenticated()) {
      await apiClient.logDetection({
        url: data.url || `https://${data.domain}`,
        pattern_type: data.pattern,
        confidence_score: data.confidence,
        page_elements: data.elements || []
      });
    }
    
    console.log('Dark pattern logged:', data);
  } catch (error) {
    console.error('Error logging dark pattern:', error);
  }
}

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') {
    await handleDailyReset();
  } else if (alarm.name === 'weeklySummary') {
    await handleWeeklySummary();
  } else if (alarm.name === 'periodicSync') {
    if (apiClient.isAuthenticated()) {
      await syncSettings();
      await processOfflineQueue();
    }
  }
});

// Daily reset at 4am
async function handleDailyReset() {
  // Learning phase disabled for MVP - interventions always active
  // Just reset daily counters (keep historical data)
  console.log('Daily reset completed');
}

// Weekly summary notification
async function handleWeeklySummary() {
  const { enableNotifications } = await chrome.storage.local.get('enableNotifications');
  
  if (enableNotifications) {
    const stats = await getWeeklyStats();
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Weekly DoomScroll Summary',
      message: `Total time: ${stats.totalMinutes}min | Avg doomscore: ${stats.avgDoomscore} | Interventions: ${stats.interventions}`
    });
  }
}

// Get weekly stats
async function getWeeklyStats() {
  const { sessions = [], interventions = [] } = await chrome.storage.local.get(['sessions', 'interventions']);
  
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(s => s.timestamp > weekAgo);
  const recentInterventions = interventions.filter(i => i.timestamp > weekAgo);
  
  const totalMinutes = Math.round(
    recentSessions.reduce((sum, s) => sum + s.duration, 0) / 60000
  );
  
  const avgDoomscore = recentSessions.length > 0
    ? Math.round(recentSessions.reduce((sum, s) => sum + s.doomscore, 0) / recentSessions.length)
    : 0;
  
  return {
    totalMinutes,
    avgDoomscore,
    interventions: recentInterventions.length
  };
}

console.log('ShieldUI background service worker initialized');

// Initialize on startup
initializeExtension();
