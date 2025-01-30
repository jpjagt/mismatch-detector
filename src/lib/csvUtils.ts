import Papa from 'papaparse';
import { CSVData, ComparisonResult } from './types';
import { getProductMapping, getStatusMapping } from './mappingUtils';
import { parseSalesforceCSV } from './salesforceCsvParser';
import { parseIncomingCSV } from './incomingCsvParser';

export { parseSalesforceCSV, parseIncomingCSV };

export const compareData = (salesforceData: CSVData[], incomingData: CSVData[]): ComparisonResult[] => {
  console.log('Starting comparison with:', {
    salesforceCount: salesforceData.length,
    incomingCount: incomingData.length
  });
  
  const results: ComparisonResult[] = [];
  const productMappings = getProductMapping();
  const statusMappings = getStatusMapping();

  incomingData.forEach(incoming => {
    // Changed to use "Policy #" and "ApplicationID" for matching
    const salesforce = salesforceData.find(sf => sf['Policy #'] === incoming.ApplicationID);
    
    if (!salesforce) {
      console.log('No matching Salesforce record found for ApplicationID:', incoming.ApplicationID);
      return;
    }

    console.log('Comparing records for ApplicationID:', incoming.ApplicationID, {
      salesforce: {
        premium: salesforce.PremiumIssued,
        status: salesforce.ApplicationStatus,
        product: salesforce.ProductIssued
      },
      incoming: {
        premium: incoming.PremiumAmount,
        status: incoming.Status,
        product: incoming.ProductType
      }
    });

    // Safely parse premium values with fallback to 0
    const salesforcePremium = salesforce.PremiumIssued ? 
      parseFloat((salesforce.PremiumIssued || '').replace(/[$,]/g, '')) || 0 : 0;
    const incomingPremium = incoming.PremiumAmount ? 
      parseFloat((incoming.PremiumAmount || '').replace(/[$,]/g, '')) || 0 : 0;

    // Check status - first check exact match, then try mappings
    const statusMismatch = salesforce.ApplicationStatus !== incoming.Status && 
      !statusMappings.some(m => m.salesforce === salesforce.ApplicationStatus && m.incoming === incoming.Status);

    // Construct incoming product string
    const incomingProductFull = `${incoming.ProductType || ''}${incoming.TieredRisk ? ' + ' + incoming.TieredRisk : ''}`;
    
    // Check product - first check exact match, then try mappings
    const productMismatch = salesforce.ProductIssued !== incomingProductFull && 
      !productMappings.some(m => m.salesforce === salesforce.ProductIssued && m.incoming === incomingProductFull);

    const premiumMismatch = Math.abs(salesforcePremium - incomingPremium) > 0.01;

    if (statusMismatch || productMismatch || premiumMismatch) {
      results.push({
        policyId: incoming.ApplicationID, // Changed to use ApplicationID consistently
        salesforceStatus: salesforce.ApplicationStatus || '',
        incomingStatus: incoming.Status || '',
        salesforcePremium: salesforce.PremiumIssued || '$0',
        incomingPremium: incoming.PremiumAmount || '$0',
        salesforceProduct: salesforce.ProductIssued || '',
        incomingProduct: incomingProductFull || '',
        statusMismatch,
        premiumMismatch,
        productMismatch
      });
    }
  });

  console.log('Comparison complete. Found mismatches:', results.length);
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