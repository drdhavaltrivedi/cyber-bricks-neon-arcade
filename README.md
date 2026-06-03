# Cyber-Bricks: Neon Arcade 🕹️

A premium, retro-synthwave breakout game designed as a browser extension. Bounce, fire lasers, collect power-ups, and enjoy synthesized retro sound effects—playable directly from your browser toolbar or in a full-screen grid interface.

This repository is structured as a monorepo containing both the raw **Browser Extension** source code and a promotional **Landing Page Website** with a live, playable web demo.

---

## 📂 Repository Structure

```
.
├── extension/             # Raw Browser Extension Source Code
│   ├── manifest.json      # Manifest V3 Extension Config
│   ├── popup.html         # Extension popup layout
│   ├── popup.css          # Extension styling
│   ├── popup.js           # Extension controller
│   ├── game.js            # HTML5 Canvas physics engine
│   ├── audio.js           # Oscillator-based audio synthesizer
│   └── assets/            # Extension PNG icons (16px, 48px, 128px)
│
├── website/               # Vercel-Deployable Landing Page Website
│   ├── index.html         # Home page & playable demo wrapper
│   ├── privacy.html       # Publicly-hosted Privacy Policy page
│   ├── style.css          # Cyberpunk landing page layout styles
│   ├── main.js            # Scroll animations & canvas demo controller
│   ├── game.js            # Game engine (web demo bundle)
│   ├── audio.js           # Synthesizer (web demo bundle)
│   └── assets/            # Graphic assets & icons
│
├── docs/                  # Store Submissions Metadata
│   ├── store_listings.md  # Descriptions, features, and specs for Chrome/Edge/Firefox/Safari
│   └── privacy_policy.md  # Legal markdown declaration
│
├── .gitignore             # Git exclusion rules
└── README.md              # Project documentation
```

---

## 🚀 1. Browser Extension Installation

To run this extension locally in developer mode:

### Google Chrome & Microsoft Edge
1. Navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Toggle **Developer mode** on (top-right switch).
3. Click **Load unpacked** (top-left button).
4. Select the `extension/` subdirectory of this repository.
5. Click on the extension icon in your toolbar to begin playing!

### Mozilla Firefox
1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file inside the `extension/` directory.

### Apple Safari (macOS)
1. In Safari, open **Settings** > **Advanced** and check **"Show Develop menu in menu bar"**.
2. Go to **Develop** > **Allow Unsigned Extensions**.
3. Run the following command in terminal to generate an Xcode wrapper project:
   ```bash
   xcrun safari-web-extension-converter /path/to/project/extension
   ```
4. Build and run the project in Xcode to register it with macOS.

---

## ⚡ 2. Landing Page Local Hosting & Vercel Deployment

### Local Hosting
To run the website locally, spin up any static file server inside the `website/` directory. For example, using Python 3:
```bash
cd website
python3 -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

### Vercel Deployment
This repository is optimized for one-click Vercel deployments.
1. Connect your GitHub repository to Vercel.
2. In your Vercel Project Settings, configure the **Root Directory** setting to:
   `website`
3. Click **Deploy**. Vercel will automatically build and host the landing page and playable web demo.

---

## 🕹️ Gameplay & Controls Protocol

- **Launch Ball**: Press `SPACE` (Keyboard) or tap screen (Touch).
- **Move Paddle**: Arrow keys or `A` / `D` (Keyboard), drag mouse horizontal (Mouse), or slide screen (Touch).
- **Shoot Lasers** (Laser Power-Up active): Press `SPACE` or tap screen.
- **Pause diagnostics**: Press `ESC` or `P` key.

### Power-up Calibration:
- **(M) Multi-Ball**: Spawns extra active balls.
- **(L) Laser Cannon**: Shoot down bricks with high velocity lasers.
- **(W) Paddle Flux**: Increases paddle width by 50%.
- **(S) Net Shield**: Creates an energy barrier at the bottom of the screen to save a falling ball.
- **(T) Temporal Slow**: Dilates time to slow down ball physics speed.

---

## 🔒 Privacy and Permissions
We collect **zero data**. All gameplay calculations and score storage happen entirely locally on the user's device using local sandboxed storage. No tracking, cookies, or telemetry are used. Review our full [Privacy Policy](docs/privacy_policy.md) or visit `website/privacy.html` for details.
