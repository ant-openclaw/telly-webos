# Telly for webOS (LG TV)

A lightweight IPTV player for LG webOS TVs.

## Features

- **M3U Playlist Support**: Load IPTV channels from a remote M3U URL
- **TV-Optimized UI**: Large buttons, clear focus indicators for remote navigation
- **Channel Grid**: Responsive grid layout (2-6 columns based on TV resolution)
- **Search**: Filter channels by name or group
- **Simple Settings**: Store M3U URL in localStorage
- **HTML5 Video**: Uses native webOS video player with HLS support

## Project Structure

```
telly-webos/
├── appinfo.json          # webOS app manifest
├── index.html            # Main HTML
├── app.js                # Application logic
├── styles.css            # TV-optimized styles
├── icon.png              # App icon (128x128)
├── icon-large.png        # Large icon (512x512)
├── splash.png            # Splash screen
└── webOSTVjs-1.2.4/      # webOS TV library (download separately)
```

## Setup

### 1. Download webOS TV Library

Download `webOSTVjs-v1.2.4.zip` from the [LG webOS TV Developer site](https://webostv.developer.lge.com/develop/app-developer-guide/setup-webos-tv-sdk/) and extract to `webOSTVjs-1.2.4/`.

### 2. Create Icons

Create these PNG images:
- `icon.png` — 128x128 pixels
- `icon-large.png` — 512x512 pixels
- `splash.png` — 1920x1080 pixels (recommended)

### 3. Configure M3U URL

On first launch, enter your M3U playlist URL in the settings screen:
```
https://your-provider.com/playlist.m3u
```

The URL is saved and channels load automatically on future launches.

## Development

### Testing in Browser

You can test basic functionality in a web browser:
```bash
cd telly-webos
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

**Note**: TV remote navigation (arrow keys, back button) works with keyboard arrows and Escape/Backspace.

### Deploying to LG TV

#### Method 1: Developer Mode (Testing)

1. Enable Developer Mode on your LG TV:
   - Press Settings on remote
   - Go to General → About This TV
   - Click on "TV Information" repeatedly until Developer Mode appears
   - Toggle Developer Mode ON
   - Note the Key Server IP and passphrase

2. Connect your computer and TV to the same network

3. Install the webOS TV CLI:
   ```bash
   npm install -g @webosose/ares-cli
   ```

4. Set up the device:
   ```bash
   ares-setup-device
   # Enter your TV's IP address
   ```

5. Package and install:
   ```bash
   ares-package telly-webos
   ares-install com.yourdomain.telly_1.0.0_all.ipk -d <device-name>
   ```

#### Method 2: LG Content Store (Production)

For distribution through LG's official store, you need to:
1. Register at [LG Developer Portal](https://developer.lge.com/)
2. Submit app for review
3. Pass webOS app validation tests

## Remote Control Navigation

| Button | Action |
|--------|--------|
| Arrow Keys | Navigate grid/settings |
| OK/Enter | Select channel / Button |
| Back | Exit player / Go back |
| Search Box | Type to filter channels |

## Troubleshooting

**Channels don't load**
- Check M3U URL is accessible from your TV
- Verify URL starts with `http://` or `https://`
- Check TV's internet connection

**Video won't play**
- Ensure streams are in HLS format (most IPTV uses this)
- Some streams may require specific codecs not available on webOS
- Check browser console for JavaScript errors

**Focus not visible**
- Focus indicators are styled with red border/box-shadow
- On TV, cursor should be hidden automatically

## License

MIT
