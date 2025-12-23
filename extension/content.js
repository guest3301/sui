let protectionEnabled = true;
let monitoringActive = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateProtection') {
    protectionEnabled = message.enabled;
    if (!protectionEnabled) {
      removeAllWarnings();
    }
  }
  
  if (message.action === 'startMonitoring' && protectionEnabled) {
    startMonitoring();
  }
});

function startMonitoring() {
  if (monitoringActive) return;
  monitoringActive = true;
  
  console.log('ShieldUI: Monitoring started');
  
  scanForDarkPatterns();
  
  setInterval(() => {
    if (protectionEnabled) {
      scanForDarkPatterns();
    }
  }, 5000);
}

function scanForDarkPatterns() {
  const urgencyKeywords = [
    'limited time', 'hurry', 'act now', 'only.*left', 'expires soon',
    'last chance', 'don\'t miss out', 'selling fast', 'almost gone'
  ];
  
  const bodyText = document.body.innerText.toLowerCase();
  
  urgencyKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'i');
    if (regex.test(bodyText)) {
      const elements = findElementsWithText(keyword);
      elements.forEach(element => {
        if (!element.dataset.shielduiWarned) {
          showWarning(element, 'Urgency Manipulation Detected');
          element.dataset.shielduiWarned = 'true';
          
          chrome.runtime.sendMessage({
            action: 'patternDetected'
          });
        }
      });
    }
  });
}

function findElementsWithText(keyword) {
  const regex = new RegExp(keyword, 'i');
  const elements = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (regex.test(node.textContent)) {
      const parent = node.parentElement;
      if (parent && !elements.includes(parent)) {
        elements.push(parent);
      }
    }
  }
  
  return elements.slice(0, 5);
}

function showWarning(element, message) {
  const warning = document.createElement('div');
  warning.className = 'shieldui-warning';
  warning.innerHTML = `
    <div style="
      position: absolute;
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 600;
      color: #92400e;
      z-index: 999999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      pointer-events: none;
    ">
      ⚠️ ${message}
    </div>
  `;
  
  element.style.position = 'relative';
  element.appendChild(warning);
  
  setTimeout(() => {
    warning.style.opacity = '0';
    warning.style.transition = 'opacity 0.5s';
    setTimeout(() => warning.remove(), 500);
  }, 5000);
}

function removeAllWarnings() {
  document.querySelectorAll('.shieldui-warning').forEach(el => el.remove());
  document.querySelectorAll('[data-shieldui-warned]').forEach(el => {
    delete el.dataset.shielduiWarned;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startMonitoring);
} else {
  startMonitoring();
}
