import Papa from 'papaparse';
import { CSVData } from './types';

const EXPECTED_HEADERS = ['Policy #', 'Application Status', 'Premium Issued', 'Product Issued'];

const findHeaderRow = (rows: string[][]): number => {
  console.log('Searching for Salesforce headers in first 20 rows:', rows.slice(0, 3));
  
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(cell => !cell)) {
      console.log(`Skipping empty row ${i}`);
      continue;
    }

    const rowHeaders = row.map(header => header?.toLowerCase()?.trim() || '');
    console.log(`Checking row ${i} headers:`, rowHeaders);

    if (rowHeaders.some(header => header.includes('policy') && header.includes('#'))) {
      console.log('Found Salesforce headers at row:', i);
      return i;
    }
  }
  
  console.log('No Salesforce headers found in first 20 rows, defaulting to row 0');
  return 0;
};

const normalizeHeaders = (headers: string[]): string[] => {
  return headers.map(header => {
    const normalized = header.trim();
    // Map specific headers to expected format
    if (normalized.toLowerCase().includes('policy #')) return 'Policy #';
    if (normalized.toLowerCase().includes('application status')) return 'ApplicationStatus';
    if (normalized.toLowerCase().includes('premium issued')) return 'PremiumIssued';
    if (normalized.toLowerCase().includes('product issued')) return 'ProductIssued';
    return normalized;
  });
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
    const firstPass = Papa.parse(fileContent, { 
      header: false,
      skipEmptyLines: true
    });
    
    const headerRowIndex = findHeaderRow(firstPass.data as string[][]);
    const lines = fileContent.split('\n')
      .filter(line => line.trim())  // Remove empty lines
      .slice(headerRowIndex);
    const relevantContent = lines.join('\n');

    console.log('Parsing Salesforce CSV with headers starting at row:', headerRowIndex);
    
    Papa.parse(relevantContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => value.trim(),
      transformHeader: (header) => {
        const normalized = header.trim();
        // Map headers to expected format
        if (normalized.toLowerCase().includes('policy #')) return 'Policy #';
        if (normalized.toLowerCase().includes('application status')) return 'ApplicationStatus';
        if (normalized.toLowerCase().includes('premium issued')) return 'PremiumIssued';
        if (normalized.toLowerCase().includes('product issued')) return 'ProductIssued';
        return normalized;
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Salesforce CSV parsing warnings:', results.errors);
        }
        
        // Filter out rows without policy numbers and transform data structure
        const validData = results.data
          .filter((row: any) => row['Policy #'] && typeof row['Policy #'] === 'string' && row['Policy #'].trim())
          .map((row: any) => ({
            'Policy #': row['Policy #']?.trim(),
            ApplicationStatus: row.ApplicationStatus?.trim(),
            PremiumIssued: row.PremiumIssued?.trim(),
            ProductIssued: row.ProductIssued?.trim()
          }));

        console.log('Successfully parsed Salesforce CSV, valid rows:', validData.length);
        console.log('Sample parsed row:', validData[0]);
        
        resolve(validData as CSVData[]);
      },
      error: (error) => {
        console.error('Failed to parse Salesforce CSV:', error);
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
};