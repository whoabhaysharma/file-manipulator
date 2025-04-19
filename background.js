// --- Configuration ---
let isEnabled = false;
const initiatedDownloads = new Set();
let config = {
  apiKey: "",
  model: "gemini-2.0-flash",
  filePatterns: ["*.txt", "*.pdf", "*.csv"],
  responseMimeType: "application/json"
};

// --- Utils ---
function debugLog(message, data = null) {
  const ts = new Date().toISOString();
  console.log(`[File Manipulator ${ts}] ${message}`);
  if (data !== null) console.log('→', data);
}

function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['config'], function(result) {
      if (result.config) {
        config = result.config;
        debugLog('Loaded config', config);
      } else {
        // Load default config from file
        fetch('config.json')
          .then(response => response.json())
          .then(defaultConfig => {
            config = defaultConfig;
            chrome.storage.local.set({ config });
            debugLog('Loaded default config', config);
          })
          .catch(err => debugLog('Error loading default config', err));
      }
      resolve(config);
    });
  });
}

function createRegexPatterns(patterns) {
  return patterns.map(pattern => {
    // Convert glob pattern to regex
    const regexStr = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regexStr, 'i');
  });
}

function textToDataUrl(text, mime = 'text/plain') {
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

async function readFileAsText(downloadItem) {
  try {
    // Get the download item
    const [downloadInfo] = await chrome.downloads.search({ id: downloadItem.id });
    if (!downloadInfo || !downloadInfo.filename) {
      throw new Error('Download item not found or has no filename');
    }

    // Fetch the file content using fetch API
    const response = await fetch(`file://${downloadInfo.filename}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const content = await response.text();
    return content;
  } catch (error) {
    debugLog('Error reading file', error);
    throw error;
  }
}

async function processFileWithGemini(content) {
  try {
    // Support for local testing
    let apiUrl;
    if (config.apiKey === 'test-local') {
      apiUrl = 'http://localhost:3000';
      debugLog('Using local mock API', { url: apiUrl });
    } else {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${'AIzaSyCQLyuYI0gTkV8w-b4_wv-qdwbLweOAwsI'}`;
      debugLog('Using Gemini API', { url: apiUrl, model: config.model });
    }
    
    const responseSchema = {
      type: "OBJECT",
      required: ["reciept_id", "consignment_id", "box_id"],
      properties: {
        reciept_id: {
          type: "STRING",
        },
        consignment_id: {
          type: "STRING",
        },
        box_id: {
          type: "STRING",
        },
      },
    };
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: content,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema
      }
    };
    
    debugLog('Sending to API', { apiUrl });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const responseData = await response.json();
    debugLog('Received response from API', responseData);
    
    // Extract the JSON content from the response
    if (responseData.candidates && 
        responseData.candidates[0] && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts[0]) {
      return responseData.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    debugLog('Error processing with API', error);
    throw error;
  }
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
  const patterns = createRegexPatterns(config.filePatterns);
  
  for (const regex of patterns) {
    if (regex.test(name)) {
      debugLog('→ Filename matches pattern', { name, pattern: regex });
      return true;
    }
  }
  
  debugLog('→ Filename does not match any pattern', { name });
  return false;
}

async function cancelOriginal(id) {
  await chrome.downloads.cancel(id);
  debugLog('Cancelled original download', { id });
}

async function processAndDownload(downloadItem) {
  try {
    // First, we need to access the file content
    const content = await readFileAsText(downloadItem);
    debugLog('File content read', { size: content.length });
    
    // Process the content with Gemini API
    const processedContent = await processFileWithGemini(content);
    debugLog('Processed content received', { processed: processedContent });
    
    // Create a new file with the processed content
    const name = downloadItem.filename.split(/[/\\]/).pop() || 'file.txt';
    const newName = `processed_${name.replace(/\.[^.]+$/, '')}.txt`;
    
    const dataUrl = await textToDataUrl(processedContent, 'text/plain');
    
    chrome.downloads.download({
      url: dataUrl,
      filename: newName,
      saveAs: false
    }, newId => {
      if (chrome.runtime.lastError || !newId) {
        debugLog('Failed to start processed download', chrome.runtime.lastError);
        return;
      }
      initiatedDownloads.add(newId);
      debugLog('Processed download started', { id: newId, newName });
    });
  } catch (error) {
    debugLog('Error in processAndDownload', error);
  }
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

  // Let the original download proceed, but we'll process it after completion
  debugLog('Will process after download completes', { id: downloadItem.id });
  
  // Track this download to process it when complete
  chrome.downloads.onChanged.addListener(function onDownloadChanged(delta) {
    if (delta.id !== downloadItem.id) return;
    
    if (delta.state && delta.state.current === 'complete') {
      debugLog('Original download completed, processing now', { id: downloadItem.id });
      chrome.downloads.onChanged.removeListener(onDownloadChanged);
      
      // Now process the downloaded file
      processAndDownload(downloadItem);
    }
  });
  
  // Let the original download proceed
  suggest();
}

function onMessage(message) {
  if (message.action === 'toggleState') {
    isEnabled = Boolean(message.state);
    debugLog(`Extension ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
  } else if (message.action === 'updateConfig') {
    config = message.config;
    chrome.storage.local.set({ config });
    debugLog('Updated config', config);
  }
}

async function init() {
  debugLog('Background service worker initializing');
  
  // Load config
  await loadConfig();
  
  // Check if extension is enabled from storage
  chrome.storage.local.get(['isEnabled'], function(result) {
    isEnabled = result.isEnabled || false;
    debugLog(`Extension state loaded: ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
  });
  
  chrome.runtime.onMessage.addListener(onMessage);
  chrome.downloads.onDeterminingFilename.addListener(onDeterminingFilename);
  
  debugLog('Background service worker initialized');
}

init();
