import bcrypt from "bcryptjs";
import { handle } from "@/lib/api";
import { getDb } from "@/lib/db";
import { userSchema } from "@/lib/schemas";

export const GET = handle(async () => {
  const db = await getDb();
  return db.collection("users").find({}, { projection: { passwordHash: 0 } }).sort({ name: 1 }).toArray();
}, { admin: true });

export const POST = handle(async ({ req }) => {
  const { password, ...user } = userSchema.parse(await req.json());
  const db = await getDb();
  await db.collection("users").insertOne({
    ...user, passwordHash: await bcrypt.hash(password, 10), active: true, createdAt: new Date(),
  });
}, { admin: true });
