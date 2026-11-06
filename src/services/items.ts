import { getDb, toId } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Session } from "@/lib/auth";

type ItemInput = {
  name: string; barcode: string; category: string; costPrice: number; sellPrice: number;
  reorderLevel: number; stock?: number; image?: string | null;
};

export async function listItems() {
  const db = await getDb();
  return db.collection("items").find({ active: true }).sort({ name: 1 }).toArray();
}

export async function itemDetails(id: string) {
  const db = await getDb();
  const item = await db.collection("items").findOne({ _id: toId(id) });
  if (!item) throw new AppError("Item not found.", 404);
  const movements = await db.collection("stockMovements").find({ itemId: id }).sort({ createdAt: -1 }).limit(10).toArray();
  return { item, movements };
}

export async function createItem(input: ItemInput, session: Session) {
  const db = await getDb();
  const { stock = 0, ...rest } = input;
  const { insertedId } = await db.collection("items").insertOne({
    ...rest, barcode: rest.barcode || null, image: rest.image ?? null, stock, active: true, createdAt: new Date(),
  });
  if (stock > 0) await logMovement(insertedId.toString(), stock, "opening", "", session);
}

export async function updateItem(id: string, input: ItemInput) {
  const db = await getDb();
  const { stock: _ignored, ...rest } = input; // stock only changes through adjustments
  const result = await db.collection("items").updateOne(
    { _id: toId(id), active: true },
    { $set: { ...rest, barcode: rest.barcode || null, image: rest.image ?? null } },
  );
  if (!result.matchedCount) throw new AppError("Item not found.", 404);
}

/** Items stay in old bills, so delete only hides them. */
export async function archiveItem(id: string) {
  const db = await getDb();
  await db.collection("items").updateOne({ _id: toId(id) }, { $set: { active: false, barcode: null } });
}

export async function adjustStock(id: string, change: number, note: string, session: Session) {
  const db = await getDb();
  const result = await db.collection("items").updateOne(
    { _id: toId(id), active: true, stock: { $gte: Math.max(0, -change) } },
    { $inc: { stock: change } },
  );
  if (!result.matchedCount) throw new AppError("Stock cannot go below zero.");
  await logMovement(id, change, "adjustment", note, session);
}

export async function logMovement(itemId: string, change: number, reason: string, note: string, session: Session, saleId?: string) {
  const db = await getDb();
  await db.collection("stockMovements").insertOne({
    itemId, change, reason, note, saleId: saleId ?? null, userName: session.name, createdAt: new Date(),
  });
}
