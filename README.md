# YouTube Playlist Watch Time Calculator 🕒

> A powerful browser extension that calculates the total watch time of any YouTube playlist — with multi-speed support, custom ranges, and a beautifully designed settings panel.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Manifest Version](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](manifest.json)
[![Languages](https://img.shields.io/badge/Languages-14-orange.svg)](#-localization)

---

## ✨ Features

- **⚡ Instant Calculation** — Automatically detects and calculates the total duration of any YouTube playlist as soon as the page loads.
- **🎯 Custom Range Selection** — Choose a specific start and end video index to calculate the watch time for any portion of a playlist.
- **🚀 Playback Speed Support** — See adjusted durations at 1×, 1.25×, 1.5×, 2×, or a fully custom playback speed.
- **📊 Real-time Progress** — A live counter shows how many videos have been loaded and counted so far.
- **🎨 Premium UI & Theming** — A carefully designed settings popup with three built-in themes:
  - ☀️ **Light** — Clean and minimal.
  - 🌙 **Dark** — Easy on the eyes at night.
  - ⬛ **OLED** — Pure black for AMOLED displays.
- **🌍 14 Languages** — Full localization support with instant switching (no page refresh required).
- **🔌 Universal Compatibility** — Works on both `/playlist` pages and `/watch` pages with a video sidebar.
- **🔒 Privacy First** — Requires only the `storage` permission. No data is ever collected or transmitted.

---

## 🌍 Localization

The extension is fully localized into **14 languages**:

| Code | Language     | Code | Language    |
|------|-------------|------|-------------|
| `ar` | Arabic       | `ja` | Japanese    |
| `az` | Azerbaijani  | `kk` | Kazakh      |
| `de` | German       | `ko` | Korean      |
| `en` | English      | `ru` | Russian     |
| `es` | Spanish      | `tr` | Turkish     |
| `fr` | French       | `zh` | Chinese     |
| `hi` | Hindi        | `id` | Indonesian  |

Translation files are located in `ek/lang/<code>/strings.json`. Adding a new language is as simple as creating a new folder with a `strings.json` file.

---

## 📁 Project Structure

```
youtube-playlist-watchtime/
├── manifest.json          # Extension manifest (Manifest V3)
├── content-script.js      # Core logic: playlist parsing & UI injection
├── content.css            # Styles for the injected on-page calculator panel
├── popup.html             # Settings popup structure
├── popup.js               # Settings logic, theme & language management
├── popup.css              # Premium design system for the settings popup
├── PRIVACY_POLICY.md      # Privacy policy
├── LICENSE                # Apache 2.0 License
└── ek/
    ├── lang/              # Localization files
    │   ├── en/strings.json
    │   ├── tr/strings.json
    │   └── ...            # 14 languages total
    └── icon-*.png         # Extension icons (16px – 128px)
```

---

## 🛠️ Installation (Developer Mode)

### Firefox
1. Open Firefox and navigate to `about:debugging`.
2. Click **"This Firefox"** in the left sidebar.
3. Click **"Load Temporary Add-on…"**.
4. Select the `manifest.json` file from this project folder.

### Chrome / Edge / Brave
1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
2. Enable **"Developer mode"** using the toggle in the top-right corner.
3. Click **"Load unpacked"**.
4. Select the root project folder.

---

## 🔑 Permissions

| Permission | Reason |
|-----------|--------|
| `storage` | Saves your theme and language preferences locally. |
| `*://*.youtube.com/*` | Required to read playlist data and inject the calculator UI on YouTube pages. |

No other permissions are requested. No data leaves your device.

---

## ⚖️ License

This project is licensed under the **Apache License 2.0**.
See the [LICENSE](LICENSE) file for full details, or visit [androdom.com.tr](https://www.androdom.com.tr).

---

*Made with ❤️ by [Androdom](https://www.androdom.com.tr)*
