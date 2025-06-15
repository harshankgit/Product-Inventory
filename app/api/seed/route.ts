import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { defaultCategories } from '@/lib/models/Category';

export async function POST() {
  try {
    const db = await getDatabase();
    
    // Check if categories already exist
    const existingCategories = await db.collection('categories').countDocuments();
    
    if (existingCategories > 0) {
      return NextResponse.json(
        { message: 'Categories already seeded' },
        { status: 200 }
      );
    }

    // Insert default categories
    const categoriesToInsert = defaultCategories.map(name => ({
      name,
      createdAt: new Date()
    }));

    await db.collection('categories').insertMany(categoriesToInsert);

    // Create indexes for better performance
    await db.collection('products').createIndex({ name: 1 }, { unique: true });
    await db.collection('products').createIndex({ categories: 1 });
    await db.collection('products').createIndex({ createdAt: -1 });
    await db.collection('categories').createIndex({ name: 1 }, { unique: true });

    return NextResponse.json(
      { message: 'Database seeded successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to seed database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}