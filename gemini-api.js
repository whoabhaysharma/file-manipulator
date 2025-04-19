// Utility function to process file content using the Gemini API
async function processWithGemini(content, apiKey, model = 'gemini-2.0-flash') {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
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
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Extract the JSON content from the response
    if (responseData.candidates && 
        responseData.candidates[0] && 
        responseData.candidates[0].content && 
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts[0]) {
      return responseData.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Error processing with Gemini:', error);
    throw error;
  }
}

export { processWithGemini }; 