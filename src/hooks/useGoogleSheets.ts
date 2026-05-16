import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// Mapping based on your Google Apps Script and sheet structure
export const mapSheetRow = (row: any, gid: string) => {
  // If it's the Tagme3at tab (GID: 1535230545), the structure is for Tasks
  if (gid === '1535230545') {
    return {
      id: '',
      name: row[1] || 'بدون اسم', // Column B
      opSheet: row[2] || '', // Column C
      branch: row[3] || '', // Column D
      notesMarketing: row[4] || '', // Column E
      editor: row[5] || '', // Column F
      done: row[6] === 'TRUE', // Column G
      notesEditors: row[7] || '', // Column H
      priority: row[8] === 'TRUE', // Column I
      val: '',
      extra: '',
      subject: '',
      check1: false,
      check2: false,
    };
  }
  
  // For all other tabs (Junior, Middle, Senior), map based on the standard structure
  return {
    id: row[2] || '', // Column C (Date/ID)
    subject: row[3] || '', // Column D (Subject)
    extra: row[4] || '', // Column E (Branch)
    name: row[6] || 'بدون اسم', // Column G (OP NAME)
    val: row[7] || '', // Column H (OP SHEET)
    check1: row[8] === 'TRUE', // Column I (تجميعه)
    check2: row[9] === 'TRUE', // Column J (اتسلمت)
  };
};

// The new standard Google Sheet ID provided by the user
const SHEET_ID = '1GFMUIYZIfqFyrQ0nKxCcATP6T6HKj4_noqSqN2sVEsU';

export function useGoogleSheets(gid: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Using the export format which works with standard sheet IDs (requires the sheet to be public)
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
      
      Papa.parse(url, {
        download: true,
        header: false,
        complete: (results) => {
          // Skip header row and map data
          const parsedData = results.data
            .slice(1)
            .map((row: any) => mapSheetRow(row, gid))
            .filter((item: any) => item.name && item.name !== 'بدون اسم');
          setData(parsedData);
          setLoading(false);
        },
        error: (err: any) => {
          setError(err.message);
          setLoading(false);
        }
      });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gid) fetchData();
  }, [gid]);

  return { data, loading, error, refresh: fetchData };
}
