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
  let foundRaw = 0;
  let foundFinal = 0;
  
  console.log(`Total rows: ${rows.length}`);
  
  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    if (row[14]) {
      foundRaw++;
      if (foundRaw <= 5) console.log(`Row ${i} Raw: ${row[14]}`);
    }
    if (row[15]) {
      foundFinal++;
      if (foundFinal <= 5) console.log(`Row ${i} Final: ${row[15]}`);
    }
  }
  
  console.log(`Found Raw: ${foundRaw}, Found Final: ${foundFinal}`);
}

run().catch(console.error);
