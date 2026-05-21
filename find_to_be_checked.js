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
  
  const filtered = rows.filter((row, index) => 
    row[13] && String(row[13]).toUpperCase().includes('TO BE CHECKED LATER')
  );
  
  console.log(`Matching rows: ${filtered.length}`);
  filtered.forEach((row, i) => {
    console.log(`Match ${i}: Date: "${row[0]}", Name: "${row[11]}", Smartboard: "${row[13]}", Raw: "${row[14] || ''}", Final: "${row[15] || ''}", exactDuration: "${row[20] || ''}", length: ${row.length}`);
  });
}

run().catch(console.error);
