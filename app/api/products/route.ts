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
    
    // Get database connection
    const db = await getDatabase();
    const collection = db.collection('products');

    // Check for duplicate product name
    const existingProduct = await collection.findOne({ 
      name: { $regex: `^${validatedData.name}$`, $options: 'i' }
    });
    
    if (existingProduct) {
      return NextResponse.json(
        { 
          error: 'A product with this name already exists',
          details: 'Please choose a different name for this product'
        },
        { status: 409 }
      );
    }

    // Create new product
    const product = {
      ...validatedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert product
    const result = await collection.insertOne(product);
    
    if (!result.acknowledged) {
      throw new Error('Product insertion failed');
    }

    // Fetch the created product
    const createdProduct = await collection.findOne({ _id: result.insertedId });

    if (!createdProduct) {
      throw new Error('Failed to fetch created product');
    }

    return NextResponse.json(
      {
        ...createdProduct,
        _id: createdProduct._id.toString(),
        success: true,
        message: 'Product created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Product creation error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: error.message 
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { 
            error: 'Database connection failed',
            details: 'Please check if MongoDB is running'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('duplicate')) {
        return NextResponse.json(
          { 
            error: 'Duplicate product',
            details: 'A product with this name already exists'
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('insertion failed')) {
        return NextResponse.json(
          { 
            error: 'Product insertion failed',
            details: error.message
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}