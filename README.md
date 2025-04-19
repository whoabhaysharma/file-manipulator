# File Manipulator Chrome Extension

A Chrome extension that allows you to intercept downloaded files, modify them, and save the modified versions.

## Features

- Intercept file downloads
- Modify file contents automatically
- Support for various text-based file formats (txt, md, js, css, html)
- Easy enable/disable toggle
- Visual feedback for extension status

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in Chrome's toolbar to open the popup
2. Click "Enable File Manipulation" to activate the extension
3. Download any supported file type
4. The extension will automatically:
   - Intercept the download
   - Modify the file (currently adds a timestamp header)
   - Prompt you to save the modified version

## Supported File Types

Currently supports modification of the following file types:
- .txt (Text files)
- .md (Markdown files)
- .js (JavaScript files)
- .css (CSS files)
- .html (HTML files)

## Customization

To modify how files are processed, edit the `modifyContent` function in `background.js`. You can:
- Add support for more file types
- Change how files are modified
- Add different modifications for different file types

## Security Note

The extension requires permissions to:
- Access downloads
- Read file contents
- Modify downloads

These permissions are necessary for the core functionality but are only active when the extension is enabled. 