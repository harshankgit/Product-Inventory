import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { defaultProducts } from '@/lib/data/defaultProducts';
import { Category } from '@/lib/models/Category';

export async function POST() {
  try {
    const db = await getDatabase();
    
    // Check if products already exist
    const existingProducts = await db.collection('products').countDocuments();
    
    if (existingProducts > 0) {
      return NextResponse.json(
        { message: 'Products already seeded' },
        { status: 200 }
      );
    }

    // Get all categories to validate against
    const categories = await db.collection('categories').find().toArray();
    const categoryNames = categories.map(cat => cat.name);

    // Validate product categories against existing categories
    const productsToInsert = defaultProducts.map(product => {
      // Filter out any categories that don't exist
      const validCategories = product.categories.filter(cat => categoryNames.includes(cat));
      
      return {
        ...product,
        categories: validCategories,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    // Insert products
    await db.collection('products').insertMany(productsToInsert);

    return NextResponse.json(
      { message: 'Products seeded successfully', count: productsToInsert.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to seed products:', error);
    return NextResponse.json(
      { error: 'Failed to seed products' },
      { status: 500 }
    );
  }
}
