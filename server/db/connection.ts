import mongoose from 'mongoose';
import { env } from '../config/env.ts';
import { LocalModel, loadLocalStore } from './store.ts';

let usingMongo = false;

export async function connectDatabase(): Promise<void> {
  if (env.MONGODB_URI) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      usingMongo = true;
      console.log('Connected to MongoDB via Mongoose ODM');
      return;
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to persistent local document store:', err);
    }
  }
  loadLocalStore();
  usingMongo = false;
  console.log('Initialized persistent Mongoose-compatible document store');
}

export function isUsingExternalMongo(): boolean {
  return usingMongo;
}

export function createModel<T extends Record<string, any>>(
  name: string,
  schema: mongoose.Schema
): LocalModel<T> {
  if (env.MONGODB_URI) {
    const m = (mongoose.models[name] as mongoose.Model<T>) || mongoose.model<T>(name, schema);
    return m as unknown as LocalModel<T>;
  }
  return new LocalModel<T>(name, schema);
}
