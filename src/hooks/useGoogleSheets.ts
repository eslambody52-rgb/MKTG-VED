import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// Mapping based on your Google Apps Script
// Column G (7) -> Name, Column H (8) -> Val, Column E (5) -> Extra, Column C (3) -> ID/Date
export const mapSheetRow = (row: any) => ({
  id: row[2] || '', // Column C
  name: row[6] || 'بدون اسم', // Column G
  val: row[7] || '', // Column H
  extra: row[4] || '', // Column E
});

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
          const parsedData = results.data.slice(1).map(mapSheetRow).filter((item: any) => item.name !== 'بدون اسم');
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
