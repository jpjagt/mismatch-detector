import { ProductMapping, StatusMapping } from './types';

const DEFAULT_PRODUCT_MAPPINGS: ProductMapping[] = [
  { salesforce: 'TruStage Advantage Whole Life (TAWL) - Preferred', incoming: 'TAWL + Good Risk' },
  { salesforce: 'TruStage Advantage Whole Life (TAWL) - Standard', incoming: 'TAWL + Moderate Risk' },
  { salesforce: 'TruStage Guaranteed Whole Life (GAWL)', incoming: 'GAWL' },
  { salesforce: 'TruStage Term Band 1', incoming: 'SI Term Band 1' },
  { salesforce: 'TruStage Term Band 2', incoming: 'SI Term Band 2' }
];

const DEFAULT_STATUS_MAPPINGS: StatusMapping[] = [
  { salesforce: 'Policy Issued', incoming: 'Approved' }
];

export const getProductMapping = (): ProductMapping[] => {
  const stored = localStorage.getItem('productMappings');
  return stored ? JSON.parse(stored) : DEFAULT_PRODUCT_MAPPINGS;
};

export const getStatusMapping = (): StatusMapping[] => {
  const stored = localStorage.getItem('statusMappings');
  return stored ? JSON.parse(stored) : DEFAULT_STATUS_MAPPINGS;
};

export const saveProductMapping = (mappings: ProductMapping[]) => {
  localStorage.setItem('productMappings', JSON.stringify(mappings));
};

export const saveStatusMapping = (mappings: StatusMapping[]) => {
  localStorage.setItem('statusMappings', JSON.stringify(mappings));
};