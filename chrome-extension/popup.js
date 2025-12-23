// Popup Script for ShieldUI Dashboard

// Load API client
const script = document.createElement('script');
script.src = 'api-client.js';
document.head.appendChild(script);

const BACKEND_URL = 'http://127.0.0.1:5000';

// State
let currentTab = null;
let timerPaused = false;
let isAuthenticated = false;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthentication();
  
  if (isAuthenticated) {
    await loadDashboardData();
    setupEventListeners();
    startRealtimeUpdates();
  } else {
    showLoginPrompt();
  }
});

// Check authentication status
async function checkAuthentication() {
  // Wait for API client to load
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (typeof apiClient === 'undefined') {
    console.error('API client not loaded');
    return;
  }
  
  isAuthenticated = apiClient.isAuthenticated();
  
  if (isAuthenticated) {
    const valid = await apiClient.validateToken();
    if (!valid) {
      isAuthenticated = false;
      await apiClient.clearToken();
    }
  }
}

// Show login prompt
function showLoginPrompt() {
  document.body.innerHTML = `
    <div style="padding: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 15px;">🛡️</div>
      <h2 style="margin-bottom: 10px; color: #2d3748;">Welcome to ShieldUI</h2>
      <p style="color: #718096; margin-bottom: 25px;">
        Please login to sync your protection settings and view analytics
      </p>
      <button id="login-btn" class="btn-primary" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-bottom: 10px;">
        Open Dashboard & Login
      </button>
      <p style="font-size: 12px; color: #a0aec0; margin-top: 15px;">
        Protection works offline, but login enables cloud sync
      </p>
    </div>
  `;
  
  document.getElementById('login-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${BACKEND_URL}/login` });
    window.close();
  });
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    // Load data in parallel
    await Promise.all([
      updateDoomscore(),
      updateTimeStats(),
      updateTopSources(),
      updateDarkPatternStats(),
      updateMoodHistory(),
      updateInterventionsCount(),
      checkLearningPhase()
    ]);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Update doomscore display
async function updateDoomscore() {
  try {
    // Get active session from background
    const response = await chrome.runtime.sendMessage({ type: 'getActiveSession' });
    
    let doomscore = 0;
    if (response?.session) {
      doomscore = response.session.doomscore || 0;
    }
    
    // Update circle
    const circle = document.getElementById('doomscore-progress');
    const value = document.getElementById('doomscore-value');
    const status = document.getElementById('doomscore-status');
    
    // Calculate circle progress (circumference = 2πr = 565.48)
    const circumference = 565.48;
    const offset = circumference - (doomscore / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    // Update color based on score
    if (doomscore < 30) {
      circle.style.stroke = '#48bb78'; // Green
      status.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Healthy browsing</span>';
    } else if (doomscore < 50) {
      circle.style.stroke = '#ecc94b'; // Yellow
      status.innerHTML = '<span class="status-icon">⚠️</span><span class="status-text">Watch your time</span>';
    } else if (doomscore < 70) {
      circle.style.stroke = '#f6ad55'; // Orange
      status.innerHTML = '<span class="status-icon">⚠️</span><span class="status-text">Consider a break</span>';
    } else {
      circle.style.stroke = '#f56565'; // Red
      status.innerHTML = '<span class="status-icon">🛑</span><span class="status-text">Time to stop</span>';
    }
    
    // Animate value
    animateValue(value, 0, doomscore, 500);
  } catch (error) {
    console.error('Error updating doomscore:', error);
  }
}

// Animate number counting up
function animateValue(element, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.floor(start + range * progress);
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Update time statistics
async function updateTimeStats() {
  try {
    const { sessions = [] } = await chrome.storage.local.get('sessions');
    
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    // Calculate today's time
    const todaySessions = sessions.filter(s => s.timestamp >= todayStart.getTime());
    const todayMinutes = Math.round(
      todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60000
    );
    
    // Calculate week's time
    const weekSessions = sessions.filter(s => s.timestamp >= weekStart.getTime());
    const weekMinutes = Math.round(
      weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60000
    );
    
    document.getElementById('today-time').textContent = `${todayMinutes}min`;
    document.getElementById('week-time').textContent = `${weekMinutes}min`;
    
    // Update chart
    updateTimeChart(sessions);
  } catch (error) {
    console.error('Error updating time stats:', error);
  }
}

// Update time chart
function updateTimeChart(sessions) {
  const canvas = document.getElementById('timeChart');
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Get last 7 days data
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const daySessions = sessions.filter(s => 
      s.timestamp >= date.getTime() && s.timestamp < nextDate.getTime()
    );
    
    const minutes = Math.round(
      daySessions.reduce((sum, s) => sum + s.duration, 0) / 60000
    );
    
    days.push({
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      value: minutes
    });
  }
  
  // Draw simple bar chart
  const barWidth = 35;
  const barGap = 8;
  const maxValue = Math.max(...days.map(d => d.value), 60); // Minimum scale of 60
  const scale = 100 / maxValue;
  
  ctx.fillStyle = '#667eea';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  
  days.forEach((day, i) => {
    const x = 10 + i * (barWidth + barGap);
    const height = day.value * scale;
    const y = 120 - height;
    
    // Draw bar
    ctx.fillStyle = '#667eea';
    ctx.fillRect(x, y, barWidth, height);
    
    // Draw label
    ctx.fillStyle = '#4a5568';
    ctx.fillText(day.label, x + barWidth / 2, 140);
    
    // Draw value if significant
    if (day.value > 0) {
      ctx.fillText(day.value.toString(), x + barWidth / 2, y - 5);
    }
  });
}

// Update top doom sources
async function updateTopSources() {
  try {
    const { sessions = [] } = await chrome.storage.local.get('sessions');
    
    // Aggregate by domain
    const domainStats = {};
    sessions.forEach(session => {
      if (!domainStats[session.domain]) {
        domainStats[session.domain] = {
          domain: session.domain,
          totalTime: 0,
          avgDoomscore: 0,
          count: 0
        };
      }
      
      domainStats[session.domain].totalTime += session.duration;
      domainStats[session.domain].avgDoomscore += session.doomscore;
      domainStats[session.domain].count++;
    });
    
    // Calculate averages and sort
    const sources = Object.values(domainStats)
      .map(stat => ({
        ...stat,
        avgDoomscore: Math.round(stat.avgDoomscore / stat.count),
        totalMinutes: Math.round(stat.totalTime / 60000)
      }))
      .sort((a, b) => b.avgDoomscore - a.avgDoomscore)
      .slice(0, 5);
    
    // Display
    const container = document.getElementById('doom-sources');
    
    if (sources.length === 0) {
      container.innerHTML = '<div class="empty-state">No data yet. Keep browsing!</div>';
      return;
    }
    
    container.innerHTML = sources.map(source => `
      <div class="source-item">
        <div class="source-info">
          <div class="source-domain">${source.domain}</div>
          <div class="source-stats">${source.totalMinutes}min • Score: ${source.avgDoomscore}</div>
        </div>
        <div class="source-bar">
          <div class="source-bar-fill" style="width: ${source.avgDoomscore}%; background: ${getScoreColor(source.avgDoomscore)}"></div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error updating top sources:', error);
  }
}

// Update dark pattern statistics
async function updateDarkPatternStats() {
  try {
    const { darkPatterns = [] } = await chrome.storage.local.get('darkPatterns');
    
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    // Count patterns
    const todayPatterns = darkPatterns.filter(p => p.timestamp >= todayStart.getTime());
    const weekPatterns = darkPatterns.filter(p => p.timestamp >= weekStart.getTime());
    
    document.getElementById('dark-patterns-today').textContent = todayPatterns.length;
    document.getElementById('dark-patterns-week').textContent = weekPatterns.length;
    
    // Display recent patterns
    const container = document.getElementById('dark-pattern-list');
    
    if (darkPatterns.length === 0) {
      container.innerHTML = '<div class="empty-state">No dark patterns detected yet</div>';
      return;
    }
    
    // Show last 5 patterns
    const recentPatterns = darkPatterns.slice(-5).reverse();
    
    container.innerHTML = recentPatterns.map(pattern => {
      const severityColors = {
        low: '#48bb78',
        medium: '#f6ad55',
        high: '#f56565'
      };
      
      const severityColor = severityColors[pattern.severity] || '#718096';
      const date = new Date(pattern.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return `
        <div class="dark-pattern-item">
          <div class="dark-pattern-header">
            <span class="dark-pattern-domain">${pattern.domain}</span>
            <span class="dark-pattern-badge" style="background: ${severityColor}">${pattern.severity}</span>
          </div>
          <div class="dark-pattern-type">${pattern.pattern}</div>
          <div class="dark-pattern-date">${date}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error updating dark pattern stats:', error);
  }
}

// Get color based on score
function getScoreColor(score) {
  if (score < 30) return '#48bb78';
  if (score < 50) return '#ecc94b';
  if (score < 70) return '#f6ad55';
  return '#f56565';
}

// Update mood history
async function updateMoodHistory() {
  try {
    const { moods = [] } = await chrome.storage.local.get('moods');
    
    const container = document.getElementById('mood-history');
    
    if (moods.length === 0) {
      container.innerHTML = '<div class="empty-state-small">Track your mood to see patterns</div>';
      return;
    }
    
    // Show last 7 moods
    const recentMoods = moods.slice(-7);
    container.innerHTML = `
      <div class="mood-trend">
        ${recentMoods.map(m => {
          const emoji = ['😞', '😕', '😐', '🙂', '😄'][m.mood - 1];
          const date = new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `<span class="mood-point" title="${date}">${emoji}</span>`;
        }).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error updating mood history:', error);
  }
}

// Update interventions count
async function updateInterventionsCount() {
  try {
    const { interventions = [] } = await chrome.storage.local.get('interventions');
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayInterventions = interventions.filter(i => i.timestamp >= todayStart.getTime());
    
    const count = todayInterventions.length;
    const text = count === 1 ? '1 intervention today' : `${count} interventions today`;
    
    document.getElementById('interventions-count').textContent = text;
  } catch (error) {
    console.error('Error updating interventions:', error);
  }
}

// Check if in learning phase
async function checkLearningPhase() {
  try {
    const { learningPhase } = await chrome.storage.local.get('learningPhase');
    
    const banner = document.getElementById('learning-banner');
    if (learningPhase) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking learning phase:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Mood tracker
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mood = parseInt(btn.dataset.mood);
      await saveMood(mood);
      
      // Visual feedback
      btn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        btn.style.transform = 'scale(1)';
      }, 200);
      
      await updateMoodHistory();
    });
  });
  
  // Quick controls
  document.getElementById('pause-timer-btn').addEventListener('click', toggleTimer);
  document.getElementById('block-site-btn').addEventListener('click', blockCurrentSite);
  document.getElementById('calm-redirect-btn').addEventListener('click', redirectToCalm);
}

// Save mood
async function saveMood(mood) {
  try {
    const { moods = [] } = await chrome.storage.local.get('moods');
    moods.push({
      mood: mood,
      timestamp: Date.now()
    });
    await chrome.storage.local.set({ moods });
  } catch (error) {
    console.error('Error saving mood:', error);
  }
}

// Toggle timer
function toggleTimer() {
  timerPaused = !timerPaused;
  const btn = document.getElementById('pause-timer-btn');
  
  if (timerPaused) {
    btn.innerHTML = '<span class="btn-icon">▶️</span><span class="btn-text">Resume Timer</span>';
    btn.style.background = '#48bb78';
  } else {
    btn.innerHTML = '<span class="btn-icon">⏸️</span><span class="btn-text">Pause Timer</span>';
    btn.style.background = '';
  }
}

// Block current site for 1 hour
async function blockCurrentSite() {
  if (!currentTab || !currentTab.url) {
    return;
  }
  
  try {
    const url = new URL(currentTab.url);
    const domain = url.hostname;
    
    const { blockedSites = {} } = await chrome.storage.local.get('blockedSites');
    blockedSites[domain] = Date.now() + (60 * 60 * 1000); // 1 hour from now
    
    await chrome.storage.local.set({ blockedSites });
    
    // Show confirmation
    const btn = document.getElementById('block-site-btn');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Blocked!</span>';
    btn.style.background = '#48bb78';
    
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.background = '';
    }, 2000);
    
    // Close tab
    chrome.tabs.remove(currentTab.id);
  } catch (error) {
    console.error('Error blocking site:', error);
  }
}

// Redirect to calm site
async function redirectToCalm() {
  if (!currentTab) {
    return;
  }
  
  try {
    const { settings } = await chrome.storage.local.get('settings');
    const calmSites = settings?.calmSites || ['https://www.calm.com'];
    
    // Pick random calm site
    const randomSite = calmSites[Math.floor(Math.random() * calmSites.length)];
    
    await chrome.tabs.update(currentTab.id, { url: randomSite });
    window.close();
  } catch (error) {
    console.error('Error redirecting:', error);
  }
}

// Start realtime updates
function startRealtimeUpdates() {
  // Update doomscore every 5 seconds
  setInterval(updateDoomscore, 5000);
  
  // Update time stats every 30 seconds
  setInterval(updateTimeStats, 30000);
}
