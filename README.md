# File Manipulator Extension

A Chrome extension that intercepts file downloads matching specified patterns, processes them with Gemini AI, and provides the processed files to the user.

## Project Structure

```
file-manipulator-extension/
│
├── src/                   # Source code
│   ├── background/        # Background service worker
│   │   └── background.js  # Background script
│   │
│   ├── popup/             # Popup UI
│   │   ├── popup.html     # Popup HTML
│   │   ├── popup.js       # Popup script
│   │   └── popup.css      # Popup styles
│   │
│   ├── utils/             # Shared utility functions
│   │   ├── api.js         # API interaction utilities
│   │   ├── fileUtils.js   # File manipulation utilities
│   │   └── storage.js     # Storage utilities
│   │
│   ├── manifest.json      # Extension manifest
│   └── config.json        # Default configuration
│
├── dist/                  # Build output (generated)
├── node_modules/          # Dependencies (generated)
├── webpack.config.js      # Webpack configuration
├── package.json           # Project metadata and dependencies
└── README.md              # This file
```

## Development

### Prerequisites

- Node.js and npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Build

To build the extension:

```
npm run build
```

This will create a `dist` directory with the built extension.

### Development Mode

To run in development mode with automatic rebuilding:

```
npm run dev
```

## Installation

1. Build the extension
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` directory

## Configuration

1. After installing the extension, click on the extension icon to open the popup
2. Enter your Gemini API key
3. Configure file patterns to match (comma-separated glob patterns)
4. Click "Save Configuration"
5. Click "Enable File Manipulation" to activate the extension

## How It Works

1. When the extension is enabled, it intercepts downloads matching the configured file patterns
2. It processes the file content using the Gemini API
3. It initiates a new download with the processed content
4. The user can choose where to save the processed file

## Features

- Intercept file downloads based on configurable filename patterns
- Process file contents using Google's Gemini API
- Generate structured JSON output from file content
- Download the processed content as a text file
- User-friendly configuration interface

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