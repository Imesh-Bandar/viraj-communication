import { execSync } from "child_process";
import { MongoClient } from "mongodb";

/** Starts every run from the same clean demo shop. */
export default async function globalSetup() {
  const uri = process.env.E2E_MONGODB_URI ?? "mongodb://127.0.0.1:27017";
  const client = await new MongoClient(uri).connect();
  await client.db("viraj_pos_e2e").dropDatabase();
  await client.close();
  execSync("node scripts/seed.mjs --demo", {
    stdio: "inherit",
    env: { ...process.env, MONGODB_URI: uri, MONGODB_DB: "viraj_pos_e2e", ADMIN_PASSWORD: "admin123" },
  });
}
