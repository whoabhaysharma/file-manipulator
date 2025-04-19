document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const toggleButton = document.getElementById('toggleButton');
  
  // Check initial state
  chrome.storage.local.get(['isEnabled'], function(result) {
    const isEnabled = result.isEnabled || false;
    updateUI(isEnabled);
  });

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

  function updateUI(isEnabled) {
    statusDiv.textContent = isEnabled ? 'File manipulation is active' : 'File manipulation is inactive';
    statusDiv.className = `status ${isEnabled ? 'active' : 'inactive'}`;
    toggleButton.textContent = isEnabled ? 'Disable File Manipulation' : 'Enable File Manipulation';
  }
}); 