import { google } from 'googleapis';
import { readFileSync } from 'fs';

const keyFile = './sapient-flight-495410-s3-7ebddbbb3300.json';
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
  
  const matches = rows.filter(row => 
    row[12] && row[12].includes('RE-S1-T1---AR-P0138-Abdelrahman Magdy--{النموذج الشامل')
  );
  
  console.log(`Found ${matches.length} matches`);
  matches.forEach((row, i) => {
    console.log(`Row ${i}: index in sheet=${rows.indexOf(row)}, date="${row[0]}", name="${row[11]}", smartboard="${row[13]}", length=${row.length}`);
    console.log(`  col 16 (iframe): "${row[16] || ''}"`);
    console.log(`  col 17 (bunny): "${row[17] || ''}"`);
  });
}

run().catch(console.error);
