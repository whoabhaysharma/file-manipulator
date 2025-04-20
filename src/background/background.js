// background.js — Chrome Extension Background Script
// Last Updated: 2025-04-20

// Import PDF generator
import { createPdfWithoutBarcodes, pdfBlobToDataUrl } from '../utils/pdfGenerator';

// --- DEFAULT CONFIG & STATE ---
const DEFAULT_CONFIG = {
  apiKey: '',
  model: 'gemini-2.0-flash',
  filePatterns: ['*.pdf'],
  responseMimeType: 'application/pdf',
  endpointBase: 'https://generativelanguage.googleapis.com'
};

let config = { ...DEFAULT_CONFIG };
let isEnabled = false;
const initiatedDownloads = new Set();

// --- LOGGING ---
const debugLog = (msg, data = {}) =>
  console.log(`[FileProcessor ${new Date().toISOString()}] ${msg}`, data);

// --- STORAGE HELPERS ---
async function loadConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get('config', ({ config: stored }) => {
      if (stored && stored.apiKey) {
        config = { ...config, ...stored };
        debugLog('Loaded config from storage', config);
      } else {
        debugLog('Using default config', config);
      }
      resolve(config);
    });
  });
}

async function getEnabledState() {
  return new Promise(resolve => {
    chrome.storage.local.get('isEnabled', ({ isEnabled: stored }) => {
      isEnabled = Boolean(stored);
      debugLog('Loaded enabled state', { isEnabled });
      resolve(isEnabled);
    });
  });
}

// --- PATTERN MATCHER (glob → regex) ---
function createRegexPatterns(patterns) {
  return patterns.map(pat => {
    const esc = pat
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${esc}$`, 'i');
  });
}

// --- TEXT → DATA URL ---
function textToDataUrl(data, mime = 'application/json') {
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([str], { type: mime });
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

// --- CALL GEMINI API ---
async function processFileWithGemini(buffer, filename) {
  if (!config.apiKey) {
    throw new Error('Gemini API key not set');
  }
  const url = `${config.endpointBase}/v1beta/models/${encodeURIComponent(
    config.model
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  debugLog('Calling Gemini', { url, model: config.model, filename });

  // Base64‑encode the file
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const base64 = btoa(bin);

  // Build request
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
          {
            text: `Extract receipt_id, consignment_id, box_id from ${filename} and return JSON.`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        required: ['receipt_id', 'consignment_id', 'box_id'],
        properties: {
          receipt_id: { type: 'string' },
          consignment_id: { type: 'string' },
          box_id: { type: 'string' }
        }
      }
    }
  };  

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const txt = await resp.text();
  if (!resp.ok) {
    throw new Error(`Gemini error ${resp.status}: ${txt}`);
  }

  const json = JSON.parse(txt);
  const part = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!part) {
    throw new Error('Unexpected Gemini response structure');
  }
  return JSON.parse(part);
}

// --- CORE PROCESS & DOWNLOAD ---
async function processAndDownload(item) {
  try {
    const { finalUrl, filename: origPath, id } = item;
    // 1. Cancel original PDF
    await chrome.downloads.cancel(id);
    debugLog('Cancelled original download', { id });

    // 2. Fetch PDF ourselves
    const resp = await fetch(finalUrl);
    if (!resp.ok) throw new Error(`Fetch failed ${resp.status}`);
    const buffer = await resp.arrayBuffer();
    debugLog('Fetched PDF bytes', { bytes: buffer.byteLength });

    // 3. Gemini → JSON
    const data = await processFileWithGemini(buffer, origPath);
    debugLog('Extracted JSON', data);

    // 4. Generate PDF with text-based barcode representations (ServiceWorker compatible)
    const origFilename = origPath.split(/[/\\]/).pop();
    debugLog('Creating PDF with data', { origFilename });
    const pdfBlob = await createPdfWithoutBarcodes(data, origFilename);
    const dataUrl = await pdfBlobToDataUrl(pdfBlob);

    // 5. Build new filename
    const base = origPath.split(/[/\\]/).pop().replace(/\.[^/.]+$/, '');
    const folder = origPath.replace(/[^/\\]+$/, '');
    const outName = `${folder}${base}_processed.pdf`;

    // 6. Trigger download
    const newId = await chrome.downloads.download({
      url: dataUrl,
      filename: outName,
      saveAs: false,
      conflictAction: 'uniquify'
    });
    initiatedDownloads.add(newId);
    debugLog('Downloaded processed PDF', { newId, outName });
  } catch (err) {
    debugLog('processAndDownload error', err);
  }
}

// --- SHOULD WE PROCESS THIS DOWNLOAD? ---
function shouldProcess(item) {
  if (!isEnabled) return false;
  if (initiatedDownloads.has(item.id)) {
    initiatedDownloads.delete(item.id);
    return false;
  }
  const name = (item.filename || '').split(/[/\\]/).pop();
  return createRegexPatterns(config.filePatterns).some(rx => rx.test(name));
}

// --- INTERCEPT & REPLACE DOWNLOAD ---
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  debugLog('onDeterminingFilename', item);
  if (shouldProcess(item)) {
    processAndDownload(item);
    return true; // Take control, cancel default save
  }
  suggest();      // Let Chrome handle it
});

// --- MESSAGES FOR TOGGLE & CONFIG ---
chrome.runtime.onMessage.addListener((msg, _, send) => {
  if (msg.action === 'toggleState') {
    isEnabled = Boolean(msg.state);
    chrome.storage.local.set({ isEnabled });
    debugLog('Toggled state', { isEnabled });
    send({ success: true, isEnabled });
  } else if (msg.action === 'updateConfig') {
    config = { ...config, ...msg.config };
    chrome.storage.local.set({ config });
    debugLog('Updated config', config);
    send({ success: true });
  }
  return true;
});

// --- BOOTSTRAP ---
(async () => {
  await loadConfig();
  await getEnabledState();
  debugLog('Background script ready', { isEnabled, config });
})();
