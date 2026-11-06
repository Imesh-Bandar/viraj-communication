import { getDb, toId } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Session } from "@/lib/auth";
import { round2 } from "@/lib/format";
import { createSale, Method } from "./sales";

type ProductInput = {
  type: "gas" | "water"; name: string; refillPrice: number; newPrice: number;
  refillCost: number; newCost: number; full?: number; empty?: number;
};

export async function gasWaterOverview() {
  const db = await getDb();
  const [products, history] = await Promise.all([
    db.collection("gwProducts").find({ active: true }).sort({ type: 1, name: 1 }).toArray(),
    db.collection("gwTransactions").find().sort({ createdAt: -1 }).limit(15).toArray(),
  ]);
  return { products, history };
}

export async function saveProduct(input: ProductInput, id?: string) {
  const db = await getDb();
  const { full = 0, empty = 0, ...rest } = input;
  if (id) {
    await db.collection("gwProducts").updateOne({ _id: toId(id) }, { $set: rest });
    return;
  }
  await db.collection("gwProducts").insertOne({ ...rest, full, empty, active: true });
}

export async function sellGasWater(
  input: { productId: string; action: "refill" | "sell_new"; qty: number; method: Method; tendered: number; customerId?: string | null },
  session: Session,
) {
  const db = await getDb();
  const product = await db.collection("gwProducts").findOne({ _id: toId(input.productId), active: true });
  if (!product) throw new AppError("Product not found.", 404);

  const isRefill = input.action === "refill";
  const price = isRefill ? product.refillPrice : product.newPrice;
  const line = {
    gwProductId: input.productId, gwAction: input.action,
    name: `${product.name} (${isRefill ? "Refill" : "New"})`,
    qty: input.qty, price, cost: isRefill ? product.refillCost : product.newCost,
    total: round2(price * input.qty),
  };
  const sale = await createSale([line], { ...input, discount: 0 }, session);
  await logTransaction(product.name, input.action, input.qty, line.total, sale.invoiceNo, session);
  return sale;
}

export async function receiveStock(
  input: { productId: string; action: "supplier_refill" | "buy_new"; qty: number; note: string },
  session: Session,
) {
  const db = await getDb();
  const _id = toId(input.productId);
  const isRefill = input.action === "supplier_refill";
  const result = await db.collection("gwProducts").updateOne(
    isRefill ? { _id, empty: { $gte: input.qty } } : { _id },
    { $inc: { full: input.qty, empty: isRefill ? -input.qty : 0 } },
  );
  if (!result.matchedCount) throw new AppError("There are not that many empties in stock.");
  const product = await db.collection("gwProducts").findOne({ _id });
  await logTransaction(product!.name, input.action, input.qty, 0, input.note, session);
}

async function logTransaction(product: string, action: string, qty: number, amount: number, note: string, session: Session) {
  const db = await getDb();
  await db.collection("gwTransactions").insertOne({
    product, action, qty, amount, note, userName: session.name, createdAt: new Date(),
  });
}
