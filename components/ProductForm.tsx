"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validations/product';
import { Category, isCategory } from '@/lib/models/Category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormProps {
  categories: Category[];
  onProductAdded: () => void;
}

export function ProductForm({ categories, onProductAdded }: ProductFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validCategories, setValidCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (!categories) {
      setLoading(true);
      setErrorState('Loading categories...');
      return;
    }

    setLoading(false);
    setErrorState(null);
    setValidCategories(categories);
  }, [categories]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    setError,
    clearErrors
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 0,
      categories: []
    }
  });

  const handleCategoryToggle = (categoryName: string) => {
    if (!validCategories.some(cat => cat.name === categoryName)) {
      console.warn(`Category '${categoryName}' not found in valid categories`);
      return;
    }

    const updatedCategories = selectedCategories.includes(categoryName)
      ? selectedCategories.filter(cat => cat !== categoryName)
      : [...selectedCategories, categoryName];
    
    setSelectedCategories(updatedCategories);
    setValue('categories', updatedCategories);
    
    if (updatedCategories.length > 0) {
      clearErrors('categories');
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          categories: selectedCategories
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          setError('name', { message: result.error });
          toast.error(result.details || result.error);
        } else if (response.status === 400) {
          // Validation error
          if (result.details) {
            if (result.details.includes('name')) {
              setError('name', { message: 'Invalid product name' });
            }
            if (result.details.includes('description')) {
              setError('description', { message: 'Invalid description' });
            }
            if (result.details.includes('quantity')) {
              setError('quantity', { message: 'Invalid quantity' });
            }
            if (result.details.includes('categories')) {
              setError('categories', { message: 'Invalid categories' });
            }
          }
          toast.error(result.details || 'Validation failed');
        } else if (response.status === 500) {
          toast.error(result.details || 'Server error occurred');
        } else {
          toast.error(result.error || 'Failed to create product');
        }
        return;
      }

      // Handle successful response
      if (result.success) {
        toast.success(result.message || 'Product added successfully!');
        reset();
        setSelectedCategories([]);
        onProductAdded();
      } else {
        toast.error(result.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add New Product
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter product name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="Enter quantity"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter product description"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categories *</Label>
            <div className="flex flex-wrap gap-2">
              {validCategories.map((category) => (
                <Badge
                  key={category._id}
                  variant={selectedCategories.includes(category.name) ? 'secondary' : 'outline'}
                  onClick={() => handleCategoryToggle(category.name)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
            {errors.categories && (
              <p className="text-sm text-red-500">{errors.categories.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2">Creating...</span>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}