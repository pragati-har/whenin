import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'WHENIN';

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('MongoDB is not configured or could not be reached.');
    this.name = 'DatabaseUnavailableError';
  }
}

export function getConfiguredDatabaseName() {
  if (!MONGODB_URI?.trim()) return null;
  return DATABASE_NAME;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  dbName?: string;
};

const cached = globalThis as typeof globalThis & { mongoose?: MongooseCache };

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (!MONGODB_URI?.trim()) {
    throw new DatabaseUnavailableError();
  }

  const store = cached.mongoose as MongooseCache;

  if (store.conn && mongoose.connection.readyState === 1 && mongoose.connection.name === DATABASE_NAME) {
    return store.conn;
  }

  if (!store.promise || store.dbName !== DATABASE_NAME) {
    store.dbName = DATABASE_NAME;
    store.promise = (async () => {
      if (mongoose.connection.readyState !== 0 && mongoose.connection.name !== DATABASE_NAME) {
        await mongoose.disconnect();
      }
      return mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME });
    })();
  }

  try {
    store.conn = await store.promise;
    if (mongoose.connection.name !== DATABASE_NAME) {
      throw new DatabaseUnavailableError();
    }
  } catch {
    store.promise = null;
    store.conn = null;
    throw new DatabaseUnavailableError();
  }

  return store.conn;
}
