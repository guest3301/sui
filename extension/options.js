document.addEventListener('DOMContentLoaded', async () => {
  const backendUrlInput = document.getElementById('backendUrl');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statusDiv = document.getElementById('status');
  
  const currentUrl = await getBackendUrl();
  backendUrlInput.value = currentUrl;
  
  saveBtn.addEventListener('click', async () => {
    const url = backendUrlInput.value.trim();
    
    if (!url) {
      showStatus('Please enter a valid URL', 'error');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showStatus('URL must start with http:// or https://', 'error');
      return;
    }
    
    try {
      await setBackendUrl(url);
      showStatus('Settings saved successfully!', 'success');
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error');
    }
  });
  
  resetBtn.addEventListener('click', async () => {
    backendUrlInput.value = 'http://localhost:5000';
    await setBackendUrl('http://localhost:5000');
    showStatus('Reset to default (localhost:5000)', 'success');
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }
});
