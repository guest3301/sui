# Requirements Document

## Introduction

The Dark Pattern Guardian is a browser extension and web dashboard system that protects users from manipulative UI patterns and excessive social media consumption. The system uses OCR and AI to detect dark patterns in real-time, authenticates users via passkeys and TOTP, and provides intervention mechanisms to prevent doomscrolling behavior.

## Glossary

- **Extension**: The browser extension component (Manifest V3) that runs in the user's browser
- **Dashboard**: The Progressive Web App that provides user management and analytics
- **Backend**: The Flask-based API server that processes requests and manages data
- **OCR_Service**: The DeepSeek OCR service for extracting text from screen captures
- **AI_Analyzer**: The Gemini AI service that analyzes text for dark patterns
- **Auth_System**: The authentication system using passkeys and TOTP
- **Pattern_Detector**: The component that identifies dark patterns from analyzed content
- **Doomscroll_Blocker**: The component that detects and prevents doomscrolling behavior
- **Database**: The SQLite3 database storing user data and detection history

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to securely log into the dashboard using passkeys and TOTP, so that my browsing data and preferences are protected.

#### Acceptance Criteria

1. WHEN a user attempts to log in, THE Auth_System SHALL authenticate using passkey credentials
2. WHEN passkey authentication succeeds, THE Auth_System SHALL require TOTP verification
3. WHEN both authentication factors are valid, THE Auth_System SHALL create a session and grant access
4. WHEN authentication fails, THE Auth_System SHALL return a descriptive error message
5. THE Auth_System SHALL store user credentials securely in the Database

### Requirement 2: Screen Capture and OCR Processing

**User Story:** As a user, I want the extension to extract text from web pages, so that dark patterns can be detected in visual content.

#### Acceptance Criteria

1. WHEN the Extension captures a screen region, THE OCR_Service SHALL extract text from the image
2. WHEN text extraction completes, THE OCR_Service SHALL return structured text data
3. IF the image contains no readable text, THEN THE OCR_Service SHALL return an empty result
4. THE Extension SHALL send captured screens to the Backend for processing
5. THE Backend SHALL integrate with HuggingFace DeepSeek OCR API

### Requirement 3: Dark Pattern Detection

**User Story:** As a user, I want the system to identify dark patterns on websites, so that I can be warned about manipulative UI elements.

#### Acceptance Criteria

1. WHEN extracted text is received, THE AI_Analyzer SHALL process it using Gemini API
2. WHEN the AI_Analyzer completes analysis, THE Pattern_Detector SHALL classify detected patterns
3. THE Pattern_Detector SHALL identify multiple dark pattern types including urgency manipulation, forced continuity, confirmshaming, disguised ads, trick questions, sneak into basket, hidden costs, and bait and switch
4. WHEN a dark pattern is detected, THE Backend SHALL store the detection in the Database
5. WHEN a dark pattern is detected, THE Extension SHALL notify the user with pattern details

### Requirement 4: Doomscrolling Prevention

**User Story:** As a user, I want to be prevented from excessive scrolling on addictive content feeds, so that I can maintain healthy browsing habits.

#### Acceptance Criteria

1. WHEN the Extension detects infinite scroll patterns on social media sites, THE Doomscroll_Blocker SHALL monitor scroll behavior
2. WHEN scroll duration exceeds configured thresholds, THE Doomscroll_Blocker SHALL trigger an intervention
3. THE Doomscroll_Blocker SHALL detect doomscrolling on platforms including Instagram Reels, YouTube Shorts, TikTok, and similar feed-based interfaces
4. WHEN an intervention is triggered, THE Extension SHALL display a blocking overlay with usage statistics
5. THE Extension SHALL allow users to configure time limits and intervention thresholds

### Requirement 5: Browser Extension Core Functionality

**User Story:** As a user, I want a browser extension that runs seamlessly, so that protection is always active while browsing.

#### Acceptance Criteria

1. THE Extension SHALL be built using Manifest V3 specifications
2. WHEN the Extension is installed, THE Extension SHALL register content scripts for target websites
3. WHEN a user visits a monitored website, THE Extension SHALL activate detection mechanisms
4. THE Extension SHALL communicate with the Backend via secure API endpoints
5. THE Extension SHALL store user preferences locally using browser storage APIs

### Requirement 6: Dashboard and Analytics

**User Story:** As a user, I want to view my browsing protection history and statistics, so that I can understand my browsing patterns.

#### Acceptance Criteria

1. THE Dashboard SHALL function as a Progressive Web App
2. WHEN a user accesses the Dashboard, THE Dashboard SHALL display dark pattern detection history
3. WHEN a user accesses the Dashboard, THE Dashboard SHALL display doomscrolling statistics
4. THE Dashboard SHALL render pages using Jinja templating
5. THE Dashboard SHALL provide visualizations of protection metrics over time

### Requirement 7: Backend API Architecture

**User Story:** As a developer, I want a modular Flask backend with clear separation of concerns, so that the system is maintainable and extensible.

#### Acceptance Criteria

1. THE Backend SHALL use Flask with Flask-SQLAlchemy for database operations
2. THE Backend SHALL organize endpoints into blueprints for API and Frontend routes
3. THE Backend SHALL use SQLite3 as the Database
4. WHEN API requests are received, THE Backend SHALL validate authentication tokens
5. THE Backend SHALL provide RESTful endpoints for extension communication and dashboard data retrieval

### Requirement 8: Data Persistence

**User Story:** As a user, I want my detection history and preferences saved, so that I can track patterns over time.

#### Acceptance Criteria

1. THE Database SHALL store user accounts with authentication credentials
2. THE Database SHALL store dark pattern detection records with timestamps and URLs
3. THE Database SHALL store doomscrolling session data with duration and intervention counts
4. THE Database SHALL store user preferences and configuration settings
5. WHEN data is written, THE Backend SHALL ensure data integrity and handle errors gracefully

### Requirement 9: External Service Integration

**User Story:** As a system, I want to integrate with external AI services, so that accurate pattern detection is achieved.

#### Acceptance Criteria

1. THE Backend SHALL integrate with HuggingFace API for DeepSeek OCR processing
2. THE Backend SHALL integrate with Google Gemini API for text analysis
3. WHEN external API calls fail, THE Backend SHALL retry with exponential backoff
4. WHEN external APIs are unavailable, THE Backend SHALL return cached results or graceful error messages
5. THE Backend SHALL securely store API credentials in environment configuration
