# File Manipulator Chrome Extension

A Chrome extension that processes downloaded files using the Gemini API and creates new files with the results.

## Features

- Intercept file downloads based on configurable filename patterns
- Process file contents using Google's Gemini API
- Generate structured JSON output from file content
- Download the processed content as a text file
- User-friendly configuration interface

## Setup

### Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable Developer Mode (toggle in the top right)
4. Click "Load unpacked" and select the extension directory

### Configuration

1. Click on the extension icon in your toolbar to open the popup
2. Enter your Gemini API key in the configuration section
3. Customize file patterns to match the files you want to process
4. Click "Save Configuration" to store your settings
5. Toggle "Enable File Manipulation" to activate the extension

## How It Works

1. When you download a file that matches your configured patterns, the extension will allow the original download to complete
2. The extension will then read the file content and send it to the Gemini API for processing
3. The API will analyze the content and extract structured data (receipt ID, consignment ID, box ID)
4. The extension will create a new text file with the JSON result and download it automatically

## API Integration

This extension uses Google's Gemini API to extract structured data from downloaded files. The API response schema is configured to extract:

- Receipt ID
- Consignment ID
- Box ID

These fields are returned as JSON and saved as a text file.

## Permissions

The extension requires the following permissions:

- `downloads`: To intercept and manage downloads
- `storage`: To store your configuration
- `activeTab`: To access the current tab
- `host_permissions`: To make API requests to the Gemini API

## Troubleshooting

- Make sure you've entered a valid Gemini API key
- Check that your file patterns match the files you're trying to process
- If files aren't being processed, check the browser console for debugging information

## License

This project is licensed under the MIT License - see the LICENSE file for details. 