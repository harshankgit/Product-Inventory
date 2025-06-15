export interface Product {
  _id?: string;
  name: string;
  description: string;
  quantity: number;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  quantity: number;
  categories: string[];
}

export interface ProductFilters {
  search?: string;
  categories?: string[];
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}