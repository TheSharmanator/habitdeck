# HABITS & KPI HUB v1.0  
### Comprehensive Build Instruction for Google Antigravity
---
## PURPOSE
This document defines every detail required to build **HABITS & KPI HUB v1.0**, a dual-user habit and KPI tracking touchscreen kiosk app.
The application allows two users to:
- Track and visualize daily **Habits** and **KPIs**
- **Send handwritten Post-it notes** to each other
- Be **mutually accountable**, transparent, and engaged in personal progress
---
## DEVELOPMENT PATH
**Stage 1:** Build and test on Windows 10/11 using Chrome or Edge.  
**Stage 2:** Port finalized app to **Raspberry Pi 4B (2 GB)** with **Raspberry Pi OS** running Chromium in kiosk mode.
All icon, emoji, and sound files will be uploaded to Antigravity for inclusion.
---
## 1. SYSTEM ENVIRONMENT
| Phase | Target | Path / Runtime |
|-------|---------|----------------|
| **Windows Development** | Desktop simulation (Node.js or static server) | `C:\dev\habits-app\` |
| **Raspberry Pi Deployment** | RPi 4B (2 GB, 64 GB SanDisk A1 microSD) | `/home/sharmanator/habits-app/` |
| **Browser** | Chromium / Edge | Fullscreen Kiosk |
| **Display** | 15″ touchscreen | No keyboard or mouse |
**Pi Startup Command:**
```bash
chromium-browser --kiosk --incognito --disable-pinch /home/sharmanator/habits-app/index.html
Auto-launch Service:
Use a systemd service to open the app on boot inside X11 or Wayland.

2. DATA PERSISTENCE AND CLOUD BACKUP
Local Storage
Two JSON files:



/data/u1_data.json
/data/u2_data.json
Sync Triggers
Timed: Every 12 hours (cron or Windows Task Scheduler)
Manual: After each “padlock” lock event
Sync Process
Push to Google Drive API folder or mounted directory
Retry until successful
Log all sync operations under /logs/sync.log
Windows Simulation
Mirror backups to C:\dev\habits-app\cloud-mirror\

3. HOME SCREEN OVERVIEW
Full-screen split vertically: left = User1, right = User2

Each side functions independently but follows identical structure.

Header Icons per User
Speech Bubble – Flashes if unread Post-it note exists
KPI Icon – Opens KPI Tracker
Habits Icon – Opens Habit Tracker
Post-it Icon – Opens drawing canvas
Settings Gear – Opens Dashboard/Configurator
Body Components
Circular Profile Image
Username label
Top-Line Results
Habits % (Day, Week, Month, All)
KPI % (Day, Week, Month, All)
Habit Streak (Current / Highest)
KPI Streak (Current / Highest)
List of up to 8 habits and 8 KPIs per user, each with an eye icon for past stats
Eye‑Icon Popup
Displays for each metric:

Yesterday’s date (DDD DD‑MMM‑YYYY)
Achieved or not
% success over last week, month, all‑time
Current and highest streaks
Exclude current day data from all summaries.

Interaction Rules
5‑minute inactivity returns to Home Screen.
Shared Moon Icon (DND) at screen bottom to enable dark overlay mode (#000000).
DND wakes for 60 seconds on tap, then fades back.
Missed Data Popup ("Guilty Party")
Triggered daily at 06:00:01:

If the previous day's padlock is unlocked and user_snooze_active = false,
a flashing modal appears on only that user's side.
Modal directs the user to correct the missing entry screen and cannot be closed until data is complete.
4. VIRTUAL INPUT SYSTEMS
All input fields use custom JavaScript pop-up keyboards; OS keyboards are disabled.

Keyboard	Keys	Purpose
QWERTY	A–Z, Enter	For text fields (names, habits, KPIs).
Numeric	0–9, Decimal, Enter	For numbers, min/max values, and PINs.
Time Picker	Radial or scroll selector	For DND and Snooze scheduling.
Keyboard overlays display a visible mirror input text box above for user assurance.
All input data must be validated before saving.

5. DASHBOARD (CONFIGURATOR)
Purpose: User setup & locked customization.
Access: Requires 4-digit PIN.

First-Time Setup
Create and confirm a new 4-digit PIN (numeric keypad only).
Enter a username using QWERTY keyboard.
Configure up to 8 Habits and 8 KPIs.
Habit Configuration
Element	Description
Text Field	Habit description
7 Toggle Buttons	Mon–Sun schedule
Padlock Icon	Locks finalized habit settings
When locked, the fields are read-only. Unlocking requires re-entry of PIN.

KPI Configuration
Element	Description
Text Field	KPI label
Min Field	Minimum acceptable numeric value
Max Field	Maximum acceptable numeric value
Padlock Icon	Locks finalized KPI data
6. HABIT TRACKER SCREEN
Access: PIN required

Layout:
7 rows = past 6 days + today
8 columns = user’s active habits

Drag & Drop Mechanics
😊 drag → Green success cell (+1)
☹ drag → Red failure cell (0)
🗑 drag to bin → remove state → neutral cell
Padlock → locks all cells for the day
Hover: cell background turns blue to indicate drop target.
Locked Days: Dragging blocked.
Non‑required days: Hidden/blanked out entirely.

Sound Feedback: Random from
/sounds/sound1.wav through sound25.wav (success only).

Math:

text


success % = (successful days / intended days) x 100
7. KPI TRACKER SCREEN
Access: PIN required

Interface: Same 7×8 grid, but tapping cells invokes numeric keypad.

Scoring Logic
Input value ≥ min AND ≤ max → Green (success)
Out of range → Red (fail)
No entry → Drag “?” icon into cell → Red cell with white “?”
Sound plays on success; silent on fail
All 7 days required
8. POST‑IT NOTE SYSTEM (DIGITAL INK)
Objective: Enable users to send visual touch‑written messages to each other without keyboard input.

Send Process
Tap Post‑it icon → Enter PIN
Free drawing canvas appears
Features
16 background colors
16 ink colors
3 brush sizes (thin, medium, thick)
Eraser icon → clears ink only (background preserved)
16 draggable emojis (e.g. thumbsup, heart, laugh, cry, etc.)
File saved as message_[id].png
Message triggers flashing speech bubble icon for recipient
Viewing Process
Tap flashing bubble → message screen
Tap Read → deletes current message, auto‑loads next if any
Emoji Path


/emojis/[emojiname].png
9. ALERTS & SNOOZE CONTROL
Daily Check: 06:00 AM.

js


if (!padlockedYesterday && !user_snooze_active)
   showFlashingModal(user);
Snooze System

User can set X days off (holiday/absence)
Sets user_snooze_active = true with snooze_expiry timestamp
Alerts disabled until expiry
10. DIRECTORY & ASSET MAP
Root: /home/sharmanator/habits-app/

Folder	Contents	Purpose
/icons/	dashboardgear.png, postit.png, kpi.png, habits.png, speechbubble.png, openpadlock.png, closedpadlock.png, viewingeye.png, snooze.png	Navigation & state icons
/emojis/	kiss.png, thumbsup.png, heart.png, wink.png, thinking.png, shrug.png, faceplant.png, laughing.png, crying.png, angry.png, tongueout.png, crazy.png, yawn.png, punch.png, flexedarm.png, drool.png	Post‑it emoji set
/sounds/	sound1.wav → sound25.wav	Randomized habit/KPI success sounds
/data/	u1_data.json, u2_data.json	User data storage
/logs/	sync.log	Backup and error tracking
11. CALCULATIONS & METRICS
Metric	Formula
Habit Success %	(completed / intended) * 100
KPI Success %	(in range / total) * 100
Streak	Increment +1 on success, reset on fail
Displayed	Current and Highest streaks
Do not include the current day’s data in averages.

12. INTERFACE VISUALS & UX
Color palette: flat, bold, and clean.
Touch targets: minimum 60px height/width.
Grid cells: neutral gray (default), green (success), red (failure).
Popups & overlays: semi‑transparent (80%).
Home screen symmetry: left and right halves fully mirrored.
13. TECHNOLOGY STACK
Layer	Tool / Tech
Frontend	HTML5, CSS3, Vanilla JS (or Light Vue/React)
Backend (Local)	Node.js with Express (optional) for Drive sync wrapper
Data	Local JSON persistence
Security	PIN stored as SHA‑256 hash
Offline Support	Service Worker or Retry Sync Logic
Viewport	1920×1080, responsive grid
Deployment	Windows dev → Raspberry Pi kiosk
14. VALIDATION & SAFETY RULES
Text fields: letters only
Number fields: digits + decimal point only
PIN = 4 digits exactly
Each save automatically backs up data
Inactivity > 5 minutes → return Home
Backup runs silently (to avoid lag)
Offline mode fully functional until sync resumes
15. DELIVERABLES
Google Antigravity must generate:

Full responsive HTML/CSS/JS application structure
Six primary screens:
Home
Dashboard (Configurator)
Habit Tracker
KPI Tracker
Post‑it Send
Post‑it View
Virtual keyboards and number pads
Drag‑and‑drop and tap‑input logic
JSON I/O system
Google Drive API sync module
Touch‑ready interface optimized for both Windows and Raspberry Pi deploys
16. FINAL NOTES FOR ANTIGRAVITY
Begin build inside Windows environment to ensure full functional testing before Linux port.
Use relative paths for all assets—no OS‑specific syntax.
Ensure kiosk‑ready HTML with navigation buttons and inactivity timer baked in.
Sound, emoji, and icon paths exactly match directory map.
Output should be a complete project ready for immediate testing under Windows, then move to Raspberry Pi by copying the /habits-app/ directory in full.