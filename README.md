<div align="center">
  <img src="ek/icon-128.png" alt="Logo" width="128" height="128" />

  # 🕒 YouTube Playlist Watch Time Calculator

  <p>
    <strong>A powerful, highly polished browser extension to calculate the total watch time of any YouTube playlist.</strong>
  </p>

  <p>
    <a href="https://chrome.google.com/webstore/"><img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Extension" /></a>
    <a href="https://addons.mozilla.org/"><img src="https://img.shields.io/badge/Firefox-Addon-FF7139?style=for-the-badge&logo=firefoxbrowser&logoColor=white" alt="Firefox Add-on" /></a>
  </p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square" alt="License" /></a>
    <a href="manifest.json"><img src="https://img.shields.io/badge/Manifest-V3-brightgreen.svg?style=flat-square" alt="Manifest V3" /></a>
    <img src="https://img.shields.io/badge/Languages-14-orange.svg?style=flat-square" alt="Languages" />
    <a href="PRIVACY_POLICY.md"><img src="https://img.shields.io/badge/Privacy-First-success.svg?style=flat-square" alt="Privacy First" /></a>
  </p>
</div>

---

## 📖 Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Previews](#-previews)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Supported Languages](#-supported-languages)
- [Permissions Explained](#-permissions-explained)
- [Contributing](#-contributing)
- [License & Privacy](#-license--privacy)

---

## 🚀 About the Project

Have you ever looked at a YouTube playlist with 150 videos and wondered precisely how long it would take to finish? **YouTube Playlist Watch Time Calculator** effortlessly answers this by overlaying an elegant, non-intrusive panel on YouTube pages. 

It automatically sums up all video durations—even as you scroll and load more videos—and provides instantly calculated custom playback speeds (1.25x, 1.5x, 2x, etc.) so you can plan your time effectively.

---

## ✨ Key Features

- **⚡ Instant & Live Calculation:** Detects video timestamps on the fly. As YouTube loads more videos via infinite scroll, the watch time updates instantly.
- **🎯 Precise Range Selection:** Don't care about the first 10 videos? Input a custom `Start` and `End` index to calculate watch time for a specific chunk of the playlist.
- **🚀 Playback Speed Modifiers:** See exactly how much time you save by watching at 1.25×, 1.5×, 1.75×, 2.0×, or your own custom speed factor.
- **🎨 Premium Theming:** A beautifully crafted popup UI with 3 built-in themes:
  - ☀️ **Light:** Clean, vibrant, and contrast-rich.
  - 🌙 **Dark:** Easy on the eyes for night sessions.
  - ⬛ **OLED:** True dark black to save power & reduce glare.
- **🌍 Massive Localization:** Fully translated into **14 major languages** with real-time UI switching (no page refresh required).
- **🔒 Privacy First Architecture:** Runs 100% locally. Zero telemetry, zero analytics, zero data transmission.

---

## 📸 Previews

> *Note: Place your screenshots in the `screenshots/` folder to make them visible here.*

<div align="center">
  <img src="screenshots/preview-1.png" width="400" alt="Extension in action on YouTube" />
  <img src="screenshots/preview-2.png" width="400" alt="Settings Popup Themes" />
</div>

---

## 🛠️ Installation

### 📥 Install from Official Stores
*(Links coming soon once published)*
- **[Chrome Web Store Developer Page](#)**
- **[Firefox Add-ons Page](#)**

### 💻 Manual Installation (Developer Mode)

#### 🦊 Mozilla Firefox
1. Open Firefox and navigate to `about:debugging`.
2. Click **"This Firefox"** in the left sidebar.
3. Click **"Load Temporary Add-on…"**.
4. Select the `manifest.json` file from the extracted project folder.

#### 🌐 Google Chrome / Edge / Brave
1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
2. Enable **"Developer mode"** using the toggle in the top-right corner.
3. Click **"Load unpacked"**.
4. Select the root folder of this project.

---

## 🕹️ Usage Guide

1. Navigate to any YouTube Playlist page (`youtube.com/playlist?list=...`) or watch a video within a playlist (`youtube.com/watch?v=...&list=...`).
2. The calculator panel will seamlessly inject itself into the page UI.
3. **Change Parameters:** Click the gear icon or the extension popup in your browser toolbar to change themes, language, or adjust advanced settings.
4. **Scroll to Load:** Simply scroll down the YouTube page to load more videos into the DOM; the extension automatically captures and recalculates the count!

---

## 🌍 Supported Languages

The extension features a totally dynamic local localization engine. Adding a new language is as simple as dropping a `<lang_code>/strings.json` file into the `ek/lang/` directory.

Currently supported out-of-the-box:

| Arabic `(ar)` | Azerbaijani `(az)` | Chinese `(zh)` | English `(en)` |
| :---: | :---: | :---: | :---: |
| **French** `(fr)` | **German** `(de)` | **Hindi** `(hi)` | **Indonesian** `(id)` |
| **Japanese** `(ja)` | **Kazakh** `(kk)` | **Korean** `(ko)` | **Russian** `(ru)` |
| **Spanish** `(es)` | **Turkish** `(tr)` | | |

---

## 🛡️ Permissions Explained

For complete transparency regarding browser extension permissions:

| Permission Requirement | Technical Justification |
|-----------------------|-------------------------|
| `storage` | Required to save your localized preferences (Theme & Language) locally across browser sessions. |
| `*://*.youtube.com/*` | Required to securely inject the content script and read the public DOM elements (video duration timestamps) on YouTube. |

*Read our full [Privacy Policy](PRIVACY_POLICY.md) for deeper details on how we protect you.*

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## ⚖️ License & Privacy

Distributed under the **Apache License 2.0**. See `LICENSE` for more information.

Our commitment to privacy is uncompromising. See `PRIVACY_POLICY.md` to review our stance on absolute data minimization and security.

<div align="center">
  <br />
  <i>Crafted with passion by <a href="https://www.androdom.com.tr">Androdom</a></i>
</div>
