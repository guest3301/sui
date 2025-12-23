// Dark Pattern Detection Module for Content Script
// Detects suspicious UI patterns and sends to Gemini for analysis

class DarkPatternDetector {
    constructor() {
        this.suspiciousElements = [];
        this.flowData = [];
        this.detectionEnabled = true;
        this.lastAnalysis = 0;
        this.analysisDebounce = 5000; // 5 seconds
    }

    // Quick local scan for obviously suspicious patterns
    quickScan() {
        const suspicious = [];

        // Pattern 1: Confirm shaming
        const confirmShamingPatterns = [
            /no,?\s+(i\s+)?don'?t\s+want/i,
            /no\s+thanks,?\s+i\s+prefer/i,
            /i\s+hate\s+(saving|money|discounts)/i
        ];

        // Pattern 2: False urgency
        const urgencyPatterns = [
            /only\s+\d+\s+left/i,
            /\d+\s+people\s+viewing/i,
            /hurry/i,
            /limited\s+time/i,
            /expires\s+soon/i
        ];

        // Pattern 3: Hidden costs
        const hiddenCostPatterns = [
            /\+\s*shipping/i,
            /additional\s+fees/i,
            /\*see\s+details/i
        ];

        // Scan buttons
        document.querySelectorAll('button, a[role="button"], input[type="button"]').forEach(el => {
            const text = el.textContent.trim();
            
            // Check for confirm shaming
            for (const pattern of confirmShamingPatterns) {
                if (pattern.test(text)) {
                    suspicious.push({
                        element: el,
                        text: text,
                        pattern: 'confirm_shaming',
                        suspicion_score: 0.8,
                        selector: this.getSelector(el)
                    });
                    break;
                }
            }
        });

        // Scan for urgency messages
        document.querySelectorAll('p, span, div').forEach(el => {
            const text = el.textContent.trim();
            
            if (text.length > 10 && text.length < 200) {
                for (const pattern of urgencyPatterns) {
                    if (pattern.test(text)) {
                        suspicious.push({
                            element: el,
                            text: text,
                            pattern: 'false_urgency',
                            suspicion_score: 0.7,
                            selector: this.getSelector(el)
                        });
                        break;
                    }
                }
            }
        });

        // Check for pre-selected checkboxes (opt-ins)
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(el => {
            const label = this.getAssociatedLabel(el);
            if (label && /newsletter|marketing|third.party|partners/i.test(label)) {
                suspicious.push({
                    element: el,
                    text: label,
                    pattern: 'sneaky_opt_in',
                    suspicion_score: 0.9,
                    selector: this.getSelector(el)
                });
            }
        });

        return suspicious;
    }

    // Collect data for Gemini analysis
    async collectForGemini(suspiciousElements) {
        const data = {
            elements: [],
            screenshots: [],
            flow_data: this.flowData,
            context: this.buildContext()
        };

        // Collect element data
        for (const item of suspiciousElements) {
            data.elements.push({
                text: item.text,
                html: item.element.outerHTML.substring(0, 500),
                selector: item.selector,
                pattern: item.pattern,
                suspicion_score: item.suspicion_score,
                role: item.element.getAttribute('role') || item.element.tagName.toLowerCase(),
                context: {
                    page_type: this.classifyPageType(),
                    element_role: item.pattern,
                    user_action: 'viewing'
                }
            });
        }

        // Capture screenshots of suspicious areas
        data.screenshots = await this.captureScreenshots(suspiciousElements);

        return data;
    }

    // Capture screenshots of suspicious elements
    async captureScreenshots(elements) {
        const screenshots = [];
        
        // Target specific areas
        const targetSelectors = [
            '.checkout-form',
            '.subscription-modal',
            '.cookie-banner',
            '.pricing-table',
            '[class*="modal"]',
            '[class*="popup"]'
        ];

        for (const selector of targetSelectors) {
            const targetEl = document.querySelector(selector);
            if (targetEl) {
                try {
                    const screenshot = await this.captureElement(targetEl);
                    if (screenshot) {
                        screenshots.push({
                            image: screenshot,
                            label: selector,
                            html_structure: targetEl.outerHTML.substring(0, 300),
                            bounding_box: targetEl.getBoundingClientRect()
                        });
                    }
                } catch (error) {
                    console.warn('Could not capture screenshot:', error);
                }
            }
        }

        return screenshots;
    }

    // Capture element as base64 image
    async captureElement(element) {
        try {
            // Use html2canvas if available, otherwise return null
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(element);
                return canvas.toDataURL('image/png').split(',')[1]; // Return base64 without prefix
            }
            return null;
        } catch (error) {
            console.error('Screenshot capture error:', error);
            return null;
        }
    }

    // Build page context
    buildContext() {
        return {
            url: window.location.href,
            page_type: this.classifyPageType(),
            user_intent: this.inferUserIntent(),
            title: document.title
        };
    }

    // Classify page type
    classifyPageType() {
        const url = window.location.href.toLowerCase();
        const path = window.location.pathname.toLowerCase();

        if (/checkout|cart|payment/.test(url) || /checkout|cart/.test(path)) {
            return 'checkout';
        } else if (/subscribe|subscription|pricing/.test(url)) {
            return 'subscription';
        } else if (/login|signin|signup|register/.test(url)) {
            return 'auth';
        } else if (/shop|product|item/.test(url)) {
            return 'e-commerce';
        } else if (document.querySelector('.cookie-banner, [id*="cookie"]')) {
            return 'cookie-consent';
        }

        return 'general';
    }

    // Infer user intent
    inferUserIntent() {
        const pageType = this.classifyPageType();
        
        const intentMap = {
            'checkout': 'completing_purchase',
            'subscription': 'evaluating_service',
            'auth': 'creating_account',
            'e-commerce': 'browsing_products',
            'cookie-consent': 'managing_privacy',
            'general': 'browsing'
        };

        return intentMap[pageType] || 'browsing';
    }

    // Get CSS selector for element
    getSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            const classes = element.className.split(' ').filter(c => c).slice(0, 2).join('.');
            if (classes) {
                return `${element.tagName.toLowerCase()}.${classes}`;
            }
        }

        return element.tagName.toLowerCase();
    }

    // Get associated label for input
    getAssociatedLabel(input) {
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label.textContent.trim();
        }

        const parent = input.closest('label');
        if (parent) return parent.textContent.trim();

        return '';
    }

    // Record user flow
    recordUserFlow(action, details) {
        this.flowData.push({
            timestamp: Date.now(),
            action: action,
            details: details,
            url: window.location.href
        });

        // Keep only last 20 flow events
        if (this.flowData.length > 20) {
            this.flowData.shift();
        }
    }

    // Highlight detected dark pattern
    highlightDarkPattern(element, result) {
        // Add visual indicator
        element.style.outline = '3px solid #f56565';
        element.style.outlineOffset = '2px';
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'dark-pattern-tooltip';
        tooltip.innerHTML = `
            <div style="background: #f56565; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; position: absolute; z-index: 999999; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                ⚠️ Dark Pattern Detected: ${result.pattern_type}
                <br><small>${result.explanation.substring(0, 100)}...</small>
            </div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(tooltip);

        // Remove after 5 seconds
        setTimeout(() => {
            element.style.outline = '';
            element.style.outlineOffset = '';
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 5000);
    }
}

// Initialize detector
const darkPatternDetector = new DarkPatternDetector();

// Analyze dark patterns with Gemini
async function analyzeDarkPatternsWithGemini() {
    const now = Date.now();
    
    // Check if dark pattern detection is enabled
    const { darkPatternSettings = {} } = await chrome.storage.local.get('darkPatternSettings');
    
    if (darkPatternSettings.enabled === false) {
        console.log('Dark pattern detection is disabled');
        return;
    }
    
    // Debounce analysis
    if (now - darkPatternDetector.lastAnalysis < darkPatternDetector.analysisDebounce) {
        return;
    }
    
    darkPatternDetector.lastAnalysis = now;

    try {
        // Phase 1: Quick local scan
        const suspicious = darkPatternDetector.quickScan();

        if (suspicious.length === 0) {
            console.log('No suspicious dark patterns detected locally');
            return;
        }

        console.log(`Found ${suspicious.length} potentially suspicious elements`);

        // Phase 2: Collect data for Gemini
        const data = await darkPatternDetector.collectForGemini(suspicious);
        
        // Add API key if configured
        if (darkPatternSettings.geminiApiKey) {
            data.api_key = darkPatternSettings.geminiApiKey;
        }

        // Phase 3: Send to Flask backend for Gemini analysis
        try {
            const response = await fetch('http://127.0.0.1:5000/api/analyze/dark-patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const results = await response.json();

            if (results.success) {
                console.log('Gemini analysis complete:', results);

                // Phase 4: Apply findings
                results.results.forEach((result, index) => {
                    if (result.dark_pattern_detected && result.confidence_score > 0.6) {
                        if (suspicious[index]) {
                            if (darkPatternSettings.showWarnings !== false) {
                                darkPatternDetector.highlightDarkPattern(suspicious[index].element, result);
                            }
                            
                            // Log to dashboard
                            chrome.runtime.sendMessage({
                                type: 'darkPatternDetected',
                                data: {
                                    pattern: result.pattern_type,
                                    confidence: result.confidence_score,
                                    severity: result.severity,
                                    domain: window.location.hostname,
                                    timestamp: Date.now()
                                }
                            });
                        }
                    }
                });

                // Show summary if high score and warnings enabled
                if (results.site_score > 50 && darkPatternSettings.showWarnings !== false) {
                    showDarkPatternWarning(results);
                }
            }

        } catch (fetchError) {
            console.warn('Gemini analysis not available, using local detection only:', fetchError);
            
            // Fallback: highlight locally detected patterns if warnings enabled
            if (darkPatternSettings.showWarnings !== false) {
                suspicious.forEach(item => {
                    item.element.style.outline = '2px dashed orange';
                });
            }
            
            // Still log locally detected patterns
            suspicious.forEach(item => {
                chrome.runtime.sendMessage({
                    type: 'darkPatternDetected',
                    data: {
                        pattern: item.pattern,
                        confidence: item.suspicion_score,
                        severity: 'medium',
                        domain: window.location.hostname,
                        timestamp: Date.now()
                    }
                });
            });
        }

    } catch (error) {
        console.error('Dark pattern detection error:', error);
    }
}

// Show dark pattern warning
function showDarkPatternWarning(results) {
    const warning = document.createElement('div');
    warning.id = 'dark-pattern-warning';
    warning.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: white; border: 3px solid #f56565; border-radius: 12px; padding: 20px; max-width: 400px; z-index: 999999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <h3 style="margin: 0 0 10px 0; color: #f56565;">⚠️ Dark Patterns Detected</h3>
            <p style="margin: 0 0 10px 0; font-size: 14px;">
                This site has a dark pattern score of <strong>${results.site_score}/100</strong>.
                ${results.aggregated.total_patterns_found} deceptive patterns found.
            </p>
            <ul style="margin: 0 0 15px 0; padding-left: 20px; font-size: 13px;">
                ${Object.keys(results.aggregated.pattern_types).slice(0, 3).map(pattern => 
                    `<li>${pattern}</li>`
                ).join('')}
            </ul>
            <button id="close-warning" style="background: #f56565; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
            <button id="see-details" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                See Details
            </button>
        </div>
    `;

    document.body.appendChild(warning);

    document.getElementById('close-warning').addEventListener('click', () => {
        warning.remove();
    });

    document.getElementById('see-details').addEventListener('click', () => {
        // Open extension popup or show more details
        console.log('Full results:', results);
        alert('Check browser console for full dark pattern analysis');
    });

    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (warning.parentNode) {
            warning.remove();
        }
    }, 15000);
}

// Run dark pattern detection on page load and periodically
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', analyzeDarkPatternsWithGemini);
} else {
    analyzeDarkPatternsWithGemini();
}

// Re-analyze on significant DOM changes
let mutationTimeout;
const observer = new MutationObserver(() => {
    clearTimeout(mutationTimeout);
    mutationTimeout = setTimeout(() => {
        analyzeDarkPatternsWithGemini();
    }, 3000);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Track user flow for analysis
document.addEventListener('click', (e) => {
    if (e.target.matches('button, a[role="button"], input[type="submit"]')) {
        darkPatternDetector.recordUserFlow('click', {
            element: darkPatternDetector.getSelector(e.target),
            text: e.target.textContent.trim().substring(0, 50)
        });
    }
});

console.log('Dark Pattern Detector initialized with Gemini AI support');
