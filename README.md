# File Manipulator Extension

A Chrome extension that extracts data from PDFs and generates formatted PDFs with barcodes.

## Project Structure

This project consists of two main parts:

1. **Chrome Extension** - Frontend part that integrates with the browser
2. **Backend Server** - Node.js server to handle barcode PDF generation

## Setting Up the Project

### Backend Server

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```
   
   Or use the install script:
   ```
   ./install.sh
   ```

3. Start the server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```
   
   The server will run on http://localhost:3000

### Chrome Extension

1. Install dependencies:
   ```
   npm install
   ```

2. Build the extension:
   ```
   npm run build
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Usage

1. Make sure the backend server is running
2. Open a PDF in Chrome
3. Click the extension icon
4. The extension will extract data from the PDF and call the backend API to generate a barcode PDF
5. The barcode PDF will be downloaded automatically

## Architecture

- **Chrome Extension**:
  - Content script extracts data from PDFs and sends it to the backend
  - Background script handles extension lifecycle and user interactions
  - Popup provides user interface
  
- **Backend Server**:
  - Express.js server with REST API
  - Handles barcode generation and PDF creation
  - Returns PDF files to the extension for download

## API Endpoints

- **POST /api/generate-barcode** - Generate PDF with barcodes from the provided data

## Dependencies

### Backend
- Express - Web server framework
- PDFKit - PDF generation
- JsBarcode - Barcode generation
- xmldom - DOM implementation for SVG creation
- svg-to-pdfkit - SVG to PDF conversion

### Extension
- Webpack - Module bundler
- Babel - JavaScript compiler
- Chrome Extension API 