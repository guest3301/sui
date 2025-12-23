# ShieldUI Quick Deployment Guide

## Option 1: Local Testing (Fastest - 2 minutes)

### Backend (Flask Server)
```bash
cd ~/NSEW
source venv/bin/activate
python3 run.py
```
Server will run at: `http://localhost:5000`

### Browser Extension
1. Open Chrome/Edge and go to: `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `~/NSEW/extension` folder
5. Extension is now installed and active!

**Test it**: Visit any website with urgency language (e.g., Amazon, booking sites) and click the extension icon.

---

## Option 2: GitHub + Quick Deploy (5 minutes)

### Step 1: Push to GitHub
```bash
cd ~/NSEW

# Initialize git (if not already done)
git init

# Create .gitignore
cat > .gitignore << 'EOF'
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
*.db
*.sqlite3
.env
.vscode/
.idea/
*.log
node_modules/
.hypothesis/
.pytest_cache/
EOF

# Add all files
git add .

# Commit
git commit -m "Initial ShieldUI implementation"

# Create GitHub repo (via GitHub CLI or web)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/shieldui.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy Backend (Choose one)

#### A. Render.com (Free, Easy)
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: shieldui-backend
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT backend.app:create_app()`
6. Add environment variables:
   - `ENCRYPTION_KEY`: (generate random 32-char string)
   - `GEMINI_API_KEY`: (your Google Gemini API key)
7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment
9. Copy your URL: `https://shieldui-backend.onrender.com`

#### B. Railway.app (Free, Fast)
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Railway auto-detects Python
6. Add environment variables (same as above)
7. Deploy! Get URL: `https://shieldui-backend.up.railway.app`

#### C. Fly.io (Free, More Control)
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create app
cd ~/NSEW
flyctl launch --name shieldui-backend

# Deploy
flyctl deploy
```

### Step 3: Configure Extension Backend URL

**Option A: Using Extension Settings (Easiest)**
1. Load the extension in Chrome
2. Right-click extension icon → "Options"
3. Enter your deployed backend URL
4. Click "Save Settings"

**Option B: Edit Before Loading**
Edit `extension/config.js` and change:
```javascript
DEFAULT_BACKEND_URL: 'https://your-backend-url.com'
```

### Step 4: Share Extension
**Option A: Share as ZIP**
```bash
cd ~/NSEW
zip -r shieldui-extension.zip extension/
```
Send `shieldui-extension.zip` to testers. They load it as unpacked extension.

**Option B: GitHub Releases**
1. Go to your GitHub repo
2. Click "Releases" → "Create a new release"
3. Upload the extension folder as a ZIP
4. Testers download and load unpacked

---

## Option 3: Ngrok (Quick Public URL - 1 minute)

### Backend
```bash
# Terminal 1: Start Flask
cd ~/NSEW
source venv/bin/activate
python3 run.py

# Terminal 2: Start ngrok
ngrok http 5000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update extension popup.js line 48.

**Note**: Ngrok URL changes each restart (free tier). Good for quick demos.

---

## Option 4: Docker (Portable)

### Create Dockerfile
```bash
cd ~/NSEW
cat > Dockerfile << 'EOF'
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY run.py .

EXPOSE 5000

CMD ["python", "run.py"]
EOF
```

### Build and Run
```bash
# Build
docker build -t shieldui-backend .

# Run locally
docker run -p 5000:5000 shieldui-backend

# Push to Docker Hub (for sharing)
docker tag shieldui-backend YOUR_USERNAME/shieldui-backend
docker push YOUR_USERNAME/shieldui-backend
```

---

## Testing Checklist

### Backend Tests
- [ ] Server starts: `http://localhost:5000`
- [ ] Auth endpoints work: `curl http://localhost:5000/api/auth/session`
- [ ] Database created: Check for `shieldui.db` file

### Extension Tests
- [ ] Extension loads without errors
- [ ] Popup shows correctly
- [ ] Click extension icon → see stats
- [ ] Visit site with "Limited Time Offer" → warning appears
- [ ] Stats increment when patterns detected
- [ ] Toggle protection on/off works
- [ ] Open Dashboard button works

### Integration Tests
- [ ] Extension can connect to backend
- [ ] Login/Register flow works
- [ ] Detection logs saved to database
- [ ] Analytics display correctly

---

## Quick Demo Sites for Testing

Test the extension on these sites (they often have dark patterns):
- Amazon product pages (urgency: "Only X left in stock")
- Booking.com (urgency: "X people looking at this")
- Any e-commerce site with countdown timers
- News sites with "Breaking News" alerts

---

## Troubleshooting

### Extension not loading
- Check `chrome://extensions/` for errors
- Ensure all files are in the extension folder
- Reload extension after changes

### Backend not starting
```bash
# Check Python version
python3 --version  # Should be 3.12+

# Reinstall dependencies
pip install -r requirements.txt

# Check for port conflicts
lsof -i :5000
```

### CORS errors
- Backend already has CORS enabled
- If issues persist, check browser console
- Ensure backend URL is correct in extension

---

## Recommended: Render.com Deployment (Best for Testing)

**Why Render?**
- ✅ Free tier available
- ✅ Auto-deploys from GitHub
- ✅ HTTPS by default
- ✅ Easy environment variables
- ✅ Logs and monitoring
- ✅ No credit card required

**Steps**:
1. Push code to GitHub (2 min)
2. Connect Render to GitHub (1 min)
3. Configure and deploy (2 min)
4. Update extension with new URL (1 min)
5. Share extension ZIP with testers (1 min)

**Total time: ~7 minutes** ⚡

---

## Need Help?

- Backend issues: Check `backend/app.py` logs
- Extension issues: Check browser console (F12)
- Database issues: Delete `shieldui.db` and restart
- API keys: Get free keys from Hugging Face and Google AI Studio
