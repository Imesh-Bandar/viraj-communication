import { Db, MongoClient, ObjectId } from "mongodb";
import { AppError } from "./errors";

const globalForMongo = globalThis as unknown as { mongo?: Promise<MongoClient> };

/** One shared connection, reused across requests and hot reloads. */
export async function getDb(): Promise<Db> {
  globalForMongo.mongo ??= new MongoClient(
    process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
    { serverSelectionTimeoutMS: 5000 },
  ).connect();
  const client = await globalForMongo.mongo;
  return client.db(process.env.MONGODB_DB ?? "viraj_pos");
}

export function toId(value: string): ObjectId {
  if (!ObjectId.isValid(value)) throw new AppError("Record not found.", 404);
  return new ObjectId(value);
}
