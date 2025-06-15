"use client";

import { useState, useEffect, useCallback } from 'react';
import { Product, ProductListResponse } from '@/lib/models/Product';
import { Category } from '@/lib/models/Category';
import { ProductForm } from '@/components/ProductForm';
import { ProductList } from '@/components/ProductList';
import { ProductFilters } from '@/components/ProductFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, TrendingUp, Layers, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Initialize database and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed database first
        await fetch('/api/seed', { method: 'POST' });
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
        
        // Fetch initial products
        await fetchProducts();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        toast.error('Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data: ProductListResponse = await response.json();
      
      setProducts(data.products);
      setPagination({
        totalPages: data.totalPages,
        currentPage: data.currentPage,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage,
        totalCount: data.totalCount
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategories]);

  // Fetch products when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const handleProductAdded = () => {
    setShowForm(false);
    fetchProducts(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
  };

  const totalProducts = pagination.totalCount;
  const activeCategories = selectedCategories.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Product Inventory System
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your product inventory with ease. Add, search, filter, and organize your products efficiently.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 rounded-full mr-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <Layers className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-purple-100 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Filters</p>
                <p className="text-2xl font-bold text-gray-900">{activeCategories}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={() => setShowForm(!showForm)}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            {showForm ? 'Hide Form' : 'Add New Product'}
          </Button>
        </div>

        {/* Product Form */}
        {showForm && (
          <div className="mb-8">
            <ProductForm 
              categories={categories} 
              onProductAdded={handleProductAdded}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <ProductFilters
            categories={categories}
            searchTerm={searchTerm}
            selectedCategories={selectedCategories}
            onSearchChange={setSearchTerm}
            onCategoriesChange={setSelectedCategories}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Results Summary */}
        {(searchTerm || selectedCategories.length > 0) && (
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Found {totalProducts} product{totalProducts !== 1 ? 's' : ''}
                    </span>
                    {searchTerm && (
                      <Badge variant="outline">
                        Search: "{searchTerm}"
                      </Badge>
                    )}
                    {selectedCategories.map(category => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : (
          <ProductList
            products={products}
            totalPages={pagination.totalPages}
            currentPage={pagination.currentPage}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onPageChange={handlePageChange}
            onProductsChange={() => fetchProducts(pagination.currentPage)}
          />
        )}
      </div>
    </div>
  );
}