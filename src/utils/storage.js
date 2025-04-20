/**
 * Utility functions for Chrome storage operations
 */
import { debugLog } from './api';

/**
 * Load configuration from storage or default config
 * @returns {Promise<Object>} - Configuration object
 */
export function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['config'], function(result) {
      if (result.config) {
        debugLog('Loaded config', result.config);
        resolve(result.config);
      } else {
        // Load default config from file
        fetch('config.json')
          .then(response => response.json())
          .then(defaultConfig => {
            chrome.storage.local.set({ config: defaultConfig });
            debugLog('Loaded default config', defaultConfig);
            resolve(defaultConfig);
          })
          .catch(err => {
            debugLog('Error loading default config', err);
            // Fallback default config
            const fallbackConfig = {
              apiKey: "",
              model: "gemini-2.0-flash",
              filePatterns: ["*.txt", "*.pdf", "*.csv"],
              responseMimeType: "text/plain",
              autoSave: true
            };
            resolve(fallbackConfig);
          });
      }
    });
  });
}

/**
 * Save configuration to storage
 * @param {Object} config - Configuration to save
 * @returns {Promise<Object>} - Saved configuration
 */
export function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ config }, () => {
      debugLog('Saved config', config);
      resolve(config);
    });
  });
}

/**
 * Get extension enabled state
 * @returns {Promise<boolean>} - Enabled state
 */
export function getEnabledState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['isEnabled'], function(result) {
      const isEnabled = result.isEnabled || false;
      resolve(isEnabled);
    });
  });
}

/**
 * Set extension enabled state
 * @param {boolean} state - New enabled state
 * @returns {Promise<boolean>} - Updated enabled state
 */
export function setEnabledState(state) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ isEnabled: state }, () => {
      debugLog('Extension state set to', state);
      resolve(state);
    });
  });
} 