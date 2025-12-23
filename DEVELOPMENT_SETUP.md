# Development Setup Guide

## 1. Gemini API Key Setup

### Get Your API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Configure the API Key

**Option A: Using Environment Variables (Recommended)**
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your key
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

**Option B: Export in Terminal (Temporary)**
```bash
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
source venv/bin/activate
python3 backend/app.py
```

**Option C: Direct in config.py (Not recommended for production)**
Edit `/home/cafebabe/NSEW/backend/config.py`:
```python
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'your-actual-api-key-here'
```

## 2. Passkey Authentication on Localhost

### Understanding Passkey Requirements
- **WebAuthn** (passkeys) requires HTTPS or localhost
- Localhost is automatically allowed for development
- No special configuration needed for `127.0.0.1` or `localhost`

### Browser Requirements
Passkeys work on:
- ✅ Chrome/Edge 67+ (Windows Hello, Touch ID, Security Keys)
- ✅ Firefox 60+ (with security keys)
- ✅ Safari 14+ (Touch ID on Mac, Face ID on iPhone)

### Development Workflow

1. **Start the Server**:
```bash
cd /home/cafebabe/NSEW
source venv/bin/activate
export GEMINI_API_KEY="your-key-here"
python3 backend/app.py
```

2. **Access via Localhost**:
   - Use: `http://127.0.0.1:5000` or `http://localhost:5000`
   - Do NOT use: IP addresses like `http://172.x.x.x:5000`

3. **Register with Passkey**:
   - Go to: http://127.0.0.1:5000/register
   - Enter username
   - Browser will prompt for biometric/PIN
   - Complete TOTP setup
   - Save the QR code in an authenticator app

4. **Login**:
   - Go to: http://127.0.0.1:5000/login
   - Enter username
   - Use biometric/PIN for passkey
   - Enter 6-digit TOTP code from authenticator

### Troubleshooting Passkeys

**Issue**: "Passkey not supported"
- Ensure you're on localhost or 127.0.0.1 (not IP address)
- Check browser compatibility
- Try using a USB security key instead

**Issue**: "Invalid passkey"
- Clear browser cache and site data
- Re-register the account
- Check browser console for WebAuthn errors

**Issue**: Service Worker Blocking Page Load
```bash
# Clear service workers in DevTools:
# F12 → Application → Service Workers → Unregister
# Then hard refresh: Ctrl+Shift+R
```

## 3. Testing Dark Pattern Detection

### Using the API Directly
```bash
# Get a token first (login)
TOKEN="your-token-here"

# Test detection endpoint
curl -X POST http://127.0.0.1:5000/api/detect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "text": "Only 2 items left! Buy now before they sell out! Limited time offer!",
    "page_elements": []
  }'
```

### Expected Response
```json
{
  "detected": true,
  "pattern_type": "urgency_manipulation",
  "confidence_score": 0.85,
  "description": "Uses artificial urgency tactics",
  "affected_elements": ["Only 2 items left!", "Limited time offer!"]
}
```

## 4. Running the Full Stack

### Backend Only
```bash
cd /home/cafebabe/NSEW
source venv/bin/activate
export GEMINI_API_KEY="your-key-here"
python3 backend/app.py
```

### With Chrome Extension
1. Open Chrome/Edge
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `/home/cafebabe/NSEW/chrome-extension/`
6. Configure backend URL in extension options

## 5. Common Issues

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Database Locked
```bash
# Reset database
rm backend/shieldui.db
python3 backend/app.py  # Will recreate
```

### Missing Dependencies
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## 6. Production Deployment Notes

For production (not localhost):
- Use HTTPS (required for passkeys on non-localhost)
- Set strong SECRET_KEY
- Use environment variables for all sensitive keys
- Set `SESSION_COOKIE_SECURE = True`
- Configure proper CORS origins
- Use production WSGI server (gunicorn/uwsgi)
