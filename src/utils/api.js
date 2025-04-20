/**
 * Utility functions for API communication
 */

/**
 * Process file content with Gemini API
 * @param {string} content - File content to process
 * @param {Object} config - API configuration
 * @returns {Promise<string>} - Processed content
 */
export async function processFileWithGemini(content, config) {
  try {
    // Check if API key is available
    if (!config.apiKey) {
      throw new Error('API key is missing. Please add your Gemini API key in the extension settings.');
    }
    
    // Support for local testing
    let apiUrl;
    if (config.apiKey === 'test-local') {
      apiUrl = 'http://localhost:3000';
      debugLog('Using local mock API', { url: apiUrl });
    } else {
      // Make sure the API key is properly included in the URL
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
      debugLog('Using Gemini API', { url: `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=HIDDEN`, model: config.model });
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
        responseMimeType: config.responseMimeType || 'text/plain',
        responseSchema: responseSchema
      }
    };
    
    debugLog('Sending to API', { apiUrl: `${apiUrl.split('?')[0]}?key=HIDDEN` });
    
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

/**
 * Debug logging utility
 * @param {string} message 
 * @param {*} data 
 */
export function debugLog(message, data = null) {
  const ts = new Date().toISOString();
  console.log(`[File Manipulator ${ts}] ${message}`);
  if (data !== null) console.log('→', data);
} 