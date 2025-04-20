// Content script for barcode generation

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'generateBarcodes') {
    console.log('Content script received generateBarcodes message', message);
    generateBarcodePDF(message.data, message.filename)
      .then(dataUrl => {
        sendResponse({ success: true, dataUrl });
      })
      .catch(error => {
        console.error('Error generating barcode PDF:', error);
        sendResponse({ success: false, error: error.toString() });
      });
    return true; // Indicates we will respond asynchronously
  }
});

/**
 * Generate a PDF with barcodes by calling the backend API
 * @param {Object} data - JSON data with receipt_id, consignment_id, box_id
 * @param {string} filename - Original filename
 * @returns {Promise<string>} - Data URL of the generated PDF
 */
async function generateBarcodePDF(data, filename) {
  try {
    // API endpoint URL
    const API_URL = 'http://localhost:3000/api/generate-barcode';
    
    // Call the API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data, filename })
    });
    
    // Check if request was successful
    if (!response.ok) {
      // Try to parse error response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      } catch (e) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    }
    
    // Get PDF as blob
    const pdfBlob = await response.blob();
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Error in API call:', error);
    throw error;
  }
} 