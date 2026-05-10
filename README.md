# HabitDeck 🎯

A dual-user kiosk application for tracking daily habits and KPIs — built for touchscreens, designed with focus and simplicity in mind.

Each side of the screen belongs to one person. Set your habits, set your KPIs, lock each day when done. Simple.

---

## Features

- 👤 **Two independent user profiles** on a single screen
- ✅ **Habit Tracker** — drag happy/sad faces onto each day, lock when complete
- 📊 **KPI Tracker** — enter daily values, auto colour-coded against your target range
- 📝 **Post-it Notes** — draw and send notes to the other user
- 🔒 **PIN protection** on each tracker
- 🔔 **Daily nag alerts** if yesterday's entries are missing
- ☁️ **Optional Google Drive backup** — automatic at 2am every night
- 📅 **Progressive unlock** — new users only see days from their sign-up date

---

## Requirements

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** (comes bundled with Node.js)
- A modern browser (Chrome or Chromium recommended for kiosk use)

> All other dependencies are installed automatically via `npm install`.

---

## Installation

### 🪟 Windows

1. Download and install Node.js from [nodejs.org](https://nodejs.org) — choose the **LTS** version.

2. Open **Command Prompt** or **PowerShell**.

3. Clone the repository:
   ```
   git clone https://github.com/TheSharmanator/habitdeck.git
   cd habitdeck
   ```

4. Install dependencies:
   ```
   npm install
   ```

5. Start the app:
   ```
   npm start
   ```

6. Open your browser and go to: **http://localhost:3000**

---

### 🐧 Linux (including Raspberry Pi OS)

1. Open a terminal.

2. Install Node.js (v18+):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   
   > On **Raspberry Pi OS (Bullseye/Bookworm)**, if the above fails, use:
   > ```bash
   > sudo apt update
   > sudo apt install nodejs npm -y
   > ```
   > Then check the version: `node -v` — if it is below v18, use the nodesource method above.

3. Clone the repository:
   ```bash
   git clone https://github.com/TheSharmanator/habitdeck.git
   cd habitdeck
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the backend server (in one terminal):
   ```bash
   npm run server
   ```

6. Start the frontend (in a second terminal):
   ```bash
   npm run dev
   ```

7. Open your browser and go to: **http://localhost:3000**

   > **Pi kiosk tip:** To launch Chromium automatically in full-screen on boot, add this to your autostart file at `~/.config/lxsession/LXDE-pi/autostart`:
   > ```
   > @chromium-browser --kiosk http://localhost:3000
   > ```

---

### 🍎 Mac

1. Install Node.js from [nodejs.org](https://nodejs.org) — choose the **LTS** version.

   > Or with Homebrew: `brew install node`

2. Open **Terminal**.

3. Clone the repository:
   ```bash
   git clone https://github.com/TheSharmanator/habitdeck.git
   cd habitdeck
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the app:
   ```bash
   npm run server &
   npm run dev
   ```

6. Open your browser and go to: **http://localhost:3000**

---

## First Launch

When you open the app for the first time, you will be asked:

> **"Would you like to automatically back up your data to Google Drive every night at 2am?"**

- Click **Yes** and follow the on-screen 3-step instructions to connect Google Drive.
- Click **No** to skip. You can always set this up later by editing `server/data/appConfig.json`.

---

## Setting Up a User

1. On the main screen, each user panel shows a **"Setup User"** button if not yet configured.
2. Click it to begin the setup wizard:
   - Create a **4-digit PIN**
   - Enter your **name**
   - Upload a **profile photo** (optional — you can skip this)
3. Once set up, click the **⚙️ gear icon** in your panel header to access your dashboard — add Habits and KPIs from there.

---

## Daily Use

### Habit Tracker
1. Click the **habits icon** in your header.
2. Enter your PIN.
3. **Drag** the 😊 (happy) or 😢 (sad) face onto each day's cell.
4. When all required habits are filled in, click the **padlock** to lock the day.

### KPI Tracker
1. Click the **KPI icon** in your header.
2. Enter your PIN.
3. **Tap** a cell and enter your value using the number pad.
4. Cells turn **green** if within your target range, **red** if not.
5. Drag the **❌** tile to mark a KPI as failed without entering a number.
6. Lock the day with the **padlock** when done.

---

## Data Storage

All data is stored locally in `server/data/` as plain JSON files:

| File | Contents |
|------|----------|
| `u1_data.json` | User 1 — habits, KPIs, logs, settings |
| `u2_data.json` | User 2 — habits, KPIs, logs, settings |
| `appConfig.json` | App-level config including backup settings |

> Do not delete these files unless you intend to reset a user completely.

---

## Google Drive Backup (Optional)

Backups run automatically at **2am** every night if configured. Each user data file is uploaded to your Google Drive as `habitdeck_u1_data.json` and `habitdeck_u2_data.json`.

To configure manually, edit `server/data/appConfig.json`:

```json
{
  "firstRun": false,
  "backupEnabled": true,
  "driveConfig": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }
}
```

---

## npm Scripts

| Command | What it does |
|---------|-------------|
| `npm start` | Starts both backend and frontend together (Windows) |
| `npm run server` | Starts the backend server only — port 3001 |
| `npm run dev` | Starts the Vite frontend dev server — port 3000 |
| `npm run build` | Builds the frontend for production |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Styling | Vanilla CSS |
| Backup | Google Drive API v3 |
| Scheduling | node-cron |

---

## License

MIT — use it, fork it, hack it.
