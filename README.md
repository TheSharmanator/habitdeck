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

- **Node.js** v22 or higher — [nodejs.org](https://nodejs.org)
- **npm** (comes bundled with Node.js)
- A modern browser (Chrome or Chromium recommended for kiosk use)

> All other dependencies are installed automatically via `npm install`.

---

## Installation

### 🪟 Windows

1. Download and install Node.js from [nodejs.org](https://nodejs.org) — choose the **LTS** version.
2. Open **Command Prompt** or **PowerShell**.
3. Clone the repository and enter the folder:
   ```cmd
   git clone https://github.com/TheSharmanator/habitdeck.git
   cd habitdeck
   ```
   > **IMPORTANT:** Make sure your terminal line ends with `\habitdeck>` before doing step 4!

4. Install dependencies:
   ```cmd
   npm install
   ```

5. Start the app (this opens two windows for backend and frontend):
   ```cmd
   npm start
   ```

6. Open your browser and go to: **http://localhost:3000**

---

**Creating a Windows Desktop Shortcut (Starts App + Full Kiosk):**
If you want a one-click button on your desktop that starts the servers and opens the app in full-screen kiosk mode:

1. Open **Notepad**.
2. Paste this exactly (change the `cd /d` path if you downloaded it somewhere else):
   ```bat
   @echo off
   cd /d "C:\Users\YOUR_USERNAME\habitdeck"
   start /B npm run server
   start /B npm run dev
   timeout /t 5
   start chrome --kiosk --noerrdialogs --disable-infobars http://localhost:3000
   ```
3. Go to **File > Save As...**
4. Set "Save as type" to **All Files (\*.\*)**.
5. Save it to your Desktop as `StartHabitDeck.bat`.
6. Double-click this file anytime to boot everything at once.

---

### 🐧 Linux (including Raspberry Pi OS)

1. Open a terminal.
2. Install Node.js (v22+):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
   > On **Raspberry Pi OS (Bullseye/Bookworm)**, if the above fails, use:
   > ```bash
   > sudo apt update
   > sudo apt install nodejs npm -y
   > ```
   > Then check the version: `node -v` — if it is below v22, use the curl method above.

3. Clone the repository and enter the folder:
   ```bash
   git clone https://github.com/TheSharmanator/habitdeck.git
   cd habitdeck
   ```
   > **IMPORTANT:** Make sure your terminal line ends with `habitdeck$` before doing step 4!

4. Install dependencies:
   ```bash
   npm install
   ```

---

**Booting into Full Kiosk Mode (Servers + Browser):**
If you try to launch the browser before the servers are running, it will fail. We need a script that starts everything in the correct order.

First, check what your browser is called. Run this in the terminal:
```bash
which chromium-browser chromium
```
It will print out a path like `/usr/bin/chromium-browser` or `/usr/bin/chromium`. Write down the exact name it gives you.

Now, let's create the boot script:

1. Make sure you are in the habitdeck folder:
   ```bash
   cd ~/habitdeck
   ```
2. Create and edit the script:
   ```bash
   nano start-kiosk.sh
   ```
3. Paste the following (replace `{browsername}` with the name you found above, and use your IP address instead of `localhost` if needed, e.g. `http://192.168.1.50:3000`):
   ```bash
   #!/bin/bash
   
   # 1. Start the backend server
   npm run server &
   
   # 2. Start the frontend server
   npm run dev &
   
   # 3. Wait 5 seconds for them to boot
   sleep 5
   
   # 4. Boot the browser into full kiosk mode
   {browsername} --kiosk --noerrdialogs --disable-infobars http://localhost:3000
   ```
4. Save and exit (Press `Ctrl+O`, `Enter`, then `Ctrl+X`).
5. Make the script executable:
   ```bash
   chmod +x start-kiosk.sh
   ```
6. Run it to start your kiosk:
   ```bash
   ./start-kiosk.sh
   ```

> **Pi Autostart Tip:** To run this script automatically every time the Pi turns on, add it to your autostart file at `~/.config/lxsession/LXDE-pi/autostart`:
> ```
> @/home/pi/habitdeck/start-kiosk.sh
> ```

---

### 🍎 Mac

1. Install Node.js from [nodejs.org](https://nodejs.org) — choose the **LTS** version.
   > Or with Homebrew: `brew install node`

2. Open **Terminal**.
3. Clone the repository and enter the folder:
   ```bash
   git clone https://github.com/TheSharmanator/habitdeck.git
   cd habitdeck
   ```
   > **IMPORTANT:** Make sure you are in the `habitdeck` folder before doing step 4!

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
