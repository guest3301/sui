// API Client for ShieldUI Chrome Extension
// Handles authentication, API calls, and offline queueing

const API_BASE_URL = 'http://127.0.0.1:5000/api';
const OFFLINE_QUEUE_KEY = 'offlineQueue';
const AUTH_TOKEN_KEY = 'authToken';
const SETTINGS_VERSION_KEY = 'settingsVersion';

class APIClient {
  constructor() {
    this.token = null;
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Initialize
    this.init();
  }
  
  async init() {
    // Load stored token
    const stored = await chrome.storage.local.get(AUTH_TOKEN_KEY);
    if (stored[AUTH_TOKEN_KEY]) {
      this.token = stored[AUTH_TOKEN_KEY];
    }
    
    // Load offline queue
    const queueData = await chrome.storage.local.get(OFFLINE_QUEUE_KEY);
    if (queueData[OFFLINE_QUEUE_KEY]) {
      this.offlineQueue = queueData[OFFLINE_QUEUE_KEY];
    }
    
    // Validate token if exists
    if (this.token) {
      const valid = await this.validateToken();
      if (!valid) {
        this.token = null;
        await chrome.storage.local.remove(AUTH_TOKEN_KEY);
      }
    }
  }
  
  // Authentication methods
  async setToken(token) {
    this.token = token;
    await chrome.storage.local.set({ [AUTH_TOKEN_KEY]: token });
  }
  
  async clearToken() {
    this.token = null;
    await chrome.storage.local.remove(AUTH_TOKEN_KEY);
  }
  
  async validateToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        headers: this.getHeaders()
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
  
  isAuthenticated() {
    return this.token !== null;
  }
  
  async login(username, passkeyCredential, totpCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          passkey_credential: passkeyCredential,
          totp_code: totpCode
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await this.setToken(data.token);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }
  
  async logout() {
    if (!this.token) return;
    
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearToken();
    }
  }
  
  // Settings methods
  async getSettings() {
    return this.request('GET', '/settings');
  }
  
  async updateSettings(settings) {
    return this.request('PUT', '/settings', settings);
  }
  
  async checkSettingsSync(clientVersion) {
    return this.request('GET', `/settings/sync?version=${clientVersion}`);
  }
  
  // Detection methods
  async logDetection(detectionData) {
    const payload = {
      url: detectionData.url,
      pattern_type: detectionData.pattern_type || detectionData.pattern,
      confidence_score: detectionData.confidence_score || detectionData.confidence || 0.8,
      page_elements: detectionData.page_elements || []
    };
    
    return this.request('POST', '/detection/log', payload);
  }
  
  async logDoomscroll(doomscrollData) {
    const payload = {
      url: doomscrollData.url,
      scroll_duration: doomscrollData.scroll_duration || doomscrollData.duration,
      intervention_triggered: doomscrollData.intervention_triggered || false,
      user_response: doomscrollData.user_response || ''
    };
    
    return this.request('POST', '/detection/doomscroll', payload);
  }
  
  async getRecentDetections(limit = 50) {
    return this.request('GET', `/detection/recent?limit=${limit}`);
  }
  
  async getRecentDoomscrolls(limit = 50) {
    return this.request('GET', `/detection/doomscroll/recent?limit=${limit}`);
  }
  
  // Analytics methods
  async getAnalyticsSummary(days = 30) {
    return this.request('GET', `/analytics/summary?days=${days}`);
  }
  
  async getPatternBreakdown(days = 30) {
    return this.request('GET', `/analytics/patterns?days=${days}`);
  }
  
  async getProblematicWebsites(days = 30, limit = 10) {
    return this.request('GET', `/analytics/websites?days=${days}&limit=${limit}`);
  }
  
  async getTimeline(days = 30) {
    return this.request('GET', `/analytics/timeline?days=${days}`);
  }
  
  // Core request method
  async request(method, endpoint, body = null) {
    if (!this.isAuthenticated() && !endpoint.includes('/auth/')) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    // If offline, queue the request (except for GET requests)
    if (!this.isOnline && method !== 'GET') {
      await this.queueRequest(method, endpoint, body);
      return { success: true, queued: true };
    }
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, data };
      } else {
        // Handle auth errors
        if (response.status === 401) {
          await this.clearToken();
        }
        
        return { success: false, error: data.error || 'Request failed' };
      }
    } catch (error) {
      console.error('API request error:', error);
      
      // Queue non-GET requests on network error
      if (method !== 'GET') {
        await this.queueRequest(method, endpoint, body);
      }
      
      return { success: false, error: 'Network error', queued: method !== 'GET' };
    }
  }
  
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  // Offline queue management
  async queueRequest(method, endpoint, body) {
    this.offlineQueue.push({
      method,
      endpoint,
      body,
      timestamp: Date.now()
    });
    
    // Limit queue size to 1000 items
    if (this.offlineQueue.length > 1000) {
      this.offlineQueue.shift();
    }
    
    await chrome.storage.local.set({ [OFFLINE_QUEUE_KEY]: this.offlineQueue });
    console.log('Queued offline request:', method, endpoint);
  }
  
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`Processing ${this.offlineQueue.length} queued requests...`);
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    let successCount = 0;
    let failedRequests = [];
    
    for (const req of queue) {
      const result = await this.request(req.method, req.endpoint, req.body);
      
      if (result.success) {
        successCount++;
      } else if (!result.queued) {
        // Re-queue if failed but not already queued
        failedRequests.push(req);
      }
    }
    
    // Keep failed requests in queue
    this.offlineQueue = failedRequests;
    await chrome.storage.local.set({ [OFFLINE_QUEUE_KEY]: this.offlineQueue });
    
    console.log(`Processed queue: ${successCount} succeeded, ${failedRequests.length} failed`);
    
    return {
      processed: queue.length,
      succeeded: successCount,
      failed: failedRequests.length
    };
  }
  
  handleOnline() {
    this.isOnline = true;
    console.log('Back online - processing queue...');
    this.processOfflineQueue();
  }
  
  handleOffline() {
    this.isOnline = false;
    console.log('Gone offline - queueing requests');
  }
}

// Create singleton instance
const apiClient = new APIClient();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiClient;
}
