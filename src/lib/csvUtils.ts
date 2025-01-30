import Papa from 'papaparse';
import { CSVData, ComparisonResult } from './types';
import { getProductMapping, getStatusMapping } from './mappingUtils';

const EXPECTED_SF_HEADERS = ['PolicyId', 'ApplicationStatus', 'PremiumIssued', 'ProductIssued'];
const EXPECTED_INCOMING_HEADERS = ['PolicyId', 'Status', 'PremiumAmount', 'ProductType', 'TieredRisk'];

const findHeaderRow = (rows: string[][]): number => {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Check if this row contains all expected headers (case-insensitive)
    const rowHeaders = row.map(header => header.toLowerCase());
    const isSFHeaders = EXPECTED_SF_HEADERS.every(header => 
      rowHeaders.includes(header.toLowerCase())
    );
    const isIncomingHeaders = EXPECTED_INCOMING_HEADERS.every(header => 
      rowHeaders.includes(header.toLowerCase())
    );
    
    if (isSFHeaders || isIncomingHeaders) {
      return i;
    }
  }
  return 0; // Default to first row if no headers found
};

export const parseCSV = async (file: File): Promise<CSVData[]> => {
  // First read the file to find the header row
  const firstPassText = await file.text();
  const firstPassResults = Papa.parse(firstPassText, { header: false });
  const headerRowIndex = findHeaderRow(firstPassResults.data as string[][]);

  // Create a new File object with the correct starting point
  const rows = firstPassText.split('\n');
  const relevantRows = rows.slice(headerRowIndex);
  const newFileContent = relevantRows.join('\n');
  const newFile = new File([newFileContent], file.name, { type: file.type });

  return new Promise((resolve, reject) => {
    Papa.parse(newFile, {
      header: true,
      transform: (value) => value.trim(),
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        resolve(results.data as CSVData[]);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const compareData = (salesforceData: CSVData[], incomingData: CSVData[]): ComparisonResult[] => {
  const results: ComparisonResult[] = [];
  const productMappings = getProductMapping();
  const statusMappings = getStatusMapping();

  incomingData.forEach(incoming => {
    const salesforce = salesforceData.find(sf => sf.PolicyId === incoming.PolicyId);
    if (!salesforce) return;

    const salesforcePremium = parseFloat(salesforce.PremiumIssued.replace('$', ''));
    const incomingPremium = parseFloat(incoming.PremiumAmount);

    // Check status - first check exact match, then try mappings
    const statusMismatch = salesforce.ApplicationStatus !== incoming.Status && 
      !statusMappings.some(m => m.salesforce === salesforce.ApplicationStatus && m.incoming === incoming.Status);

    // Construct incoming product string
    const incomingProductFull = `${incoming.ProductType}${incoming.TieredRisk ? ' + ' + incoming.TieredRisk : ''}`;
    
    // Check product - first check exact match, then try mappings
    const productMismatch = salesforce.ProductIssued !== incomingProductFull && 
      !productMappings.some(m => m.salesforce === salesforce.ProductIssued && m.incoming === incomingProductFull);

    const premiumMismatch = Math.abs(salesforcePremium - incomingPremium) > 0.01;

    if (statusMismatch || productMismatch || premiumMismatch) {
      results.push({
        policyId: incoming.PolicyId,
        salesforceStatus: salesforce.ApplicationStatus,
        incomingStatus: incoming.Status,
        salesforcePremium: salesforce.PremiumIssued,
        incomingPremium: incoming.PremiumAmount,
        salesforceProduct: salesforce.ProductIssued,
        incomingProduct: incomingProductFull,
        statusMismatch,
        premiumMismatch,
        productMismatch
      });
    }
  });

  return results;
};

export const exportToCSV = (data: ComparisonResult[]) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'mismatches.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
