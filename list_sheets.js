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
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  
  console.log('Sheets:');
  spreadsheet.data.sheets?.forEach(s => {
    console.log(`- Title: ${s.properties?.title}, ID: ${s.properties?.sheetId}`);
  });
}

run().catch(console.error);
