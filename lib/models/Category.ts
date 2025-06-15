export interface Category {
  _id?: string;
  name: string;
  createdAt: Date;
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