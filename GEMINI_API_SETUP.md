# Google Gemini API Setup Guide

ShieldUI uses Google Gemini 2.0 for both OCR (text extraction from images) and AI analysis (dark pattern detection). Here's how to get your API key.

## Get Your Gemini API Key (Free)

### Step 1: Go to Google AI Studio
Visit: https://aistudio.google.com/

### Step 2: Sign In
- Sign in with your Google account
- Accept the terms of service

### Step 3: Get API Key
1. Click "Get API key" in the left sidebar
2. Click "Create API key"
3. Select "Create API key in new project" (or choose existing project)
4. Copy your API key (starts with `AIza...`)

### Step 4: Configure ShieldUI

**Option A: Environment Variable (Recommended)**
```bash
export GEMINI_API_KEY="AIzaSy..."
```

**Option B: .env File**
Create a `.env` file in the project root:
```bash
GEMINI_API_KEY=AIzaSy...
ENCRYPTION_KEY=your-32-char-random-key
```

**Option C: Direct in Config (Development Only)**
Edit `backend/config.py`:
```python
GEMINI_API_KEY = 'AIzaSy...'
```

## API Limits (Free Tier)

Google Gemini offers generous free tier limits:

### Gemini 2.0 Flash (Used by ShieldUI)
- **Rate Limit**: 15 requests per minute (RPM)
- **Daily Limit**: 1,500 requests per day
- **Token Limit**: 1 million tokens per minute
- **Cost**: FREE

### What This Means for ShieldUI
- Can process ~1,500 screenshots per day
- Perfect for personal use and testing
- Upgrade to paid tier if needed for production

## Testing Your API Key

### Test 1: Quick Test
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts":[{"text": "Hello"}]
    }]
  }'
```

Should return a JSON response with generated text.

### Test 2: OCR Test
```bash
# From project root
cd ~/NSEW
source venv/bin/activate
python3 -c "
from backend.services.ocr_service import OCRService
import base64

# Test with a simple text image
result = OCRService.extract_text(b'test_image_data')
print(result)
"
```

### Test 3: Full Integration Test
```bash
# Start the backend
python3 run.py

# In another terminal, test the endpoint
curl http://localhost:5000/api/auth/session
```

## Troubleshooting

### "API key not valid"
- Check that you copied the full key (starts with `AIza`)
- Ensure no extra spaces or quotes
- Verify the key is enabled in Google AI Studio

### "Quota exceeded"
- You've hit the free tier limit (15 RPM or 1,500/day)
- Wait a minute and try again
- Consider upgrading to paid tier

### "Permission denied"
- Enable the Generative Language API in Google Cloud Console
- Go to: https://console.cloud.google.com/apis/library
- Search for "Generative Language API"
- Click "Enable"

### "Model not found"
- Ensure you're using the correct model name
- ShieldUI uses: `gemini-2.0-flash-exp`
- Check Google AI Studio for available models

## Upgrading to Paid Tier

If you need more capacity:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Enable billing for your project
3. Paid tier limits:
   - **Rate Limit**: 1,000 RPM
   - **Daily Limit**: Unlimited
   - **Pricing**: $0.075 per 1M input tokens, $0.30 per 1M output tokens

For ShieldUI usage, this is extremely affordable (~$0.01 per 1,000 screenshots).

## Security Best Practices

### ✅ DO:
- Store API key in environment variables
- Use `.env` file (add to `.gitignore`)
- Rotate keys periodically
- Use separate keys for dev/staging/production

### ❌ DON'T:
- Commit API keys to git
- Share keys publicly
- Use production keys in development
- Hardcode keys in source code

## Alternative: Use Gemini Pro

If you need higher quality (but slower):

Edit `backend/config.py`:
```python
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent'
```

Trade-offs:
- **Pro**: Better accuracy, more context
- **Con**: Slower, more expensive, lower rate limits

## Monitoring Usage

### Check Usage in Google AI Studio
1. Go to https://aistudio.google.com/
2. Click "Usage" in sidebar
3. View requests, tokens, and quota

### Monitor in ShieldUI
Check backend logs for API calls:
```bash
tail -f backend.log | grep "Gemini"
```

## Getting Help

### Google AI Studio
- Documentation: https://ai.google.dev/
- Community: https://discuss.ai.google.dev/

### ShieldUI Issues
- Check backend logs
- Verify API key is set correctly
- Test with curl commands above
- Review error messages in browser console

## Summary

1. ✅ Get free API key from https://aistudio.google.com/
2. ✅ Set `GEMINI_API_KEY` environment variable
3. ✅ Test with curl or Python
4. ✅ Start using ShieldUI!

**Free tier is perfect for personal use and testing. Upgrade only if needed.**

---

**Need help?** Check the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for full setup instructions.
