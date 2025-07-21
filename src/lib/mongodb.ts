import { MongoClient, ServerApiVersion } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Using a global variable to maintain a cached connection across hot reloads in development.
// This prevents connecting to the database on every request.
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
    
    // Ensure the default user exists
    await ensureDefaultUser(db);

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

async function ensureDefaultUser(db: any) {
    const usersCollection = db.collection('users');
    const defaultUsername = 'omondiai';
    const defaultPassword = 'omondipa2@gmail.com';

    const existingUser = await usersCollection.findOne({ username: defaultUsername });

    if (!existingUser) {
        console.log(`User '${defaultUsername}' not found. Creating default user...`);
        // In a real app, you would hash the password.
        // For this prototype, we'll store it as plain text as per the original logic,
        // but note this is NOT secure for production.
        // const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await usersCollection.insertOne({
            username: defaultUsername,
            password: defaultPassword, // Storing plain text password as requested for prototype
            createdAt: new Date(),
        });
        console.log("Default user created successfully.");
    }
}
