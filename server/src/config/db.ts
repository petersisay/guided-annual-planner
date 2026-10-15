import mongoose from 'mongoose';
import { env } from './env';

let memoryServerInstance: any = null;

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 2500,
    });
    if (env.NODE_ENV !== 'test') {
      console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    }
    return conn;
  } catch (err) {
    if (env.NODE_ENV === 'development') {
      console.warn(`[MongoDB] No external daemon listening on ${mongoUri}.`);
      console.log(`[MongoDB] Starting embedded MongoDB engine (mongodb-memory-server) for local development...`);
      try {
        // @ts-ignore
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!memoryServerInstance) {
          memoryServerInstance = await MongoMemoryServer.create();
        }
        const memUri = memoryServerInstance.getUri();
        const conn = await mongoose.connect(memUri, {
          autoIndex: true,
        });
        console.log(`[MongoDB] Embedded local MongoDB connected at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error('[MongoDB] Embedded instance startup failed:', memErr);
        throw err;
      }
    }

    console.error('[MongoDB] Connection error:', err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}
