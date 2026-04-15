require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { v4: uuidv4 } = require('uuid');

// Use native fetch and FormData from Node.js 20+
const fetch = globalThis.fetch;
const FormData = globalThis.FormData;

const STATE_FILE = path.join(__dirname, 'migration-state.json');
const LOG_FILE = path.join(__dirname, 'migration.log');
const MAPPINGS_FILE = path.join(__dirname, 'migrations.json');

const SHEETS_CONFIG = [
  { title: 'GymMembers', photoField: 'Profile Photo', folder: 'gymmembers', nameField: 'Name' },
  { title: 'WellnessPatients', photoField: 'Profile Photo', folder: 'wellnesspatient', nameField: 'Name' },
  { title: 'Inquires', photoField: 'Photo', folder: 'inquires', nameField: 'Name' },
];

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${type}: ${message}`;
  console.log(logLine);
  fs.appendFileSync(LOG_FILE, logLine + '\n');
}

function loadState() {
  return { progress: [], stats: { total: 0, migrated: 0, failed: 0, skipped: 0 } };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function loadMappings() {
  if (fs.existsSync(MAPPINGS_FILE)) {
    return JSON.parse(fs.readFileSync(MAPPINGS_FILE, 'utf-8'));
  }
  return [];
}

function saveMappings(mappings) {
  fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
}

async function uploadToCloudinary(imageBuffer, folder, filename) {
  const base64 = imageBuffer.toString('base64');
  const formData = new FormData();
  formData.append('file', `data:image/jpeg;base64,${base64}`);
  formData.append('folder', folder);
  formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.secure_url;
}

async function migrateSheet(doc, state, config) {
  const mappings = loadMappings();
  const sheet = doc.sheetsByTitle[config.title];
  if (!sheet) {
    log(`Sheet not found: ${config.title}`, 'ERROR');
    return;
  }
  
  const rows = await sheet.getRows();
  
  const startIdx = state.progress.find(p => p.sheet === config.title)?.rowIndex ?? 0;
  
  log(`Starting migration: ${config.title} (${rows.length} rows)`, 'START');
  
  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    const url = row[config.photoField];
    const name = row[config.nameField] || row['Name '] || 'Unknown';
    
    log(`Processing row ${i + 1}/${rows.length}: ${name}`, 'PROGRESS');
    state.stats.total++;
    
    if (!url || url.trim() === '') {
      log('SKIPPED: No photo URL', 'SKIP');
      state.stats.skipped++;
      continue;
    }
    
    if (!url.includes('firebasestorage.googleapis.com')) {
      log(`SKIPPED: Already Cloudinary URL`, 'SKIP');
      state.stats.skipped++;
      continue;
    }
    
    try {
      const imageRes = await fetch(url);
      if (!imageRes.ok) {
        throw new Error(`Failed to fetch image: ${imageRes.status}`);
      }
      const buffer = await imageRes.arrayBuffer();
      const bufferObj = Buffer.from(buffer);
      const filename = url.split('/').pop().split('?')[0] || `photo_${i}.jpg`;
      
      const cloudinaryUrl = await uploadToCloudinary(bufferObj, config.folder, filename);
      row[config.photoField] = cloudinaryUrl;
      await row.save();
      
      log(`SUCCESS: ${url.substring(0, 50)}... → ${cloudinaryUrl.substring(0, 50)}...`, 'SUCCESS');
      state.stats.migrated++;
      
      mappings.push({
        sheet: config.title,
        rowIndex: i + 1,
        name: name,
        oldUrl: url,
        newUrl: cloudinaryUrl,
        migratedAt: new Date().toISOString()
      });
      saveMappings(mappings);
    } catch (err) {
      log(`FAILED: ${err.message}`, 'ERROR');
      state.stats.failed++;
    }
    
    state.progress = state.progress.filter(p => p.sheet !== config.title);
    state.progress.push({ sheet: config.title, rowIndex: i + 1 });
    saveState(state);
  }
  
  state.progress = state.progress.filter(p => p.sheet !== config.title);
  saveState(state);
  log(`Migration complete: ${config.title}`, 'DONE');
}

async function main() {
  log('=== Starting migration ===', 'START');
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_UPLOAD_PRESET) {
    log('ERROR: Cloudinary environment variables not set', 'FATAL');
    process.exit(1);
  }
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    log('ERROR: Google service account credentials not set', 'FATAL');
    process.exit(1);
  }
  
  const state = loadState();
  
  const doc = new GoogleSpreadsheet(process.env.REACT_APP_GOOGLE_SHEETS_ID);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n'),
  });
  await doc.loadInfo();
  
  for (const config of SHEETS_CONFIG) {
    log(`Starting migration: ${config.title}`, 'START');
    await migrateSheet(doc, state, config);
  }
  
  log('=== Migration complete ===', 'END');
  log(`Final Stats: Total=${state.stats.total}, Migrated=${state.stats.migrated}, Failed=${state.stats.failed}, Skipped=${state.stats.skipped}`, 'STATS');
}

main().catch(err => {
  log(err.message, 'FATAL');
  process.exit(1);
});