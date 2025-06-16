import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Category } from '@/lib/models/Category';

export async function GET() {
  try {
    const db = await getDatabase();
    const categories = await db.collection('categories')
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Transform MongoDB documents to Category type
    const validCategories = categories.map(cat => ({
      _id: cat._id.toString(),
      name: cat.name,
      createdAt: cat.createdAt
    }));

    return NextResponse.json(validCategories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Failed to connect to MongoDB' },
          { status: 500 }
        );
      }
      if (error.message.includes('validation')) {
        return NextResponse.json(
          { error: 'Invalid category data' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}