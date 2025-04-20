/**
 * Popup script for the File Manipulator extension
 */
import './popup.css';
import { loadConfig, saveConfig, getEnabledState, setEnabledState } from '../utils/storage';
import { debugLog } from '../utils/api';

// DOM elements
let statusDiv;
let toggleButton;
let apiKeyInput;
let filePatternsInput;
let saveConfigButton;
let errorMessage;
let autoSaveCheckbox;

// Initialize the popup
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  statusDiv = document.getElementById('status');
  toggleButton = document.getElementById('toggleButton');
  apiKeyInput = document.getElementById('apiKey');
  filePatternsInput = document.getElementById('filePatterns');
  autoSaveCheckbox = document.getElementById('autoSave');
  saveConfigButton = document.getElementById('saveConfig');
  errorMessage = document.getElementById('errorMessage');
  
  // Load initial extension state
  loadInitialState();
  
  // Load initial configuration
  loadInitialConfig();
  
  // Set up event listeners
  setupEventListeners();
});

/**
 * Load the extension state and update UI
 */
async function loadInitialState() {
  const isEnabled = await getEnabledState();
  updateUI(isEnabled);
}

/**
 * Load configuration and populate form fields
 */
async function loadInitialConfig() {
  const config = await loadConfig();
  
  if (config) {
    apiKeyInput.value = config.apiKey || '';
    filePatternsInput.value = config.filePatterns?.join(', ') || '*.txt, *.pdf, *.csv';
    autoSaveCheckbox.checked = config.autoSave !== undefined ? config.autoSave : true;
    
    // Show warning if API key is missing
    if (!config.apiKey && errorMessage) {
      errorMessage.textContent = 'Please enter a valid Gemini API key to use the extension.';
      errorMessage.style.display = 'block';
    }
  }
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} - Whether the API key is valid
 */
function isValidApiKey(apiKey) {
  // API keys are typically non-empty strings with min length
  // This is a basic validation, adjust as needed for Gemini API keys
  return apiKey && apiKey.length > 10;
}

/**
 * Set up event listeners for the popup
 */
function setupEventListeners() {
  // Toggle extension state
  toggleButton.addEventListener('click', async function() {
    const config = await loadConfig();
    
    // Check if API key is present before enabling
    if (!config.apiKey && errorMessage) {
      errorMessage.textContent = 'Please enter a valid Gemini API key before enabling the extension.';
      errorMessage.style.display = 'block';
      return;
    }
    
    const isEnabled = await getEnabledState();
    const newState = !isEnabled;
    
    await setEnabledState(newState);
    updateUI(newState);
    
    // Notify background script
    chrome.runtime.sendMessage({ 
      action: 'toggleState', 
      state: newState 
    });
  });
  
  // Save configuration
  saveConfigButton.addEventListener('click', async function() {
    // Hide previous error message
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
    
    const apiKey = apiKeyInput.value.trim();
    
    // Validate API key
    if (!isValidApiKey(apiKey) && apiKey !== 'test-local') {
      if (errorMessage) {
        errorMessage.textContent = 'Please enter a valid Gemini API key.';
        errorMessage.style.display = 'block';
      } else {
        alert('Please enter a valid Gemini API key.');
      }
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
      model: 'gemini-2.0-flash',
      filePatterns,
      responseMimeType: 'text/plain',
      autoSave: autoSaveCheckbox.checked
    };
    
    await saveConfig(config);
    debugLog('Configuration saved', { 
      apiKey: 'HIDDEN', 
      model: config.model, 
      patterns: config.filePatterns,
      autoSave: config.autoSave
    });
    
    // Notify background script
    chrome.runtime.sendMessage({ 
      action: 'updateConfig', 
      config 
    });
    
    // Update UI to show config was saved
    saveConfigButton.textContent = 'Configuration Saved!';
    setTimeout(() => {
      saveConfigButton.textContent = 'Save Configuration';
    }, 2000);
  });
}

/**
 * Update UI based on the extension state
 * @param {boolean} isEnabled - Whether the extension is enabled
 */
function updateUI(isEnabled) {
  statusDiv.textContent = isEnabled ? 'File manipulation is active' : 'File manipulation is inactive';
  statusDiv.className = `status ${isEnabled ? 'active' : 'inactive'}`;
  toggleButton.textContent = isEnabled ? 'Disable File Manipulation' : 'Enable File Manipulation';
} 