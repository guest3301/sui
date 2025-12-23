# 🚀 ShieldUI Quick Start Guide

## 🎯 Goal
Get ShieldUI running locally in **2 minutes**, or deployed in **10 minutes**.

---

## ⚡ Local Testing (2 minutes)

### 1. Start Backend
```bash
cd ~/NSEW
source venv/bin/activate
python3 run.py
```
✅ Backend running at: http://localhost:5000

### 2. Load Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select `~/NSEW/extension` folder
5. ✅ Extension loaded!

### 3. Test It
- Click the ShieldUI extension icon
- Visit any e-commerce site (Amazon, Booking.com)
- Watch for dark pattern warnings! 🛡️

---

## 🌐 Deploy to Production (10 minutes)

### Option 1: Render.com (Recommended)

**Step 1: Push to GitHub**
```bash
cd ~/NSEW
git init
git add .
git commit -m "ShieldUI initial commit"
git remote add origin https://github.com/YOUR_USERNAME/shieldui.git
git push -u origin main
```

**Step 2: Deploy on Render**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repo
5. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT backend.app:create_app()`
6. Add environment variables:
   ```
   ENCRYPTION_KEY=your-random-32-char-key
   GEMINI_API_KEY=your-google-gemini-key
   ```
7. Click "Create Web Service"
8. Wait 3 minutes ⏱️
9. Copy your URL: `https://shieldui-backend.onrender.com`

**Step 3: Configure Extension**
```bash
./setup_extension.sh
# Enter your Render URL when prompted
```

**Step 4: Share Extension**
- Share `shieldui-extension.zip` with testers
- Or commit extension to GitHub for others to clone

✅ **Done!** Your ShieldUI is live!

---

## 🔧 Configuration

### Backend URL
The extension can connect to any backend:

**Method 1: Extension Settings**
1. Right-click extension icon → "Options"
2. Enter backend URL
3. Save

**Method 2: Setup Script**
```bash
./setup_extension.sh
```

**Method 3: Manual Edit**
Edit `extension/config.js`:
```javascript
DEFAULT_BACKEND_URL: 'https://your-backend.com'
```

### Environment Variables
Create `.env` file in project root:
```bash
ENCRYPTION_KEY=your-32-char-encryption-key
GEMINI_API_KEY=your-google-gemini-api-key
```

---

## 📋 Deployment Checklist

### Backend
- [ ] Code pushed to GitHub
- [ ] Deployed on Render/Railway/Fly.io
- [ ] Environment variables configured
- [ ] Backend URL is HTTPS
- [ ] Backend accessible from browser

### Extension
- [ ] Backend URL configured
- [ ] Extension loaded in Chrome
- [ ] Tested on a website
- [ ] Stats updating correctly
- [ ] Dashboard opens correctly

---

## 🧪 Testing

### Test Dark Pattern Detection
Visit these sites and watch for warnings:
- Amazon (urgency: "Only X left")
- Booking.com (urgency: "X people viewing")
- Any site with countdown timers
- Flash sale websites

### Test Extension Features
- [ ] Click extension icon → popup shows
- [ ] Stats display (patterns blocked, time saved)
- [ ] Toggle protection on/off
- [ ] Open dashboard button works
- [ ] Settings page accessible

### Test Backend
```bash
# Check health
curl https://your-backend.com/api/auth/session

# Should return 401 (expected - no auth)
```

---

## 🐛 Troubleshooting

### Extension not loading
```bash
# Check for errors in chrome://extensions/
# Reload extension after changes
```

### Backend not starting
```bash
# Check Python version
python3 --version  # Should be 3.12+

# Reinstall dependencies
pip install -r requirements.txt

# Check logs
python3 run.py
```

### Can't connect to backend
1. Verify backend URL in extension settings
2. Check backend is running
3. Open browser console (F12) for errors
4. Ensure CORS is enabled (already configured)

### No patterns detected
- Visit sites with urgency language
- Check extension is active (icon should show)
- Open browser console for logs
- Verify protection is enabled in popup

---

## 📚 Documentation

- **Full Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Backend Configuration**: [CONFIGURE_BACKEND.md](CONFIGURE_BACKEND.md)
- **Implementation Status**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- **Project README**: [README.md](README.md)

---

## 🎉 Success!

If you can:
1. ✅ See the extension popup
2. ✅ Visit a website and see pattern warnings
3. ✅ Open the dashboard
4. ✅ Toggle protection on/off

**You're all set!** 🛡️

---

## 🆘 Need Help?

- Check browser console (F12) for errors
- Check backend logs
- Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Ensure all environment variables are set

---

**Built with ❤️ using spec-driven development**
