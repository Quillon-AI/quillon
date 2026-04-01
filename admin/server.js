require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Site configs — paths to content directories
const SITES = {
  quillon: {
    name: 'quillon.ru',
    contentPath: process.env.QUILLON_PUBLIC_PATH || path.join(__dirname, '..', 'public', 'content'),
    files: ['content.json']
  },
  tech: {
    name: 'tech.quillon.ru',
    contentPath: process.env.QUILLON_TECH_PATH || path.join(__dirname, '..', 'tech', 'content'),
    files: ['content.json', 'sections.json', 'settings.json']
  }
};

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminHash = process.env.ADMIN_PASS_HASH;

  if (username !== adminUser) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (adminHash) {
    const valid = await bcrypt.compare(password, adminHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  } else {
    // Fallback for dev: password = "admin"
    if (password !== 'admin') return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// List sites
app.get('/api/sites', auth, (req, res) => {
  const sites = Object.entries(SITES).map(([id, site]) => ({
    id,
    name: site.name,
    files: site.files
  }));
  res.json(sites);
});

// Get content file
app.get('/api/sites/:siteId/:file', auth, (req, res) => {
  const site = SITES[req.params.siteId];
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const fileName = req.params.file;
  if (!site.files.includes(fileName)) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(site.contentPath, fileName);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: `Cannot read ${fileName}: ${err.message}` });
  }
});

// Save content file
app.put('/api/sites/:siteId/:file', auth, (req, res) => {
  const site = SITES[req.params.siteId];
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const fileName = req.params.file;
  if (!site.files.includes(fileName)) return res.status(404).json({ error: 'File not found' });

  const filePath = path.join(site.contentPath, fileName);

  // Backup before save
  const backupDir = path.join(site.contentPath, '.backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `${fileName}.${timestamp}.bak`);

  try {
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true, backup: backupPath });
  } catch (err) {
    res.status(500).json({ error: `Cannot save ${fileName}: ${err.message}` });
  }
});

// Get backup list
app.get('/api/sites/:siteId/:file/backups', auth, (req, res) => {
  const site = SITES[req.params.siteId];
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const fileName = req.params.file;
  const backupDir = path.join(site.contentPath, '.backups');
  if (!fs.existsSync(backupDir)) return res.json([]);

  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith(fileName))
    .sort()
    .reverse()
    .slice(0, 20);

  res.json(backups);
});

// Restore backup
app.post('/api/sites/:siteId/:file/restore/:backup', auth, (req, res) => {
  const site = SITES[req.params.siteId];
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const fileName = req.params.file;
  const backupDir = path.join(site.contentPath, '.backups');
  const backupPath = path.join(backupDir, req.params.backup);
  const filePath = path.join(site.contentPath, fileName);

  if (!fs.existsSync(backupPath)) return res.status(404).json({ error: 'Backup not found' });

  try {
    // Backup current before restore
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(filePath, path.join(backupDir, `${fileName}.${timestamp}.pre-restore.bak`));
    fs.copyFileSync(backupPath, filePath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Quillon Admin running on http://localhost:${PORT}`);
});
