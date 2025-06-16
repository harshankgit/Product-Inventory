import { MongoClient, Db, ServerApiVersion, MongoClientOptions } from 'mongodb';

// MongoDB connection options
const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 100,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 45000,
};

// Default MongoDB URI
const defaultUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

async function initializeClient() {
  try {
    if (!defaultUri) {
      throw new Error('MongoDB URI is not configured');
    }

    client = new MongoClient(defaultUri, options);
    await client.connect();
    
    // Test the connection
    const db = client.db('product_inventory');
    await db.command({ ping: 1 });
    
    console.log('MongoDB connected successfully');
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = initializeClient();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = initializeClient();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    const db = client.db('product_inventory');
    
    // Test the database connection
    await db.command({ ping: 1 });
    
    return db;
  } catch (error) {
    console.error('Failed to get database:', error);
    throw new Error(`Failed to access database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}