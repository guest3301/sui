// Content Script for DoomScroll Defender
// Extracts content, monitors scrolling, and displays interventions

const SAMPLE_INTERVAL = 30000; // 30 seconds
const SCROLL_SAMPLE_RATE = 500; // Sample scroll every 500ms

let lastScrollPosition = 0;
let lastScrollTime = Date.now();
let scrollSampleTimer = null;
let contentSampleTimer = null;
let interventionActive = false;

// Detect if page has infinite scroll
const INFINITE_SCROLL_SITES = [
  'twitter.com', 'x.com',
  'facebook.com',
  'reddit.com',
  'instagram.com',
  'tiktok.com',
  'linkedin.com',
  'pinterest.com'
];

function hasInfiniteScroll() {
  const hostname = window.location.hostname;
  return INFINITE_SCROLL_SITES.some(site => hostname.includes(site));
}

// Initialize content script
function initialize() {
  console.log('DoomScroll Defender content script initialized');
  
  // Start monitoring scroll
  startScrollMonitoring();
  
  // Start content sampling
  startContentSampling();
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Start scroll monitoring
function startScrollMonitoring() {
  let lastSample = Date.now();
  
  window.addEventListener('scroll', () => {
    const now = Date.now();
    
    // Sample at defined rate
    if (now - lastSample > SCROLL_SAMPLE_RATE) {
      lastSample = now;
      captureScrollEvent();
    }
  }, { passive: true });
}

// Capture scroll event
function captureScrollEvent() {
  const currentPosition = window.scrollY;
  const currentTime = Date.now();
  
  // Calculate scroll metrics
  const scrollDelta = currentPosition - lastScrollPosition;
  const timeDelta = currentTime - lastScrollTime;
  const velocity = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0;
  
  // Calculate scroll depth (0-1)
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const depth = scrollHeight > 0 ? currentPosition / scrollHeight : 0;
  
  // Send to background
  chrome.runtime.sendMessage({
    type: 'scrollEvent',
    data: {
      position: currentPosition,
      velocity: velocity,
      depth: depth,
      hasInfiniteScroll: hasInfiniteScroll()
    }
  });
  
  lastScrollPosition = currentPosition;
  lastScrollTime = currentTime;
}

// Start content sampling
function startContentSampling() {
  // Initial sample
  sampleContent();
  
  // Regular sampling
  contentSampleTimer = setInterval(() => {
    sampleContent();
  }, SAMPLE_INTERVAL);
}

// Sample content from page
function sampleContent() {
  try {
    const content = extractTextContent();
    
    if (content && content.length > 50) {
      chrome.runtime.sendMessage({
        type: 'contentSample',
        data: content
      });
    }
  } catch (error) {
    console.error('Error sampling content:', error);
  }
}

// Extract text content from various page elements
function extractTextContent() {
  let texts = [];
  
  // Try different selectors based on common site structures
  const selectors = [
    // Articles and main content
    'article p',
    'article h1, article h2, article h3',
    '[role="article"] p',
    '[role="article"] h1, [role="article"] h2',
    
    // Social media posts
    '[data-testid="tweet"] [lang]', // Twitter
    '[data-pagelet*="FeedUnit"] [dir="auto"]', // Facebook
    '.Post p', // Reddit
    '[class*="caption"]', // Instagram
    
    // News headlines
    '.headline',
    '.title',
    'h1.story-heading',
    
    // Generic content
    'main p',
    '.content p',
    '#content p'
  ];
  
  for (let selector of selectors) {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length > 0) {
      // Get first 10 elements
      const samples = Array.from(elements)
        .slice(0, 10)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 20);
      
      texts.push(...samples);
      
      // Stop if we have enough
      if (texts.length >= 5) {
        break;
      }
    }
  }
  
  // Join and limit to 2000 characters
  return texts.join(' ').substring(0, 2000);
}

// Handle messages from background
function handleMessage(message, sender, sendResponse) {
  if (message.type === 'intervention') {
    showIntervention(message.level, message.calmSites);
  }
  
  return true;
}

// Show intervention based on level
function showIntervention(level, calmSites) {
  if (interventionActive) {
    return; // Don't show multiple interventions
  }
  
  interventionActive = true;
  
  switch (level) {
    case 1:
      showLevel1Intervention();
      break;
    case 2:
      showLevel2Intervention();
      break;
    case 3:
      showLevel3Intervention();
      break;
    case 4:
      showLevel4Intervention(calmSites);
      break;
  }
}

// Level 1: Subtle border color change
function showLevel1Intervention() {
  document.body.style.transition = 'border 1s ease';
  document.body.style.border = '4px solid #FFA500';
  document.body.style.boxSizing = 'border-box';
  
  setTimeout(() => {
    interventionActive = false;
  }, 5000);
}

// Level 2: Time notification
function showLevel2Intervention() {
  const notification = createNotificationElement(
    '⏰ Time Check',
    'You\'ve been viewing potentially negative content for a while. Consider taking a break?',
    [
      { text: 'Thanks, I\'ll be mindful', action: 'acknowledge' },
      { text: 'This isn\'t doomscrolling', action: 'override' }
    ]
  );
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
    interventionActive = false;
  }, 10000);
}

// Level 3: Full pause screen with breathing exercise
function showLevel3Intervention() {
  const overlay = document.createElement('div');
  overlay.id = 'doomscroll-pause-overlay';
  overlay.innerHTML = `
    <div class="doomscroll-pause-container">
      <h2>🧘 Let's Take a Mindful Pause</h2>
      <p>You've been engaging with challenging content. Let's breathe together.</p>
      
      <div class="breathing-circle" id="breathing-circle"></div>
      <p class="breathing-text" id="breathing-text">Breathe in...</p>
      
      <div class="timer" id="pause-timer">60</div>
      
      <div class="pause-actions">
        <button id="continue-pause" class="btn-primary">Continue Breathing</button>
        <button id="end-pause" class="btn-secondary">I'm Ready to Continue</button>
        <button id="override-pause" class="btn-text">This isn't doomscrolling</button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #doomscroll-pause-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .doomscroll-pause-container {
      text-align: center;
      color: white;
      max-width: 500px;
      padding: 40px;
    }
    
    .doomscroll-pause-container h2 {
      font-size: 32px;
      margin-bottom: 16px;
    }
    
    .breathing-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 40px auto;
      animation: breathe 8s ease-in-out infinite;
    }
    
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }
    
    .breathing-text {
      font-size: 24px;
      margin: 20px 0;
    }
    
    .timer {
      font-size: 48px;
      font-weight: bold;
      margin: 30px 0;
    }
    
    .pause-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 30px;
    }
    
    .btn-primary, .btn-secondary, .btn-text {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .btn-primary {
      background: #667eea;
      color: white;
    }
    
    .btn-primary:hover {
      background: #5568d3;
    }
    
    .btn-secondary {
      background: #48bb78;
      color: white;
    }
    
    .btn-secondary:hover {
      background: #38a169;
    }
    
    .btn-text {
      background: transparent;
      color: #a0aec0;
    }
    
    .btn-text:hover {
      color: white;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  
  // Breathing animation text
  let countdown = 60;
  const timerElement = document.getElementById('pause-timer');
  const breathingText = document.getElementById('breathing-text');
  
  const breathingCycle = setInterval(() => {
    const phase = Math.floor((60 - countdown) / 4) % 4;
    const texts = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'];
    breathingText.textContent = texts[phase];
  }, 4000);
  
  const countdownInterval = setInterval(() => {
    countdown--;
    timerElement.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      clearInterval(breathingCycle);
      overlay.remove();
      interventionActive = false;
    }
  }, 1000);
  
  // Event listeners
  document.getElementById('continue-pause').addEventListener('click', () => {
    countdown += 30; // Add 30 more seconds
  });
  
  document.getElementById('end-pause').addEventListener('click', () => {
    clearInterval(countdownInterval);
    clearInterval(breathingCycle);
    overlay.remove();
    interventionActive = false;
  });
  
  document.getElementById('override-pause').addEventListener('click', () => {
    clearInterval(countdownInterval);
    clearInterval(breathingCycle);
    overlay.remove();
    interventionActive = false;
    chrome.runtime.sendMessage({
      type: 'userOverride',
      reason: 'User indicated not doomscrolling'
    });
  });
}

// Level 4: Redirect to calm site
function showLevel4Intervention(calmSites) {
  const overlay = document.createElement('div');
  overlay.id = 'doomscroll-redirect-overlay';
  overlay.innerHTML = `
    <div class="doomscroll-redirect-container">
      <h2>🛑 Time for a Break</h2>
      <p>You've reached your healthy content limit. Let's redirect you to something calming.</p>
      
      <div class="redirect-timer">
        Redirecting in <span id="redirect-countdown">10</span> seconds...
      </div>
      
      <div class="calm-sites">
        <p>Choose a calm destination:</p>
        <div id="calm-sites-list"></div>
      </div>
      
      <div class="redirect-actions">
        <button id="redirect-now" class="btn-primary">Redirect Now</button>
        <button id="override-redirect" class="btn-text">Override (I need to continue)</button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #doomscroll-redirect-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(220, 38, 38, 0.95);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .doomscroll-redirect-container {
      text-align: center;
      color: white;
      max-width: 500px;
      padding: 40px;
    }
    
    .redirect-timer {
      font-size: 24px;
      margin: 30px 0;
    }
    
    #redirect-countdown {
      font-weight: bold;
      font-size: 32px;
    }
    
    .calm-sites {
      margin: 30px 0;
    }
    
    #calm-sites-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }
    
    .calm-site-btn {
      padding: 12px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .calm-site-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  
  // Populate calm sites
  const calmSitesList = document.getElementById('calm-sites-list');
  calmSites.forEach(site => {
    const btn = document.createElement('button');
    btn.className = 'calm-site-btn';
    btn.textContent = new URL(site).hostname;
    btn.addEventListener('click', () => {
      window.location.href = site;
    });
    calmSitesList.appendChild(btn);
  });
  
  // Countdown
  let countdown = 10;
  const countdownElement = document.getElementById('redirect-countdown');
  
  const countdownInterval = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      // Redirect to first calm site
      if (calmSites.length > 0) {
        window.location.href = calmSites[0];
      }
    }
  }, 1000);
  
  // Event listeners
  document.getElementById('redirect-now').addEventListener('click', () => {
    clearInterval(countdownInterval);
    if (calmSites.length > 0) {
      window.location.href = calmSites[0];
    }
  });
  
  document.getElementById('override-redirect').addEventListener('click', () => {
    clearInterval(countdownInterval);
    overlay.remove();
    interventionActive = false;
    chrome.runtime.sendMessage({
      type: 'userOverride',
      reason: 'User overrode redirect'
    });
  });
}

// Create notification element helper
function createNotificationElement(title, message, buttons) {
  const notification = document.createElement('div');
  notification.className = 'doomscroll-notification';
  
  notification.innerHTML = `
    <div class="doomscroll-notification-content">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="doomscroll-notification-buttons"></div>
    </div>
  `;
  
  // Add styles
  if (!document.getElementById('doomscroll-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'doomscroll-notification-styles';
    style.textContent = `
      .doomscroll-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        padding: 20px;
        max-width: 400px;
        z-index: 999998;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .doomscroll-notification h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        color: #1a202c;
      }
      
      .doomscroll-notification p {
        margin: 0 0 16px 0;
        color: #4a5568;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .doomscroll-notification-buttons {
        display: flex;
        gap: 8px;
      }
      
      .doomscroll-notification-buttons button {
        flex: 1;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .doomscroll-notification-buttons button:first-child {
        background: #667eea;
        color: white;
      }
      
      .doomscroll-notification-buttons button:first-child:hover {
        background: #5568d3;
      }
      
      .doomscroll-notification-buttons button:last-child {
        background: #e2e8f0;
        color: #4a5568;
      }
      
      .doomscroll-notification-buttons button:last-child:hover {
        background: #cbd5e0;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add buttons
  const buttonContainer = notification.querySelector('.doomscroll-notification-buttons');
  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.addEventListener('click', () => {
      if (btn.action === 'override') {
        chrome.runtime.sendMessage({
          type: 'userOverride',
          reason: 'User indicated not doomscrolling'
        });
      }
      notification.remove();
      interventionActive = false;
    });
    buttonContainer.appendChild(button);
  });
  
  return notification;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (contentSampleTimer) {
    clearInterval(contentSampleTimer);
  }
});

// Initialize
initialize();
