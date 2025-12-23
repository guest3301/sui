# Implementation Plan: ShieldUI

## Overview

This implementation plan breaks down the ShieldUI system into discrete coding tasks. The system will be built in Python (backend) and JavaScript (browser extension), following a modular architecture with Flask blueprints. Tasks are ordered to build foundational components first, then integrate them into complete features.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create backend directory structure with blueprints, models, services, and utils folders
  - Create extension directory structure with manifest, background, content, and service files
  - Set up Python virtual environment and install Flask, Flask-SQLAlchemy, cryptography, pyotp, webauthn, requests
  - Create requirements.txt with all Python dependencies
  - Initialize SQLite database configuration
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 2. Implement database models
  - [x] 2.1 Create SQLAlchemy models for User, Settings, DetectionLog, DoomscrollLog, and Session
    - Define all model fields with appropriate types and constraints
    - Add indexes on frequently queried fields (username, url, pattern_type, timestamps)
    - Implement model relationships and foreign keys
    - _Requirements: 1.1, 6.4, 7.5, 9.1_

  - [x] 2.2 Write property test for settings persistence
    - **Property 28: Settings persistence round-trip**
    - **Validates: Requirements 6.4**

- [ ] 3. Implement authentication service
  - [x] 3.1 Create passkey registration and verification functions
    - Implement WebAuthn credential creation using webauthn library
    - Implement passkey verification logic
    - Store encrypted passkey credentials in database
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.2 Create TOTP setup and validation functions
    - Generate TOTP secrets using pyotp
    - Create QR code generation for TOTP setup
    - Implement TOTP code validation with time window
    - Store encrypted TOTP secrets in database
    - _Requirements: 1.2, 1.3, 1.5_

  - [x] 3.3 Implement session token management
    - Generate secure session tokens using secrets module
    - Create session creation and validation functions
    - Implement session expiration logic
    - _Requirements: 1.6_

  - [x] 3.4 Write property tests for authentication
    - **Property 1: Two-factor authentication requirement**
    - **Property 2: Failed passkey rejection**
    - **Property 3: Invalid TOTP rejection**
    - **Property 4: Session token creation**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

- [ ] 4. Implement encryption and security utilities
  - [x] 4.1 Create encryption functions for sensitive data
    - Implement AES encryption/decryption using cryptography library
    - Create secure key derivation from environment variables
    - Add functions for encrypting passkey credentials and TOTP secrets
    - _Requirements: 9.1, 9.2_

  - [x] 4.2 Create input validation and sanitization functions
    - Implement validators for username, URL, settings values
    - Create SQL injection prevention through parameterized queries
    - Add XSS prevention for user inputs
    - _Requirements: 9.4_

  - [x] 4.3 Write property tests for security
    - **Property 35: Sensitive data encryption**
    - **Property 37: Input sanitization**
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement authentication API blueprint
  - [x] 6.1 Create auth blueprint with registration and login endpoints
    - Implement POST /api/auth/register/passkey endpoint
    - Implement POST /api/auth/register/totp endpoint
    - Implement POST /api/auth/login endpoint with two-factor validation
    - Implement POST /api/auth/logout endpoint
    - Implement GET /api/auth/session endpoint for session validation
    - Add authentication decorators for protected endpoints
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 6.2 Write unit tests for auth endpoints
    - Test registration flow with valid credentials
    - Test login rejection with invalid passkey
    - Test login rejection with invalid TOTP
    - Test session validation
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ] 7. Implement OCR and AI service integrations
  - [x] 7.1 Create OCR service wrapper for DeepSeek
    - Implement Hugging Face API client for DeepSeek OCR
    - Add image preprocessing and encoding
    - Implement retry logic with exponential backoff
    - Add timeout handling (10s timeout)
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 7.2 Create AI service wrapper for Gemini
    - Implement Gemini API client for text analysis
    - Create prompt templates for dark pattern detection
    - Parse AI responses into structured detection results
    - Implement retry logic with exponential backoff
    - Add timeout handling (15s timeout)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 7.3 Write property tests for service integrations
    - **Property 7: Text extraction**
    - **Property 8: OCR retry with backoff**
    - **Property 10: Pattern analysis invocation**
    - **Property 11: Comprehensive pattern detection**
    - **Validates: Requirements 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5**

- [ ] 8. Implement detection API blueprint
  - [ ] 8.1 Create detection endpoints for logging
    - Implement POST /api/detection/log endpoint for dark pattern logs
    - Implement POST /api/detection/doomscroll endpoint for doomscrolling logs
    - Implement GET /api/detection/recent endpoint for retrieving recent detections
    - Add request validation for all endpoints
    - _Requirements: 3.8, 4.6, 5.3_

  - [ ] 8.2 Write property tests for detection logging
    - **Property 14: Detection logging**
    - **Property 19: Intervention dismissal logging**
    - **Property 23: Detection event transmission**
    - **Validates: Requirements 3.8, 4.6, 5.3**

- [ ] 9. Implement settings API blueprint
  - [ ] 9.1 Create settings management endpoints
    - Implement GET /api/settings endpoint to retrieve user settings
    - Implement PUT /api/settings endpoint to update settings
    - Implement GET /api/settings/sync endpoint for version checking
    - Add settings validation (sensitivity 0.0-1.0, positive time thresholds)
    - Implement settings version incrementing on updates
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 9.2 Write property tests for settings management
    - **Property 27: Settings input validation**
    - **Property 29: Extension configuration notification**
    - **Validates: Requirements 6.3, 6.5**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement analytics API blueprint
  - [ ] 11.1 Create analytics aggregation endpoints
    - Implement GET /api/analytics/summary endpoint with total counts over time
    - Implement GET /api/analytics/patterns endpoint with pattern type breakdown
    - Implement GET /api/analytics/websites endpoint with ranked problematic sites
    - Implement GET /api/analytics/timeline endpoint with time-series data
    - Add date range filtering for all analytics queries
    - Implement efficient database aggregation queries
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 11.2 Write property tests for analytics
    - **Property 24: Analytics data aggregation**
    - **Property 30: Analytics completeness**
    - **Property 31: Analytics date filtering**
    - **Validates: Requirements 5.4, 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 12. Implement rate limiting middleware
  - [ ] 12.1 Create rate limiting decorator
    - Implement rate limiting using Flask-Limiter or custom decorator
    - Configure limits per endpoint (auth: 5/min, detection: 100/min, analytics: 20/min)
    - Add rate limit headers to responses
    - Return HTTP 429 with retry-after header when exceeded
    - _Requirements: 9.3_

  - [ ] 12.2 Write property test for rate limiting
    - **Property 36: API rate limiting**
    - **Validates: Requirements 9.3**

- [ ] 13. Implement frontend blueprint with Jinja templates
  - [ ] 13.1 Create base template and dashboard routes
    - Create base.html template with common layout and navigation
    - Implement GET / route for dashboard home (requires auth)
    - Implement GET /login route for login page
    - Implement GET /register route for registration page
    - Add authentication middleware to protect routes
    - _Requirements: 10.5_

  - [ ] 13.2 Create settings page template and route
    - Create settings.html template with forms for sensitivity and time thresholds
    - Implement GET /settings route (requires auth)
    - Add JavaScript for settings form submission to API
    - Display current settings values
    - _Requirements: 6.1, 6.2_

  - [ ] 13.3 Create analytics page template and route
    - Create analytics.html template with charts and statistics
    - Implement GET /analytics route (requires auth)
    - Add JavaScript for fetching analytics data from API
    - Display pattern breakdown, timeline, and website rankings
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 13.4 Write property tests for frontend display
    - **Property 26: Settings display completeness**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 14. Implement PWA capabilities
  - [ ] 14.1 Create web app manifest and service worker
    - Create manifest.json with app metadata, icons, and theme colors
    - Create service-worker.js for offline caching
    - Implement cache-first strategy for static assets
    - Implement network-first strategy for API calls with fallback
    - Register service worker in base template
    - _Requirements: 8.1, 8.2, 8.4_

  - [ ] 14.2 Write property tests for PWA functionality
    - **Property 33: Offline functionality**
    - **Property 34: Reconnection synchronization**
    - **Validates: Requirements 8.4, 8.5**

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement browser extension manifest and structure
  - [ ] 16.1 Create Manifest V3 configuration
    - Create manifest.json with required permissions (activeTab, storage, webRequest)
    - Define background service worker
    - Define content scripts for webpage monitoring
    - Add extension icons and metadata
    - _Requirements: 2.1_

  - [ ] 16.2 Create extension storage utilities
    - Implement functions for storing/retrieving auth tokens
    - Implement functions for queueing detection events
    - Add storage quota management with FIFO eviction
    - _Requirements: 5.5_

- [ ] 17. Implement extension authentication and sync
  - [ ] 17.1 Create authentication module
    - Implement extension login flow with backend API
    - Store session tokens securely in extension storage
    - Add token refresh logic
    - _Requirements: 5.1_

  - [ ] 17.2 Create settings synchronization module
    - Implement periodic settings sync from backend (60s interval)
    - Listen for settings update notifications from backend
    - Update local settings cache when changes detected
    - _Requirements: 5.2_

  - [ ] 17.3 Write property tests for extension sync
    - **Property 21: Extension startup authentication**
    - **Property 22: Settings push synchronization**
    - **Property 25: Offline event queueing**
    - **Validates: Requirements 5.1, 5.2, 5.5**

- [ ] 18. Implement screen capture and OCR pipeline
  - [ ] 18.1 Create screen capture module
    - Implement captureVisibleTab API usage
    - Add configurable capture intervals from settings
    - Handle capture failures gracefully
    - _Requirements: 2.1_

  - [ ] 18.2 Create OCR integration module
    - Send captured images to backend OCR endpoint
    - Handle OCR responses and extract text data
    - Implement error handling and retry logic
    - _Requirements: 2.2, 2.5_

  - [ ] 18.3 Write property tests for capture pipeline
    - **Property 5: Screen capture intervals**
    - **Property 6: OCR transmission**
    - **Property 9: AI analyzer handoff**
    - **Validates: Requirements 2.1, 2.2, 2.5**

- [ ] 19. Implement dark pattern detection in extension
  - [ ] 19.1 Create pattern detection coordinator
    - Send extracted text to backend AI analysis endpoint
    - Parse detection results from backend
    - Trigger warning display when patterns detected
    - Send detection events to backend for logging
    - _Requirements: 3.7, 3.8_

  - [ ] 19.2 Create warning UI overlay
    - Implement DOM injection for warning overlays
    - Style warnings with appropriate colors and positioning
    - Add dismiss functionality
    - Display pattern type and confidence score
    - _Requirements: 3.7_

  - [ ] 19.3 Write property tests for detection display
    - **Property 12: Detection result structure**
    - **Property 13: Visual warning display**
    - **Validates: Requirements 3.6, 3.7**

- [ ] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Implement doomscrolling detection and intervention
  - [ ] 21.1 Create scroll monitoring module
    - Detect infinite-scroll patterns on configured websites
    - Track scroll depth and time spent using scroll events
    - Identify platform-specific patterns (Instagram Reels, YouTube Shorts, TikTok, Twitter, Reddit)
    - _Requirements: 4.1, 4.2, 4.4_

  - [ ] 21.2 Create intervention trigger logic
    - Compare scroll time against user-configured thresholds
    - Trigger intervention when thresholds exceeded
    - Implement per-website time limit tracking
    - _Requirements: 4.3, 4.7_

  - [ ] 21.3 Create intervention UI overlay
    - Display intervention overlay with continue/break/close options
    - Handle user responses and log to backend
    - Implement overlay styling and positioning
    - _Requirements: 4.5, 4.6_

  - [ ] 21.4 Write property tests for doomscrolling prevention
    - **Property 15: Platform-specific scroll monitoring**
    - **Property 16: Scroll metrics tracking**
    - **Property 17: Threshold-based intervention**
    - **Property 18: Intervention options**
    - **Property 20: Per-website time configuration**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.7**

- [ ] 22. Implement data deletion endpoint
  - [ ] 22.1 Create user data deletion endpoint
    - Implement DELETE /api/user/data endpoint
    - Delete all user records from all tables (cascade)
    - Verify complete deletion
    - Return confirmation response
    - _Requirements: 9.5_

  - [ ] 22.2 Write property test for data deletion
    - **Property 38: Complete data deletion**
    - **Validates: Requirements 9.5**

- [ ] 23. Wire all components together
  - [ ] 23.1 Create Flask application factory
    - Initialize Flask app with configuration
    - Register all blueprints (api, frontend) with URL prefixes
    - Initialize SQLAlchemy with database
    - Add CORS configuration for extension communication
    - Add error handlers for common HTTP errors
    - _Requirements: 10.3_

  - [ ] 23.2 Create extension background service worker
    - Initialize extension on install
    - Coordinate capture, detection, and sync modules
    - Handle extension lifecycle events
    - Manage periodic tasks (capture intervals, sync intervals)
    - _Requirements: 2.1, 5.1, 5.2_

  - [ ] 23.3 Create extension content script
    - Inject warning and intervention overlays into pages
    - Monitor scroll behavior on configured sites
    - Communicate with background service worker
    - _Requirements: 3.7, 4.1, 4.5_

  - [ ] 23.4 Write integration tests
    - Test complete authentication flow from registration to login
    - Test complete detection flow from capture to logging
    - Test complete sync flow from dashboard settings to extension
    - Test complete analytics flow from detection to display
    - _Requirements: 1.1, 1.3, 2.1, 3.8, 5.2, 7.1_

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using Hypothesis (Python) and fast-check (JavaScript)
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows across components
- Backend uses Python with Flask, Flask-SQLAlchemy, and SQLite3
- Extension uses JavaScript with Manifest V3 APIs
- All sensitive data is encrypted before storage
- Rate limiting prevents API abuse
- PWA capabilities enable offline functionality
