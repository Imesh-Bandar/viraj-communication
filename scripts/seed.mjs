// Prepares the database. Safe to run again: existing data is never overwritten.
//   npm run seed           admin user + indexes
//   npm run seed -- --demo also adds sample items, gas/water and a customer
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No local file: settings come from the environment.
}

const client = await new MongoClient(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017").connect();
const db = client.db(process.env.MONGODB_DB ?? "viraj_pos");

await db.collection("users").createIndex({ username: 1 }, { unique: true });
await db.collection("items").createIndex(
  { barcode: 1 },
  { unique: true, partialFilterExpression: { barcode: { $type: "string" } } },
);
await db.collection("items").createIndex({ active: 1, name: 1 });
await db.collection("sales").createIndex({ createdAt: -1 });
await db.collection("sales").createIndex({ invoiceNo: 1 }, { unique: true });
await db.collection("creditEntries").createIndex({ customerId: 1, createdAt: -1 });

// Set ADMIN_PASSWORD for any site reachable from the internet.
const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";

if (!(await db.collection("users").countDocuments())) {
  await db.collection("users").insertOne({
    name: "Administrator", username: "admin", role: "admin", active: true,
    passwordHash: await bcrypt.hash(adminPassword, 10), createdAt: new Date(),
  });
  console.log("Created the admin user. Change the password in Settings.");
}

if (process.argv.includes("--demo") && !(await db.collection("items").countDocuments())) {
  const item = (category, name, barcode, costPrice, sellPrice, stock) => ({
    category, name, barcode, costPrice, sellPrice, stock, reorderLevel: 5, image: null, active: true, createdAt: new Date(),
  });
  await db.collection("items").insertMany([
    item("Phone Accessories", "USB-C Charging Cable", "1001", 250, 450, 30),
    item("Phone Accessories", "Fast Charger 20W", "1002", 900, 1500, 12),
    item("Phone Accessories", "Earphones", "1003", 300, 600, 3),
    item("Phone Accessories", "Tempered Glass", "1004", 80, 300, 50),
    item("Reload Cards", "Reload Card Rs.100", "2001", 96, 100, 40),
    item("Reload Cards", "Reload Card Rs.500", "2002", 480, 500, 20),
    item("Stationery", "CR Book 80 Pages", "3001", 120, 180, 25),
    item("Stationery", "Blue Pen", "3002", 15, 25, 100),
    item("Grocery", "Biscuit Pack", "4001", 110, 150, 18),
    item("Grocery", "Soft Drink 400ml", "4002", 130, 180, 2),
  ]);
  await db.collection("gwProducts").insertMany([
    { type: "gas", name: "Gas 12.5 kg", refillPrice: 3900, newPrice: 9500, refillCost: 3650, newCost: 8500, full: 10, empty: 4, active: true },
    { type: "gas", name: "Gas 5 kg", refillPrice: 1600, newPrice: 5200, refillCost: 1480, newCost: 4600, full: 6, empty: 2, active: true },
    { type: "water", name: "Water Bottle 19 L", refillPrice: 350, newPrice: 1800, refillCost: 220, newCost: 1400, full: 15, empty: 8, active: true },
  ]);
  await db.collection("customers").insertOne({
    name: "Sample Customer", phone: "0770000000", address: "", creditLimit: 10000, balance: 0, createdAt: new Date(),
  });
  console.log("Added demo data.");
}

await client.close();
console.log("Database ready.");
