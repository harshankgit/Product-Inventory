import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { productSchema, productFiltersSchema } from '@/lib/validations/product';
import { ProductListResponse } from '@/lib/models/Product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      categories: searchParams.get('categories') ? 
        searchParams.get('categories')!.split(',') : undefined,
      page: searchParams.get('page') ? 
        parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? 
        parseInt(searchParams.get('limit')!) : 12
    };

    const validatedFilters = productFiltersSchema.parse(filters);
    
    const db = await getDatabase();
    const collection = db.collection('products');

    // Build MongoDB query
    const query: any = {};
    
    if (validatedFilters.search) {
      query.name = { 
        $regex: validatedFilters.search, 
        $options: 'i' 
      };
    }
    
    if (validatedFilters.categories && validatedFilters.categories.length > 0) {
      query.categories = { 
        $in: validatedFilters.categories 
      };
    }

    // Calculate pagination
    const page = validatedFilters.page || 1;
    const limit = validatedFilters.limit || 12;
    const skip = (page - 1) * limit;

    // Execute queries
    const [products, totalCount] = await Promise.all([
      collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response: ProductListResponse = {
      products: products.map(product => ({
        ...product,
        _id: product._id.toString()
      })),
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = productSchema.parse(body);
    
    const db = await getDatabase();
    const collection = db.collection('products');

    // Check for duplicate product name
    const existingProduct = await collection.findOne({ 
      name: { $regex: `^${validatedData.name}$`, $options: 'i' }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 409 }
      );
    }

    // Create new product
    const product = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(product);
    
    const createdProduct = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        ...createdProduct,
        _id: createdProduct!._id.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }
    
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}