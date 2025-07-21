import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Using a global variable to maintain a cached connection across hot reloads in development.
// This prevents connecting to the database on every request.
let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
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
    cachedClient = client;
    return client;
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    throw err;
  }
}

export async function getDb() {
    const client = await connectToDatabase();
    // In your MongoDB Atlas, you likely have a database. Let's assume its name is 'omondi_ai_db'.
    // If your user collection is in another database, change 'omondi_ai_db' to its name.
    return client.db('omondi_ai_db'); 
}
