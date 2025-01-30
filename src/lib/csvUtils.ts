import Papa from 'papaparse';
import { CSVData, ComparisonResult } from './types';
import { getProductMapping, getStatusMapping } from './mappingUtils';

export const parseCSV = (file: File): Promise<CSVData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
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

    const statusMismatch = !statusMappings.some(
      m => m.salesforce === salesforce.ApplicationStatus && m.incoming === incoming.Status
    );

    const productMismatch = !productMappings.some(
      m => m.salesforce === salesforce.ProductIssued && 
          m.incoming === `${incoming.ProductType}${incoming.TieredRisk ? ' + ' + incoming.TieredRisk : ''}`
    );

    const premiumMismatch = Math.abs(salesforcePremium - incomingPremium) > 0.01;

    if (statusMismatch || productMismatch || premiumMismatch) {
      results.push({
        policyId: incoming.PolicyId,
        salesforceStatus: salesforce.ApplicationStatus,
        incomingStatus: incoming.Status,
        salesforcePremium: salesforce.PremiumIssued,
        incomingPremium: incoming.PremiumAmount,
        salesforceProduct: salesforce.ProductIssued,
        incomingProduct: `${incoming.ProductType}${incoming.TieredRisk ? ' + ' + incoming.TieredRisk : ''}`,
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