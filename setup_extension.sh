#!/bin/bash

echo "🛡️  ShieldUI Extension Setup"
echo "=============================="
echo ""

read -p "Enter your backend URL (e.g., https://your-backend.com): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL cannot be empty"
    exit 1
fi

if [[ ! "$BACKEND_URL" =~ ^https?:// ]]; then
    echo "❌ URL must start with http:// or https://"
    exit 1
fi

echo ""
echo "📝 Configuring extension with backend: $BACKEND_URL"

cat > extension/config.js << EOF
const CONFIG = {
  BACKEND_URL: typeof chrome !== 'undefined' && chrome.storage 
    ? null 
    : '$BACKEND_URL',
  
  DEFAULT_BACKEND_URL: '$BACKEND_URL'
};

async function getBackendUrl() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.local.get(['backendUrl']);
      return result.backendUrl || CONFIG.DEFAULT_BACKEND_URL;
    } catch (error) {
      console.error('Error getting backend URL:', error);
      return CONFIG.DEFAULT_BACKEND_URL;
    }
  }
  return CONFIG.BACKEND_URL || CONFIG.DEFAULT_BACKEND_URL;
}

async function setBackendUrl(url) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    await chrome.storage.local.set({ backendUrl: url });
  }
}
EOF

echo "✅ Extension configured!"
echo ""
echo "📦 Creating extension package..."

cd extension
zip -r ../shieldui-extension.zip . -x "*.DS_Store"
cd ..

echo "✅ Extension packaged: shieldui-extension.zip"
echo ""
echo "🚀 Next steps:"
echo "1. Load extension in Chrome:"
echo "   - Go to chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked'"
echo "   - Select the 'extension' folder"
echo ""
echo "2. Or share the ZIP file:"
echo "   - Send shieldui-extension.zip to testers"
echo "   - They can extract and load it as unpacked extension"
echo ""
echo "3. Configure backend URL in extension:"
echo "   - Right-click extension icon → Options"
echo "   - Verify/update backend URL: $BACKEND_URL"
echo ""
echo "✨ Setup complete!"
