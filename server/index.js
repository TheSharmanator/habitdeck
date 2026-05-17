import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Ensure data directory exists (missing after fresh clone) ---
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('[Boot] Created server/data/ directory.');
}

// --- Paths ---
const getDataPath = (userId) => path.join(__dirname, 'data', `${userId}_data.json`);
const getConfigPath = () => path.join(__dirname, 'data', 'appConfig.json');

const defaultData = { username: '', pin: '', habits: [], kpis: [] };
const defaultConfig = { firstRun: true, backupEnabled: false, driveConfig: {} };

// --- Config helpers ---
const getConfig = () => {
  const p = getConfigPath();
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  return defaultConfig;
};

const saveConfig = (config) => {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
};

// --- User data endpoints ---
app.get('/api/data/:userId', (req, res) => {
  const filePath = getDataPath(req.params.userId);
  if (fs.existsSync(filePath)) {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (parsed && Object.keys(parsed).length > 0) {
      res.json(parsed);
      return;
    }
  }
  res.json(defaultData);
});

app.post('/api/data/:userId', (req, res) => {
  fs.writeFileSync(getDataPath(req.params.userId), JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

app.delete('/api/data/:userId', (req, res) => {
  const filePath = getDataPath(req.params.userId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User data not found' });
  }
});

// --- Config endpoints ---
app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

app.post('/api/config', (req, res) => {
  saveConfig(req.body);
  res.json({ success: true });
});

// --- Manual backup trigger (for testing) ---
app.post('/api/backup/run', async (req, res) => {
  await backupToDrive();
  res.json({ success: true });
});

// --- Google Drive Backup ---
const backupToDrive = async () => {
  const config = getConfig();
  if (!config.backupEnabled || !config.driveConfig?.clientId) {
    console.log('[Backup] Skipped — not configured.');
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      config.driveConfig.clientId,
      config.driveConfig.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    oauth2Client.setCredentials({ refresh_token: config.driveConfig.refreshToken });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const dataDir = path.join(__dirname, 'data');
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'appConfig.json');

    for (const file of files) {
      const driveName = `habitdeck_${file}`;
      const existing = await drive.files.list({
        q: `name='${driveName}' and trashed=false`,
        fields: 'files(id)'
      });

      const media = {
        mimeType: 'application/json',
        body: fs.createReadStream(path.join(dataDir, file))
      };

      if (existing.data.files.length > 0) {
        await drive.files.update({ fileId: existing.data.files[0].id, media });
        console.log(`[Backup] Updated ${driveName} on Drive.`);
      } else {
        await drive.files.create({ requestBody: { name: driveName }, media });
        console.log(`[Backup] Uploaded ${driveName} to Drive.`);
      }
    }
    console.log('[Backup] Complete.');
  } catch (err) {
    console.error('[Backup] Failed:', err.message);
  }
};

// Schedule at 2am every day
cron.schedule('0 2 * * *', () => {
  console.log('[Backup] Running scheduled backup...');
  backupToDrive();
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
