export interface ProductMapping {
  salesforce: string;
  incoming: string;
}

export interface StatusMapping {
  salesforce: string;
  incoming: string;
}

export interface ComparisonResult {
  policyId: string;
  salesforceStatus: string;
  incomingStatus: string;
  salesforcePremium: string;
  incomingPremium: string;
  salesforceProduct: string;
  incomingProduct: string;
  statusMismatch: boolean;
  premiumMismatch: boolean;
  productMismatch: boolean;
}

export interface CSVData {
  [key: string]: string;
}