import { z } from 'zod';

export const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(100, 'Product name must be less than 100 characters')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters')
    .trim(),
  quantity: z.number()
    .min(0, 'Quantity must be 0 or greater')
    .max(999999, 'Quantity must be less than 1,000,000'),
  categories: z.array(z.string())
    .min(1, 'At least one category must be selected')
    .max(5, 'Maximum 5 categories allowed')
});

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categories: z.array(z.string()).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional()
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductFiltersData = z.infer<typeof productFiltersSchema>;