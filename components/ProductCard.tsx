"use client";

import { Product } from '@/lib/models/Product';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ProductCardProps {
  product: Product;
  onDelete: () => void;
}

export function ProductCard({ product, onDelete }: ProductCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="truncate font-semibold">{product.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Quantity:</span>
          <Badge variant="outline" className="font-semibold">
            {product.quantity}
          </Badge>
        </div>

        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Categories:</span>
          <div className="flex flex-wrap gap-1">
            {product.categories.map((category) => (
              <Badge key={category} variant="secondary" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center gap-1 text-xs text-muted-foreground w-full">
          <Calendar className="h-3 w-3" />
          <span>Added {format(new Date(product.createdAt), 'MMM dd, yyyy')}</span>
        </div>
      </CardFooter>
    </Card>
  );
}