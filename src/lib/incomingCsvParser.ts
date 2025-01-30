import Papa from 'papaparse';
import { CSVData } from './types';

const EXPECTED_HEADERS = ['PolicyId', 'Status', 'PremiumAmount', 'ProductType', 'TieredRisk'];

const findHeaderRow = (rows: string[][]): number => {
  console.log('Searching for Incoming headers in rows:', rows.slice(0, 3));
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowHeaders = row.map(header => header.toLowerCase());
    const hasAllHeaders = EXPECTED_HEADERS.every(header => 
      rowHeaders.includes(header.toLowerCase())
    );
    
    if (hasAllHeaders) {
      console.log('Found Incoming headers at row:', i);
      return i;
    }
  }
  console.log('No Incoming headers found, defaulting to row 0');
  return 0;
};

export const parseIncomingCSV = async (file: File): Promise<CSVData[]> => {
  console.log('Starting Incoming CSV parse for file:', file.name);
  
  const fileContent = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        console.log('Successfully read Incoming file content');
        resolve(e.target.result);
      } else {
        console.error('Failed to read Incoming file as text');
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });

  return new Promise((resolve, reject) => {
    // First find the header row
    const firstPass = Papa.parse(fileContent, { 
      header: false,
      skipEmptyLines: 'greedy'
    });
    
    const headerRowIndex = findHeaderRow(firstPass.data as string[][]);
    const relevantContent = fileContent
      .split('\n')
      .slice(headerRowIndex)
      .join('\n');

    console.log('Parsing Incoming CSV with headers starting at row:', headerRowIndex);
    
    Papa.parse(relevantContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transform: (value) => value.trim(),
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Incoming CSV parsing warnings:', results.errors);
        }
        console.log('Successfully parsed Incoming CSV, row count:', results.data.length);
        resolve(results.data as CSVData[]);
      },
      error: (error) => {
        console.error('Failed to parse Incoming CSV:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};