import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    const db = client.db('omondi_ai_db'); 

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    throw err;
  }
}

export async function getDb() {
    const { db } = await connectToDatabase();
    return db;
}
