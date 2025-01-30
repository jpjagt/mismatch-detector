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

  // Create debug tables with proper typing
  console.log('Salesforce Data Sample (First 5 rows):');
  console.table(salesforceData.slice(0, 5));
  console.log('Incoming Data Sample (First 5 rows):');
  console.table(incomingData.slice(0, 5));
  
  const results: ComparisonResult[] = [];
  const productMappings = getProductMapping();
  const statusMappings = getStatusMapping();

  incomingData.forEach(incoming => {
    const salesforce = salesforceData.find(sf => {
      const sfPolicyNum = sf['Policy #']?.trim();
      const incomingPolicyId = incoming.PolicyId?.trim() || incoming.ApplicationID?.trim();
      console.log('Comparing policy numbers:', { sfPolicyNum, incomingPolicyId });
      return sfPolicyNum === incomingPolicyId;
    });
    
    // If no matching Salesforce record is found, add it as a mismatch
    if (!salesforce) {
      console.log('No matching Salesforce record found for PolicyId:', incoming.PolicyId || incoming.ApplicationID);
      results.push({
        policyId: incoming.PolicyId || incoming.ApplicationID || '',
        salesforceStatus: 'Not Found',
        incomingStatus: incoming.Status?.trim() || '',
        salesforcePremium: '$0',
        incomingPremium: incoming.PremiumAmount?.trim() || '$0',
        salesforceProduct: 'Not Found',
        incomingProduct: incoming.ProductType?.trim() + (incoming.TieredRisk ? ` + ${incoming.TieredRisk}` : ''),
        statusMismatch: true,
        premiumMismatch: true,
        productMismatch: true
      });
      return;
    }

    const salesforceStatus = salesforce.ApplicationStatus?.trim() || '';
    const incomingStatus = incoming.Status?.trim() || '';
    const salesforcePremium = salesforce.PremiumIssued?.trim() || '$0';
    const incomingPremium = incoming.PremiumAmount?.trim() || '$0';
    const salesforceProduct = salesforce.ProductIssued?.trim() || '';
    const incomingProductType = incoming.ProductType?.trim() || '';
    const incomingTieredRisk = incoming.TieredRisk?.trim() || '';

    console.log('Comparing records:', {
      salesforce: {
        policyNum: salesforce['Policy #'],
        premium: salesforcePremium,
        status: salesforceStatus,
        product: salesforceProduct
      },
      incoming: {
        policyId: incoming.PolicyId || incoming.ApplicationID,
        premium: incomingPremium,
        status: incomingStatus,
        product: incomingProductType,
        tieredRisk: incomingTieredRisk
      }
    });

    const sfPremiumValue = parseFloat((salesforcePremium || '').replace(/[$,]/g, '')) || 0;
    const inPremiumValue = parseFloat((incomingPremium || '').replace(/[$,]/g, '')) || 0;

    const statusMismatch = salesforceStatus !== incomingStatus && 
      !statusMappings.some(m => 
        m.salesforce.toLowerCase() === salesforceStatus.toLowerCase() && 
        m.incoming.toLowerCase() === incomingStatus.toLowerCase()
      );

    // Enhanced product comparison logic
    const productMismatch = !productMappings.some(mapping => {
      const productMatches = 
        mapping.salesforce.toLowerCase() === salesforceProduct.toLowerCase() && 
        mapping.incoming.toLowerCase() === incomingProductType.toLowerCase();

      if (!productMatches) return false;

      // If tiered risk is included in the mapping, check it matches
      if (mapping.includeTieredRisk) {
        return mapping.tieredRiskValue?.toLowerCase() === incomingTieredRisk.toLowerCase();
      }

      // If tiered risk is not included in the mapping, we don't care about its value
      return true;
    });

    const premiumMismatch = Math.abs(sfPremiumValue - inPremiumValue) > 0.01;

    if (statusMismatch || productMismatch || premiumMismatch) {
      results.push({
        policyId: incoming.PolicyId || incoming.ApplicationID,
        salesforceStatus: salesforceStatus,
        incomingStatus: incomingStatus,
        salesforcePremium: salesforcePremium,
        incomingPremium: incomingPremium,
        salesforceProduct: salesforceProduct,
        incomingProduct: incomingProductType + (incomingTieredRisk ? ` + ${incomingTieredRisk}` : ''),
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