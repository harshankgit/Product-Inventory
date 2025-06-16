import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { defaultCategories } from '@/lib/models/Category';
import { defaultProducts } from '@/lib/data/defaultProducts';
import { Product } from '@/lib/models/Product';
import { Category } from '@/lib/models/Category';

export async function POST() {
  try {
    const db = await getDatabase();
    
    // Drop existing collections if they exist
    await db.dropDatabase();
    
    // Create collections with validation
    await db.createCollection('categories', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [ "name", "createdAt" ],
          properties: {
            name: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            createdAt: {
              bsonType: "date",
              description: "must be a date and is required"
            }
          }
        }
      }
    });

    await db.createCollection('products', {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [ "name", "description", "quantity", "categories", "createdAt", "updatedAt" ],
          properties: {
            name: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            description: {
              bsonType: "string",
              description: "must be a string and is required"
            },
            quantity: {
              bsonType: "int",
              minimum: 0,
              description: "must be an integer and is required"
            },
            categories: {
              bsonType: "array",
              items: {
                bsonType: "string"
              },
              minItems: 1,
              description: "must be an array of strings and have at least one item"
            },
            createdAt: {
              bsonType: "date",
              description: "must be a date and is required"
            },
            updatedAt: {
              bsonType: "date",
              description: "must be a date and is required"
            }
          }
        }
      }
    });

    // Seed categories
    const categoriesToInsert = defaultCategories.map(name => ({
      name,
      createdAt: new Date()
    }));
    await db.collection('categories').insertMany(categoriesToInsert);

    // Seed products
    const categories = await db.collection('categories').find().toArray();
    const categoryNames = categories.map(cat => cat.name);

    const productsToInsert = defaultProducts.map(product => {
      const validCategories = product.categories.filter(cat => categoryNames.includes(cat));
      return {
        ...product,
        categories: validCategories,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await db.collection('products').insertMany(productsToInsert);

    // Create indexes for better performance
    await db.collection('products').createIndex({ name: 1 }, { unique: true });
    await db.collection('products').createIndex({ categories: 1 });
    await db.collection('products').createIndex({ createdAt: -1 });
    await db.collection('categories').createIndex({ name: 1 }, { unique: true });

    return NextResponse.json(
      { message: 'Database seeded successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to seed database:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}