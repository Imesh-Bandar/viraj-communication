import { getDb, toId } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Session } from "@/lib/auth";
import { round2 } from "@/lib/format";

type CustomerInput = { name: string; phone: string; address: string; creditLimit: number };

export async function listCustomers() {
  const db = await getDb();
  return db.collection("customers").find().sort({ balance: -1, name: 1 }).toArray();
}

export async function saveCustomer(input: CustomerInput, id?: string) {
  const db = await getDb();
  if (id) {
    await db.collection("customers").updateOne({ _id: toId(id) }, { $set: input });
    return { id };
  }
  const { insertedId } = await db.collection("customers").insertOne({ ...input, balance: 0, createdAt: new Date() });
  return { id: insertedId.toString() };
}

export async function getLedger(id: string) {
  const db = await getDb();
  const customer = await db.collection("customers").findOne({ _id: toId(id) });
  if (!customer) throw new AppError("Customer not found.", 404);
  const entries = await db.collection("creditEntries").find({ customerId: id }).sort({ createdAt: -1 }).toArray();
  return { customer, entries };
}

/** Adds debt, refusing atomically if it would pass the customer's limit. */
export async function addDebt(customerId: string, amount: number) {
  const db = await getDb();
  const customers = db.collection("customers");
  const customer = await customers.findOne({ _id: toId(customerId) });
  if (!customer) throw new AppError("Customer not found.", 404);

  const filter = customer.creditLimit > 0
    ? { _id: customer._id, balance: { $lte: round2(customer.creditLimit - amount) } }
    : { _id: customer._id };
  const result = await customers.updateOne(filter, { $inc: { balance: amount } });
  if (!result.matchedCount) {
    throw new AppError(`Credit limit reached for ${customer.name}. Current balance is Rs. ${customer.balance}.`);
  }
  return customer;
}

export async function writeEntry(customerId: string, type: "credit" | "payment", amount: number, note: string, session: Session, sale?: { id: string; invoiceNo: string }) {
  const db = await getDb();
  await db.collection("creditEntries").insertOne({
    customerId, type, amount, note, saleId: sale?.id ?? null, invoiceNo: sale?.invoiceNo ?? null,
    userName: session.name, createdAt: new Date(),
  });
}

export async function recordLedger(id: string, type: "credit" | "payment", amount: number, note: string, session: Session) {
  const db = await getDb();
  if (type === "credit") {
    await addDebt(id, amount);
  } else {
    const result = await db.collection("customers").updateOne(
      { _id: toId(id), balance: { $gte: amount } },
      { $inc: { balance: -amount } },
    );
    if (!result.matchedCount) throw new AppError("Payment is more than the amount owed.");
  }
  await writeEntry(id, type, amount, note, session);
}
