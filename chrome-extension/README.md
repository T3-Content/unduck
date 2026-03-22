# Unduck Custom New Tab Chrome Extension

This Chrome extension replaces the default new tab page with [unduckcustom.vercel.app](https://unduckcustom.vercel.app).

## Installation

1. Download or clone this repository to your computer
2. Open Google Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing this extension

## Usage

Once installed, every time you open a new tab, you'll see the Unduck custom search page instead of the default Chrome new tab page.

## Features

- Replaces the default new tab page with unduckcustom.vercel.app
- Clean, minimal implementation
- No additional permissions required

## Files

- `manifest.json` - Extension configuration
- `newtab.html` - New tab page that loads unduckcustom.vercel.app
- `icons/` - Extension icons (you can add your own icons here)

## Customization

If you want to modify the extension:

1. Edit `newtab.html` to change how the page is displayed
2. Update `manifest.json` if you need to add permissions or change metadata
3. Reload the extension in Chrome by clicking the refresh icon on the extension card

Note: For the extension to work properly, you need to be connected to the internet since it loads content from unduckcustom.vercel.app.
