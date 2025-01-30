import Papa from 'papaparse';
import { CSVData } from './types';

const EXPECTED_HEADERS = ['PolicyId', 'ApplicationStatus', 'PremiumIssued', 'ProductIssued'];

const findHeaderRow = (rows: string[][]): number => {
  console.log('Searching for Salesforce headers in first 20 rows:', rows.slice(0, 3));
  
  // Search through first 20 rows, skipping empty rows
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      console.log(`Skipping empty row ${i}`);
      continue;
    }

    const rowHeaders = row.map(header => header?.toLowerCase()?.trim() || '');
    console.log(`Checking row ${i} headers:`, rowHeaders);

    // Check if this row contains "policy" and "#" in any case combination
    if (rowHeaders.some(header => header.includes('policy') && header.includes('#'))) {
      console.log('Found Salesforce headers at row:', i);
      return i;
    }
  }
  
  console.log('No Salesforce headers found in first 20 rows, defaulting to row 0');
  return 0;
};

export const parseSalesforceCSV = async (file: File): Promise<CSVData[]> => {
  console.log('Starting Salesforce CSV parse for file:', file.name);
  
  const fileContent = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        console.log('Successfully read Salesforce file content');
        resolve(e.target.result);
      } else {
        console.error('Failed to read Salesforce file as text');
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
      skipEmptyLines: true // Changed to true to skip empty lines during initial parsing
    });
    
    const headerRowIndex = findHeaderRow(firstPass.data as string[][]);

    // Split content into lines and filter out empty lines
    const lines = fileContent.split('\n').filter(line => line.trim());
    const relevantLines = lines.slice(headerRowIndex);
    
    // Join the relevant lines back together
    const relevantContent = relevantLines.join('\n');

    console.log('Parsing Salesforce CSV with headers starting at row:', headerRowIndex);
    console.log('First line of relevant content:', relevantLines[0]);
    
    Papa.parse(relevantContent, {
      header: true,
      skipEmptyLines: true, // Changed to true to skip empty lines during final parsing
      transform: (value) => value.trim(),
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Salesforce CSV parsing warnings:', results.errors);
        }
        
        // Log the first row to verify we're getting the correct data
        if (results.data.length > 0) {
          console.log('First parsed row:', results.data[0]);
        }
        
        console.log('Successfully parsed Salesforce CSV, row count:', results.data.length);
        resolve(results.data as CSVData[]);
      },
      error: (error) => {
        console.error('Failed to parse Salesforce CSV:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};