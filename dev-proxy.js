// Local development proxy for the Sheets API
// Run with: node dev-proxy.js
import express from 'express';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());

const SPREADSHEET_ID = '1lh0-kh9MlT4AZCi3-QBn0fkkiNpMcpg6qcoDfBeNK8g';

// Load credentials from JSON file directly (local dev only)
const keyFile = join(__dirname, 'sapient-flight-495410-s3-7ebddbbb3300.json');
const credentials = JSON.parse(readFileSync(keyFile, 'utf-8'));

app.get('/api/sheet', async (req, res) => {
  const { gid } = req.query;
  console.log(`[API] Requested GID: ${gid}`);
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    console.log('[API] Auth initialized');

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('[API] Fetching spreadsheet metadata...');
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    console.log('[API] Fetched metadata successfully');
    
    const sheetMeta = spreadsheet.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === String(gid)
    );

    if (!sheetMeta?.properties?.title) {
      console.log(`[API] Error: Sheet GID ${gid} not found`);
      return res.status(404).json({ error: `Sheet GID ${gid} not found` });
    }

    console.log(`[API] Fetching values for range: ${sheetMeta.properties.title}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetMeta.properties.title,
    });
    console.log(`[API] Fetched values: ${response.data.values?.length || 0} rows`);
    
    // Filter out rows that are entirely empty or just contain whitespace
    let validRows = (response.data.values || []).filter(row => 
      row.some(cell => cell && String(cell).trim() !== '')
    );
    
    // Performance optimization for large sheets
    if (String(gid) === '2086331904') {
      validRows = validRows
        .map(row => row.slice(0, 7)) // We only need the first 7 columns for the frontend
        .filter(row => {
          if (!row[4] || row[4] === 'بدون اسم') return false;
          // Filter out rows ending with Q and a number, optionally followed by closing brace (e.g., Q1, Q20, Q20})
          const qRegex = /Q\s*\d+[^a-zA-Z0-9]*$/i;
          if (qRegex.test(String(row[4]).trim()) || (row[5] && qRegex.test(String(row[5]).trim()))) {
            return false;
          }
          return true;
        });
    }
    
    console.log(`[API] Filtered to ${validRows.length} valid rows`);

    res.json({ rows: validRows, sheetName: sheetMeta.properties.title });
  } catch (err) {
    console.error('[API] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('✅ Dev API proxy running on http://localhost:3001'));
