document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const toggleButton = document.getElementById('toggleButton');
  const apiKeyInput = document.getElementById('apiKey');
  const filePatternsInput = document.getElementById('filePatterns');
  const saveConfigButton = document.getElementById('saveConfig');
  
  // Load initial extension state
  chrome.storage.local.get(['isEnabled'], function(result) {
    const isEnabled = result.isEnabled || false;
    updateUI(isEnabled);
  });
  
  // Load initial configuration
  loadConfig();
  
  toggleButton.addEventListener('click', function() {
    chrome.storage.local.get(['isEnabled'], function(result) {
      const newState = !result.isEnabled;
      chrome.storage.local.set({ isEnabled: newState }, function() {
        updateUI(newState);
        // Notify background script
        chrome.runtime.sendMessage({ action: 'toggleState', state: newState });
      });
    });
  });
  
  saveConfigButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('Please enter a valid Gemini API key');
      return;
    }
    
    const patternsText = filePatternsInput.value.trim();
    let filePatterns = ['*.txt', '*.pdf', '*.csv']; // defaults
    
    if (patternsText) {
      filePatterns = patternsText.split(',')
        .map(pattern => pattern.trim())
        .filter(pattern => pattern.length > 0);
    }
    
    const config = {
      apiKey,
      model: 'gemini-2.0-flash', // Using default from your example
      filePatterns,
      responseMimeType: 'application/json'
    };
    
    chrome.storage.local.set({ config }, function() {
      // Notify background script
      chrome.runtime.sendMessage({ action: 'updateConfig', config });
      
      // Update UI to show config was saved
      saveConfigButton.textContent = 'Configuration Saved!';
      setTimeout(() => {
        saveConfigButton.textContent = 'Save Configuration';
      }, 2000);
    });
  });
  
  function loadConfig() {
    chrome.storage.local.get(['config'], function(result) {
      if (result.config) {
        const config = result.config;
        apiKeyInput.value = config.apiKey || '';
        filePatternsInput.value = config.filePatterns?.join(', ') || '*.txt, *.pdf, *.csv';
      } else {
        // Load default config from file
        fetch('config.json')
          .then(response => response.json())
          .then(defaultConfig => {
            apiKeyInput.value = defaultConfig.apiKey || '';
            filePatternsInput.value = defaultConfig.filePatterns?.join(', ') || '*.txt, *.pdf, *.csv';
          })
          .catch(err => console.error('Error loading default config', err));
      }
    });
  }
  
  function updateUI(isEnabled) {
    statusDiv.textContent = isEnabled ? 'File manipulation is active' : 'File manipulation is inactive';
    statusDiv.className = `status ${isEnabled ? 'active' : 'inactive'}`;
    toggleButton.textContent = isEnabled ? 'Disable File Manipulation' : 'Enable File Manipulation';
  }
}); 