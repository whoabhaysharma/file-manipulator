// --- Configuration ---
let isEnabled = false;
const initiatedDownloads = new Set();

// Only intercept *.pdf filenames
const FILENAME_REGEX = /\.pdf$/i;
const REPLACEMENT_CONTENT = `This is a test PDF stub.
It will help us verify if the File Manipulator extension is working correctly.
Download this file while the extension is enabled to see the modification in action.`;
const MIME_TYPE = 'application/pdf';

// --- Utils ---
function debugLog(message, data = null) {
  const ts = new Date().toISOString();
  console.log(`[File Manipulator ${ts}] ${message}`);
  if (data !== null) console.log('→', data);
}

function textToDataUrl(text, mime = MIME_TYPE) {
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

// --- Core Handlers ---
function shouldProcess(downloadItem) {
  debugLog('shouldProcess()', {
    isEnabled,
    id: downloadItem.id,
    filename: downloadItem.filename
  });
  if (!isEnabled) {
    debugLog('→ Extension disabled');
    return false;
  }
  if (initiatedDownloads.has(downloadItem.id)) {
    debugLog('→ Skipping our own download', { id: downloadItem.id });
    initiatedDownloads.delete(downloadItem.id);
    return false;
  }
  const name = (downloadItem.filename || '').split(/[/\\]/).pop();
  const match = FILENAME_REGEX.test(name);
  debugLog('→ Filename check', { name, match });
  return match;
}

async function cancelOriginal(id) {
  await chrome.downloads.cancel(id);
  debugLog('Cancelled original download', { id });
}

function downloadReplacement(originalFilename) {
  const name = originalFilename.split(/[/\\]/).pop() || 'file.pdf';
  const newName = `modified_${name}`;
  debugLog('Starting replacement download', { newName });

  textToDataUrl(REPLACEMENT_CONTENT)
    .then(dataUrl => {
      chrome.downloads.download({
        url: dataUrl,
        filename: newName,
        saveAs: false
      }, newId => {
        if (chrome.runtime.lastError || !newId) {
          debugLog('Failed to start replacement', chrome.runtime.lastError);
          return;
        }
        initiatedDownloads.add(newId);
        debugLog('Replacement download started', { id: newId, newName });
      });
    })
    .catch(err => debugLog('Error generating data URL', err));
}

// This fires *before* Chrome shows the save dialog (or auto‐saves)
function onDeterminingFilename(downloadItem, suggest) {
  debugLog('onDeterminingFilename()', {
    id: downloadItem.id,
    defaultFilename: downloadItem.filename
  });

  if (!shouldProcess(downloadItem)) {
    // let Chrome proceed normally
    suggest();
    return;
  }

  // cancel & replace
  cancelOriginal(downloadItem.id)
    .catch(err => debugLog('Error cancelling original', err))
    .finally(() => downloadReplacement(downloadItem.filename));

  // prevent the original from ever saving
  suggest({ cancel: true });
}

function onMessage(message) {
  if (message.action === 'toggleState') {
    isEnabled = Boolean(message.state);
    debugLog(`Extension ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
  }
}

function init() {
  debugLog('Background service worker initialized');
  chrome.runtime.onMessage.addListener(onMessage);
  chrome.downloads.onDeterminingFilename.addListener(onDeterminingFilename);
}

init();
