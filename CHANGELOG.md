# ShieldUI Changelog

## [Unreleased] - 2024-12-23

### Changed
- **Switched from DeepSeek to Google Gemini for OCR** 
  - Now using Gemini 2.0 Flash for both OCR and AI analysis
  - Simplified API configuration (only need one API key)
  - Better OCR accuracy with Gemini's multimodal capabilities
  - Unified timeout (15s for both OCR and AI)

### Added
- **Configurable Backend URL in Extension**
  - Extension settings page for backend URL configuration
  - Support for local, staging, and production deployments
  - `config.js` for centralized configuration
  - `options.html` and `options.js` for settings UI
  - Setup script (`setup_extension.sh`) for easy configuration

### Improved
- **Documentation**
  - Added `GEMINI_API_SETUP.md` - Complete guide for getting Gemini API key
  - Added `CONFIGURE_BACKEND.md` - Guide for configuring backend URL
  - Added `QUICK_START.md` - Fast deployment guide
  - Updated `README.md` with Gemini references
  - Updated `DEPLOYMENT_GUIDE.md` with simplified setup

### Removed
- DeepSeek OCR dependency (Hugging Face)
- `OCR_API_KEY` environment variable (no longer needed)
- Hardcoded localhost references in extension

## [0.1.0] - 2024-12-23

### Added
- Initial implementation of ShieldUI
- Flask backend with modular blueprint architecture
- SQLAlchemy database models (User, Settings, DetectionLog, DoomscrollLog, Session)
- Passkey + TOTP two-factor authentication
- AES encryption for sensitive data
- Input validation and sanitization
- Google Gemini AI integration for dark pattern detection
- Browser extension (Manifest V3) with:
  - Dark pattern detection
  - Visual warning overlays
  - Statistics tracking
  - Protection toggle
  - Beautiful popup UI
- Property-based testing with Hypothesis (7 tests, all passing)
- Unit tests for authentication endpoints
- Comprehensive documentation

### Technical Details
- Python 3.12+ backend
- Flask 3.0 with CORS support
- SQLite database
- Chrome Extension Manifest V3
- Vanilla JavaScript (no frameworks)
- Property-based testing with Hypothesis

---

## Migration Guide: DeepSeek → Gemini

If you were using an earlier version with DeepSeek:

### 1. Update Environment Variables
**Remove:**
```bash
unset OCR_API_KEY
```

**Keep:**
```bash
export GEMINI_API_KEY="your-gemini-api-key"
export ENCRYPTION_KEY="your-encryption-key"
```

### 2. Get Gemini API Key
Follow the guide in [GEMINI_API_SETUP.md](GEMINI_API_SETUP.md)

### 3. Update Dependencies
```bash
cd ~/NSEW
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Restart Backend
```bash
python3 run.py
```

### 5. Test
Visit a website with urgency language and verify detection works.

---

## Breaking Changes

### v0.1.0 → Unreleased
- `OCR_API_KEY` environment variable removed
- `OCR_API_URL` configuration removed
- OCR service now uses Gemini API URL
- Extension requires backend URL configuration (no longer hardcoded)

---

## Upgrade Instructions

### From v0.1.0
1. Pull latest code: `git pull origin main`
2. Remove `OCR_API_KEY` from environment
3. Ensure `GEMINI_API_KEY` is set
4. Reload extension in Chrome
5. Configure backend URL in extension settings

### Fresh Install
Follow [QUICK_START.md](QUICK_START.md) for complete setup.

---

## Known Issues

- [ ] Analytics API endpoints not yet implemented
- [ ] Settings API endpoints not yet implemented
- [ ] Detection API endpoints not yet implemented
- [ ] Frontend dashboard templates not yet implemented
- [ ] Doomscrolling detection logic not yet implemented
- [ ] PWA service worker not yet implemented

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for detailed progress.

---

## Roadmap

### v0.2.0 (Next Release)
- [ ] Complete Detection API endpoints
- [ ] Complete Settings API endpoints
- [ ] Complete Analytics API endpoints
- [ ] Frontend dashboard with Jinja templates
- [ ] Rate limiting middleware
- [ ] Additional property-based tests

### v0.3.0
- [ ] Doomscrolling detection and intervention
- [ ] Platform-specific scroll monitoring
- [ ] Intervention UI overlays
- [ ] PWA capabilities (service worker, offline mode)

### v1.0.0
- [ ] Complete all features from spec
- [ ] Full test coverage
- [ ] Production-ready deployment
- [ ] Chrome Web Store submission

---

## Contributors

Built with ❤️ using spec-driven development and property-based testing.

---

## License

MIT License - See LICENSE file for details
