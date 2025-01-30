import Papa from 'papaparse';
import { CSVData, ComparisonResult } from './types';
import { getProductMapping, getStatusMapping } from './mappingUtils';
import { parseSalesforceCSV } from './salesforceCsvParser';
import { parseIncomingCSV } from './incomingCsvParser';

export { parseSalesforceCSV, parseIncomingCSV };

export const compareData = (salesforceData: CSVData[], incomingData: CSVData[]): ComparisonResult[] => {
  console.log('Starting comparison with:', {
    salesforceCount: salesforceData.length,
    incomingCount: incomingData.length,
    salesforceFirstRow: salesforceData[0],
    incomingFirstRow: incomingData[0]
  });
  
  const results: ComparisonResult[] = [];
  const productMappings = getProductMapping();
  const statusMappings = getStatusMapping();

  incomingData.forEach(incoming => {
    const salesforce = salesforceData.find(sf => {
      const sfPolicyNum = sf['Policy #']?.trim();
      const incomingAppId = incoming.ApplicationID?.trim();
      console.log('Comparing:', { sfPolicyNum, incomingAppId });
      return sfPolicyNum === incomingAppId;
    });
    
    if (!salesforce) {
      console.log('No matching Salesforce record found for ApplicationID:', incoming.ApplicationID);
      return;
    }

    // Get values with proper null checks
    const salesforceStatus = salesforce.ApplicationStatus?.trim() || '';
    const incomingStatus = incoming.Status?.trim() || '';
    const salesforcePremium = salesforce.PremiumIssued?.trim() || '$0';
    const incomingPremium = incoming.PremiumAmount?.trim() || '$0';
    const salesforceProduct = salesforce.ProductIssued?.trim() || '';
    const incomingProductType = incoming.ProductType?.trim() || '';
    const incomingTieredRisk = incoming.TieredRisk?.trim() || '';

    console.log('Comparing records:', {
      salesforce: {
        premium: salesforcePremium,
        status: salesforceStatus,
        product: salesforceProduct
      },
      incoming: {
        premium: incomingPremium,
        status: incomingStatus,
        product: `${incomingProductType}${incomingTieredRisk ? ' + ' + incomingTieredRisk : ''}`
      }
    });

    // Parse premium values with proper error handling
    const sfPremiumValue = parseFloat((salesforcePremium || '').replace(/[$,]/g, '')) || 0;
    const inPremiumValue = parseFloat((incomingPremium || '').replace(/[$,]/g, '')) || 0;

    // Check status mapping
    const statusMismatch = salesforceStatus !== incomingStatus && 
      !statusMappings.some(m => 
        m.salesforce.toLowerCase() === salesforceStatus.toLowerCase() && 
        m.incoming.toLowerCase() === incomingStatus.toLowerCase()
      );

    // Construct and compare product strings
    const incomingProductFull = `${incomingProductType}${incomingTieredRisk ? ' + ' + incomingTieredRisk : ''}`;
    
    const productMismatch = salesforceProduct !== incomingProductFull && 
      !productMappings.some(m => 
        m.salesforce.toLowerCase() === salesforceProduct.toLowerCase() && 
        m.incoming.toLowerCase() === incomingProductFull.toLowerCase()
      );

    const premiumMismatch = Math.abs(sfPremiumValue - inPremiumValue) > 0.01;

    if (statusMismatch || productMismatch || premiumMismatch) {
      results.push({
        policyId: incoming.ApplicationID,
        salesforceStatus: salesforceStatus,
        incomingStatus: incomingStatus,
        salesforcePremium: salesforcePremium,
        incomingPremium: incomingPremium,
        salesforceProduct: salesforceProduct,
        incomingProduct: incomingProductFull,
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