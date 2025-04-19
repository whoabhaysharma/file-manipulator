// Simple mock Gemini API for testing
// Run with: node test-api.js

const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    // Handle CORS preflight
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        console.log('Received request:', request);
        
        // Extract text from the request
        const inputText = request.contents?.[0]?.parts?.[0]?.text || '';
        console.log('Input text:', inputText);
        
        // Extract receipt ID, consignment ID, and box ID from the input text
        const receiptMatch = inputText.match(/Receipt #: (\w+)/i) || ['', 'unknown'];
        const consignmentMatch = inputText.match(/Consignment Info: (\w+[-]\w+[-]\w+)/i) || ['', 'unknown'];
        const boxMatch = inputText.match(/Box ID: (\w+[-]\w+)/i) || ['', 'unknown'];
        
        const mockResponse = {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      reciept_id: receiptMatch[1],
                      consignment_id: consignmentMatch[1],
                      box_id: boxMatch[1]
                    }, null, 2)
                  }
                ],
                role: "model"
              },
              finishReason: "STOP",
              index: 0
            }
          ],
          promptFeedback: {
            blockReason: null
          }
        };
        
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(mockResponse));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

server.listen(PORT, () => {
  console.log(`Mock Gemini API server running at http://localhost:${PORT}`);
  console.log('To use this mock API instead of the real Gemini API:');
  console.log('1. Update your extension\'s config.apiKey to "test-local"');
  console.log('2. Modify background.js to use http://localhost:3000 when apiKey is "test-local"');
}); 