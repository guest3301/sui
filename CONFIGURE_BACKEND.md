# Configure Backend URL in Extension

The ShieldUI extension can connect to any backend server (local or deployed). Here's how to configure it:

## Method 1: Extension Settings Page (Recommended)

1. **Open Extension Settings**:
   - Right-click the ShieldUI extension icon
   - Click "Options" or "Settings"
   - OR go to `chrome://extensions/` → Find ShieldUI → Click "Details" → Click "Extension options"

2. **Enter Your Backend URL**:
   - Local development: `http://localhost:5000`
   - Render: `https://your-app.onrender.com`
   - Railway: `https://your-app.up.railway.app`
   - Fly.io: `https://your-app.fly.dev`
   - Ngrok: `https://abc123.ngrok.io`

3. **Click "Save Settings"**

4. **Done!** The extension will now connect to your backend.

## Method 2: Chrome DevTools (Advanced)

1. Open Chrome DevTools (F12)
2. Go to "Application" tab → "Storage" → "Local Storage"
3. Find the ShieldUI extension
4. Add/Edit key: `backendUrl` with your URL as value

## Method 3: Edit config.js (Before Loading)

Before loading the extension, edit `extension/config.js`:

```javascript
const CONFIG = {
  DEFAULT_BACKEND_URL: 'https://your-backend-url.com'  // Change this
};
```

## Testing the Connection

1. Click the extension icon
2. Click "Open Dashboard"
3. If it opens your backend, connection is working!

## Deployment Checklist

### For Backend Deployment:

- [ ] Backend deployed and running
- [ ] CORS enabled for extension origin
- [ ] Environment variables set (ENCRYPTION_KEY, API keys)
- [ ] Database initialized
- [ ] HTTPS enabled (required for production)

### For Extension:

- [ ] Backend URL configured in extension settings
- [ ] Extension reloaded after URL change
- [ ] Test connection by clicking "Open Dashboard"
- [ ] Test dark pattern detection on a website

## Common Issues

### "Failed to fetch" error
- Check if backend URL is correct
- Ensure backend is running
- Check CORS settings in backend
- Verify HTTPS if using production URL

### Extension can't connect
- Make sure URL includes protocol (http:// or https://)
- No trailing slash in URL
- Backend must be accessible from browser

### Dashboard doesn't open
- Check browser console for errors
- Verify backend URL in extension settings
- Try opening URL directly in browser

## Environment-Specific URLs

### Development
```
http://localhost:5000
```

### Staging (Ngrok)
```
https://abc123.ngrok.io
```

### Production (Render)
```
https://shieldui-backend.onrender.com
```

### Production (Railway)
```
https://shieldui-backend.up.railway.app
```

### Production (Fly.io)
```
https://shieldui-backend.fly.dev
```

## Security Notes

- Always use HTTPS in production
- Never commit API keys to git
- Use environment variables for sensitive data
- Backend URL is stored locally in extension storage
- No sensitive data is sent to backend without authentication

## Quick Test

After configuring, test with this command in browser console:

```javascript
chrome.storage.local.get(['backendUrl'], (result) => {
  console.log('Backend URL:', result.backendUrl);
});
```

Should output your configured URL.
