# YouTube Playlist Watch Time Calculator 🕒

A powerful and elegant browser extension to calculate the total duration of YouTube playlists at various playback speeds. Designed with a premium look and multi-language support.

## ✨ Features

- **Dynamic Calculation:** Instantly calculates the total watch time of any YouTube playlist.
- **Custom Range Selection:** Select specific start and end points within a playlist to calculate partial durations.
- **Playback Speed Support:** View how long it will take to watch the playlist at 1x, 1.25x, 1.5x, 2x, or a custom speed.
- **Visual Progress:** See exactly how many videos are counted and loaded in real-time.
- **Premium UI:** Beautifully crafted settings popup with:
  - **Themes:** Light, Dark, and OLED (Pure Black) modes.
  - **Localization:** Full support for 9 languages including English, Turkish, Spanish, Arabic, Russian, French, German, Chinese, and Hindi.
  - **Dynamic Updates:** Language and theme changes apply instantly without page refreshes.
- **Universal Support:** Works seamlessly on both playlist pages and watch pages with sidebars.

## 📁 Directory Structure

```
/root
 ├─ manifest.json     # Extension metadata (MV3)
 ├─ content-script.js # Core logic for YouTube interaction
 ├─ content.css       # Styles for the on-page calculator panel
 ├─ popup.html        # Settings interface
 ├─ popup.js          # Settings logic & theme management
 ├─ popup.css         # Premium design system
 └─ ek/               # Assets & Localization
     ├─ lang/         # JSON translation files (9 languages)
     └─ *.png         # Extension icons
```

## 🛠 Installation (Development)

1. Clone or download this repository.
2. Open your browser:
   - **Firefox:** Type `about:debugging` -> This Firefox -> Load Temporary Add-on -> Select `manifest.json`.
   - **Chrome:** Type `chrome://extensions` -> Enable "Developer mode" -> Load unpacked -> Select the project folder.

## 🌍 Localization

The extension is designed to be easily translatable. The current version supports English, Turkish, Spanish, Arabic, Russian, French, German, Chinese, and Hindi.

## ⚖️ License

Licensed under Apache License 2.0. For more information, visit [androdom.com.tr](https://www.androdom.com.tr).

---
*Created with ❤️ by Androdom.*
