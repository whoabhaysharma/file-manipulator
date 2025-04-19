let isEnabled = false;
const initiatedDownloads = new Set(); // Track downloads initiated by the extension

const testFileContent = `This is a test file.
It will help us verify if the File Manipulator extension is working correctly.
Download this file while the extension is enabled to see the modification in action.`;

// Log helper
function debugLog(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[File Manipulator ${timestamp}] ${message}`);
  if (data) console.log('Data:', data);
}

// Create blob URL (as data URL since createObjectURL isn't available in service workers)
function createBlobUrl(content, type = 'text/plain') {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([content], { type });
      const reader = new FileReader();

      reader.onloadend = () => resolve(reader.result); // resolves to a base64 data URL
      reader.onerror = (error) => reject(error);

      reader.readAsDataURL(blob);
    } catch (err) {
      debugLog('Error in createBlobUrl:', err);
      reject(err);
    }
  });
}

debugLog('Extension background script loaded');

// Listen for popup toggle
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'toggleState') {
    isEnabled = message.state;
    debugLog(`Extension state changed to: ${isEnabled ? 'enabled' : 'disabled'}`);
  }
});

// Intercept downloads
chrome.downloads.onCreated.addListener(async (downloadItem) => {
  debugLog('Download intercepted:', downloadItem);

  // Skip if initiated by our extension
  if (initiatedDownloads.has(downloadItem.id)) {
    debugLog('Skipping our own download', { id: downloadItem.id });
    initiatedDownloads.delete(downloadItem.id);
    return;
  }

  if (!isEnabled) {
    debugLog('Extension disabled, letting download proceed');
    return;
  }

  try {
    await chrome.downloads.cancel(downloadItem.id);
    debugLog('Original download cancelled', { id: downloadItem.id });

    const blobUrl = await createBlobUrl(testFileContent);
    const originalFilename = downloadItem.filename || 'downloaded_file.txt';
    const cleanFilename = originalFilename.split('/').pop() || 'downloaded_file.txt';

    chrome.downloads.download({
      url: blobUrl,
      filename: `modified_${cleanFilename}`,
      saveAs: false // Set to true if you want the "Save As" dialog
    }, (newDownloadId) => {
      if (chrome.runtime.lastError || !newDownloadId) {
        debugLog('Download error or user cancelled:', chrome.runtime.lastError);
        return;
      }

      debugLog('Modified download started', { id: newDownloadId });
      initiatedDownloads.add(newDownloadId);
    });

  } catch (error) {
    debugLog('Error processing file:', {
      error: error.message,
      stack: error.stack
    });
    console.error('Error:', error);
  }
});
