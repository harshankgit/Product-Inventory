export interface Category {
  _id: string;
  name: string;
  createdAt: string; // MongoDB returns dates as strings
}

// Type guard to ensure Category is properly typed
export function isCategory(obj: any): obj is Category {
  return obj && typeof obj === 'object' && 
    typeof obj._id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.createdAt === 'string';
}

export const defaultCategories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Health & Beauty',
  'Toys & Games',
  'Automotive',
  'Food & Beverages',
  'Office Supplies'
];