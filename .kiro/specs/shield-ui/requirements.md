# Requirements Document

## Introduction

ShieldUI is a browser extension and dashboard system that protects users from dark patterns and doomscrolling behaviors. The system uses OCR and AI to detect manipulative UI patterns across websites and provides intervention mechanisms to help users maintain healthy browsing habits. The dashboard serves as a Progressive Web App (PWA) with secure authentication for managing settings and viewing analytics.

## Glossary

- **ShieldUI_Extension**: The browser extension component (Manifest V3) that monitors web pages
- **ShieldUI_Dashboard**: The Progressive Web App dashboard for configuration and analytics
- **OCR_Service**: DeepSeek OCR service for extracting text from screen captures
- **AI_Analyzer**: Gemini AI service for analyzing extracted text and detecting patterns
- **Dark_Pattern**: Manipulative UI design that tricks users into actions they didn't intend
- **Doomscrolling**: Compulsive scrolling through negative or endless content feeds
- **Passkey**: WebAuthn-based passwordless authentication credential
- **TOTP**: Time-based One-Time Password for two-factor authentication
- **Backend_Server**: Flask-based web server handling API requests and data persistence
- **Database**: SQLite3 database storing user data, settings, and detection logs

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely authenticate to the dashboard using passkeys and TOTP, so that my browsing data and settings remain private and protected.

#### Acceptance Criteria

1. WHEN a new user accesses the dashboard, THE ShieldUI_Dashboard SHALL initiate passkey registration using WebAuthn
2. WHEN passkey registration completes, THE ShieldUI_Dashboard SHALL prompt for TOTP setup with QR code generation
3. WHEN a registered user attempts login, THE ShieldUI_Dashboard SHALL require both passkey authentication and valid TOTP code
4. IF passkey authentication fails, THEN THE ShieldUI_Dashboard SHALL reject the login attempt and log the failure
5. IF TOTP code is invalid or expired, THEN THE ShieldUI_Dashboard SHALL reject the login attempt and maintain session security
6. WHEN authentication succeeds, THE Backend_Server SHALL create a secure session token with appropriate expiration

### Requirement 2: Screen Capture and OCR Processing

**User Story:** As a user, I want the extension to automatically capture and analyze screen content, so that dark patterns can be detected without manual intervention.

#### Acceptance Criteria

1. WHEN the extension loads a webpage, THE ShieldUI_Extension SHALL capture visible screen content at configurable intervals
2. WHEN screen content is captured, THE ShieldUI_Extension SHALL send the image to the OCR_Service
3. WHEN the OCR_Service receives an image, THE OCR_Service SHALL extract all visible text and return structured text data
4. IF OCR processing fails, THEN THE ShieldUI_Extension SHALL log the error and retry with exponential backoff
5. WHEN OCR extraction completes, THE ShieldUI_Extension SHALL pass extracted text to the AI_Analyzer

### Requirement 3: Dark Pattern Detection

**User Story:** As a user, I want the system to identify various dark patterns on websites, so that I can be warned about manipulative design practices.

#### Acceptance Criteria

1. WHEN extracted text is received, THE AI_Analyzer SHALL analyze content for dark pattern indicators
2. THE AI_Analyzer SHALL detect urgency manipulation patterns including countdown timers, limited stock claims, and pressure language
3. THE AI_Analyzer SHALL detect misdirection patterns including hidden costs, confusing navigation, and disguised advertisements
4. THE AI_Analyzer SHALL detect social proof manipulation including fake reviews, inflated popularity claims, and fabricated scarcity
5. THE AI_Analyzer SHALL detect obstruction patterns including difficult unsubscribe processes, hidden cancellation options, and forced continuity
6. WHEN a dark pattern is detected, THE AI_Analyzer SHALL return pattern type, confidence score, and affected page elements
7. WHEN dark pattern detection completes, THE ShieldUI_Extension SHALL display visual warnings to the user
8. WHEN a dark pattern is detected, THE Backend_Server SHALL log the detection with timestamp, URL, pattern type, and confidence score

### Requirement 4: Doomscrolling Prevention

**User Story:** As a user, I want the extension to detect and interrupt doomscrolling behavior on infinite-scroll platforms, so that I can maintain healthier browsing habits.

#### Acceptance Criteria

1. THE ShieldUI_Extension SHALL monitor user scrolling behavior on configured doomscrolling-prone websites
2. WHEN the extension detects infinite-scroll content feeds, THE ShieldUI_Extension SHALL track scroll depth and time spent
3. WHEN scroll time exceeds user-configured thresholds, THE ShieldUI_Extension SHALL display intervention overlays
4. THE ShieldUI_Extension SHALL detect platform-specific infinite-scroll patterns for Instagram Reels, YouTube Shorts, TikTok, Twitter feeds, and Reddit feeds
5. WHEN an intervention is triggered, THE ShieldUI_Extension SHALL provide options to continue, take a break, or close the tab
6. WHEN a user dismisses an intervention, THE Backend_Server SHALL log the interaction with timestamp and user response
7. WHERE doomscrolling prevention is enabled, THE ShieldUI_Extension SHALL allow users to configure time limits per website

### Requirement 5: Extension and Dashboard Communication

**User Story:** As a user, I want my extension and dashboard to stay synchronized, so that settings changes and detection data are consistent across both interfaces.

#### Acceptance Criteria

1. WHEN the extension starts, THE ShieldUI_Extension SHALL authenticate with the Backend_Server using stored credentials
2. WHEN settings are changed in the dashboard, THE Backend_Server SHALL push updates to connected extensions
3. WHEN the extension detects patterns, THE ShieldUI_Extension SHALL send detection events to the Backend_Server
4. WHEN the dashboard requests analytics, THE Backend_Server SHALL retrieve and aggregate detection logs from the Database
5. IF network connectivity is lost, THEN THE ShieldUI_Extension SHALL queue events locally and sync when connection restores

### Requirement 6: Dashboard Configuration Interface

**User Story:** As a user, I want to configure detection sensitivity and intervention thresholds through the dashboard, so that I can customize the system to my preferences.

#### Acceptance Criteria

1. WHEN a user accesses settings, THE ShieldUI_Dashboard SHALL display configuration options for dark pattern detection sensitivity
2. WHEN a user accesses settings, THE ShieldUI_Dashboard SHALL display configuration options for doomscrolling time thresholds per website
3. WHEN a user modifies settings, THE ShieldUI_Dashboard SHALL validate input values before saving
4. WHEN settings are saved, THE Backend_Server SHALL persist changes to the Database
5. WHEN settings are saved, THE Backend_Server SHALL notify all connected extensions of the configuration update

### Requirement 7: Analytics and Reporting

**User Story:** As a user, I want to view analytics about detected patterns and my browsing behavior, so that I can understand my exposure to dark patterns and doomscrolling habits.

#### Acceptance Criteria

1. WHEN a user accesses the analytics page, THE ShieldUI_Dashboard SHALL display total dark patterns detected over time
2. WHEN a user accesses the analytics page, THE ShieldUI_Dashboard SHALL display breakdown of pattern types with frequency counts
3. WHEN a user accesses the analytics page, THE ShieldUI_Dashboard SHALL display doomscrolling statistics including time spent and interventions triggered
4. WHEN a user accesses the analytics page, THE ShieldUI_Dashboard SHALL display most problematic websites ranked by detection frequency
5. WHEN analytics are requested, THE Backend_Server SHALL aggregate data from the Database with appropriate date range filtering

### Requirement 8: Progressive Web App Capabilities

**User Story:** As a user, I want the dashboard to function as a PWA, so that I can install it on my device and access it offline when needed.

#### Acceptance Criteria

1. THE ShieldUI_Dashboard SHALL include a valid web app manifest with appropriate icons and metadata
2. THE ShieldUI_Dashboard SHALL register a service worker for offline functionality
3. WHEN the dashboard is accessed on a supported browser, THE ShieldUI_Dashboard SHALL prompt for installation
4. WHEN installed as a PWA, THE ShieldUI_Dashboard SHALL function offline for viewing cached analytics and settings
5. WHEN network connectivity is restored, THE ShieldUI_Dashboard SHALL sync any pending changes with the Backend_Server

### Requirement 9: Data Persistence and Privacy

**User Story:** As a user, I want my data stored securely and privately, so that my browsing patterns and personal information remain confidential.

#### Acceptance Criteria

1. WHEN user data is stored, THE Backend_Server SHALL encrypt sensitive fields in the Database
2. WHEN authentication credentials are stored, THE Backend_Server SHALL use secure hashing algorithms
3. THE Backend_Server SHALL implement rate limiting on API endpoints to prevent abuse
4. THE Backend_Server SHALL validate and sanitize all user inputs before database operations
5. WHEN a user requests data deletion, THE Backend_Server SHALL remove all associated records from the Database

### Requirement 10: Modular Backend Architecture

**User Story:** As a developer, I want the backend organized with modular blueprints, so that the codebase remains maintainable and extensible.

#### Acceptance Criteria

1. THE Backend_Server SHALL organize API endpoints under an api blueprint
2. THE Backend_Server SHALL organize frontend routes under a frontend blueprint
3. WHEN the application starts, THE Backend_Server SHALL register all blueprints with appropriate URL prefixes
4. THE Backend_Server SHALL use Flask-SQLAlchemy for database operations with proper model definitions
5. THE Backend_Server SHALL use Jinja templating for rendering dashboard HTML pages
