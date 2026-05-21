import { google } from 'googleapis';
import { readFileSync } from 'fs';

const keyFile = 'C:\\Users\\El-Khetta\\.gemini\\antigravity\\scratch\\marketing-dashboard v1\\sapient-flight-495410-s3-7ebddbbb3300.json';
const credentials = JSON.parse(readFileSync(keyFile, 'utf-8'));
const SPREADSHEET_ID = '1Hm7noXxv8ITMU3dNXQmqFEzfZY1mZlBJ4bQ9_ZIR0-M';

async function run() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'OPERATIONS',
  });

  const rows = response.data.values || [];
  
  const filtered = rows.filter(row => row[10] && row[10].includes('Shady Elsharkawy'));
  console.log(`Found ${filtered.length} rows for Shady Elsharkawy`);
  filtered.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}: Teacher: ${row[10]}, Date: ${row[0]}, Raw Min: "${row[14] || ''}", Final Min: "${row[15] || ''}"`);
  });
}

run().catch(console.error);
