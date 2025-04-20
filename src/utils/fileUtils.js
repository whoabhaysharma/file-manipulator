/**
 * Utility functions for file operations
 */
import { debugLog } from './api';

/**
 * Convert text content to a data URL
 * @param {string} text - Text content
 * @param {string} mime - MIME type
 * @returns {Promise<string>} - Data URL
 */
export function textToDataUrl(text, mime = 'text/plain') {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([text], { type: mime });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror   = () => reject(reader.error);
      reader.readAsDataURL(blob);
    } catch (err) {
      debugLog('textToDataUrl error', err);
      reject(err);
    }
  });
}

/**
 * Read file as text
 * @param {string} filePath - Full path to file
 * @returns {Promise<string>} - File content
 */
export async function readFileFromPath(filePath) {
  try {
    debugLog('Reading file from path', { filePath });
    
    // Try using fetch API first
    try {
      const response = await fetch(`file://${filePath}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      return await response.text();
    } catch (fetchError) {
      debugLog('Fetch failed, trying XMLHttpRequest', fetchError);
      
      // Fall back to XMLHttpRequest
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `file://${filePath}`, true);
        xhr.onload = function() {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Failed to load file: ${xhr.statusText}`));
          }
        };
        xhr.onerror = function() {
          reject(new Error('Failed to load file'));
        };
        xhr.send();
      });
    }
  } catch (error) {
    debugLog('Error reading file from path', error);
    throw error;
  }
}

/**
 * Wait for a download to complete
 * @param {number} downloadId - ID of the download
 * @returns {Promise<Object>} - Download item after completion
 */
export function waitForDownloadComplete(downloadId) {
  return new Promise((resolve, reject) => {
    const listener = function(delta) {
      if (delta.id === downloadId && delta.state && delta.state.current === 'complete') {
        chrome.downloads.onChanged.removeListener(listener);
        chrome.downloads.search({ id: downloadId }, (results) => {
          if (results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error('Download completed but item not found'));
          }
        });
      } else if (delta.id === downloadId && delta.error) {
        chrome.downloads.onChanged.removeListener(listener);
        reject(new Error(`Download failed: ${delta.error.current}`));
      }
    };
    
    chrome.downloads.onChanged.addListener(listener);
    
    // Set a timeout in case the download takes too long
    setTimeout(() => {
      chrome.downloads.onChanged.removeListener(listener);
      reject(new Error('Download timeout after 60 seconds'));
    }, 60000); // 1 minute timeout
  });
}

/**
 * Create regex patterns from glob patterns
 * @param {string[]} patterns - Glob patterns
 * @returns {RegExp[]} - Regex patterns
 */
export function createRegexPatterns(patterns) {
  return patterns.map(pattern => {
    // Convert glob pattern to regex
    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regexStr, 'i');
  });
} 