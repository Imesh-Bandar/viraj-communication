import { ObjectId } from "mongodb";
import { getDb, toId } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Session } from "@/lib/auth";
import { round2 } from "@/lib/format";
import { addDebt, writeEntry } from "./customers";
import { logMovement } from "./items";

export type Method = "cash" | "card" | "credit";

export type SaleLine = {
  itemId?: string; gwProductId?: string; gwAction?: "refill" | "sell_new";
  name: string; code?: string | null; qty: number; price: number; cost: number; total: number;
};

type CheckoutInput = {
  lines: { itemId?: string; name?: string; price?: number; qty: number }[];
  discount: number; method: Method; tendered: number; customerId?: string | null;
};

/** Stock change a gas/water sale makes per unit. */
export const gwEffect = (action: "refill" | "sell_new") =>
  action === "refill" ? { full: -1, empty: 1 } : { full: -1, empty: 0 };

/** Turns what the till sent into priced lines. Shop items always use the database price. */
export async function priceLines(lines: CheckoutInput["lines"]): Promise<SaleLine[]> {
  const db = await getDb();
  return Promise.all(lines.map(async (line) => {
    if (line.itemId) {
      const item = await db.collection("items").findOne({ _id: toId(line.itemId), active: true });
      if (!item) throw new AppError("An item on this bill no longer exists.");
      return {
        itemId: line.itemId, name: item.name, code: item.barcode, qty: line.qty, price: item.sellPrice,
        cost: item.costPrice, total: round2(item.sellPrice * line.qty),
      };
    }
    if (!line.name || line.price === undefined) throw new AppError("A custom item needs a name and price.");
    return { name: line.name, qty: line.qty, price: line.price, cost: 0, total: round2(line.price * line.qty) };
  }));
}

/**
 * Creates a bill. A standalone MongoDB has no multi-document transactions, so every
 * stock/credit change is a guarded atomic update, and each registers an undo that
 * runs if a later step fails.
 */
export async function createSale(
  lines: SaleLine[],
  opts: { discount: number; method: Method; tendered: number; customerId?: string | null },
  session: Session,
) {
  const db = await getDb();
  const subtotal = round2(lines.reduce((sum, line) => sum + line.total, 0));
  const discount = round2(opts.discount);
  if (discount > subtotal) throw new AppError("Discount cannot be more than the bill.");
  const total = round2(subtotal - discount);
  const tendered = round2(opts.tendered);

  if (opts.method !== "credit" && tendered < total) {
    throw new AppError("Amount paid is less than the bill total. Use Nayapotha for the balance.");
  }
  if (opts.method === "credit" && !opts.customerId) {
    throw new AppError("Choose a customer for a Nayapotha bill.");
  }
  const paid = Math.min(tendered, total);
  const credit = opts.method === "credit" ? round2(total - paid) : 0;

  const undo: (() => Promise<unknown>)[] = [];
  try {
    for (const line of lines) {
      if (line.itemId) {
        const filter = { _id: toId(line.itemId), stock: { $gte: line.qty } };
        const result = await db.collection("items").updateOne(filter, { $inc: { stock: -line.qty } });
        if (!result.matchedCount) throw new AppError(`Not enough stock for ${line.name}.`);
        undo.push(() => db.collection("items").updateOne({ _id: filter._id }, { $inc: { stock: line.qty } }));
      } else if (line.gwProductId && line.gwAction) {
        const effect = gwEffect(line.gwAction);
        const _id = toId(line.gwProductId);
        const change = { full: effect.full * line.qty, empty: effect.empty * line.qty };
        const result = await db.collection("gwProducts").updateOne(
          { _id, full: { $gte: line.qty } }, { $inc: change },
        );
        if (!result.matchedCount) throw new AppError(`Not enough full stock for ${line.name}.`);
        undo.push(() => db.collection("gwProducts").updateOne(
          { _id }, { $inc: { full: -change.full, empty: -change.empty } },
        ));
      }
    }

    let customerName: string | null = null;
    if (opts.customerId) {
      const customers = db.collection("customers");
      if (credit > 0) {
        const customer = await addDebt(opts.customerId, credit);
        customerName = customer.name;
        undo.push(() => customers.updateOne({ _id: customer._id }, { $inc: { balance: -credit } }));
      } else {
        customerName = (await customers.findOne({ _id: toId(opts.customerId) }))?.name ?? null;
      }
    }

    const counter = await db.collection<{ _id: string; seq: number }>("counters").findOneAndUpdate(
      { _id: "invoice" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" },
    );
    const invoiceNo = `INV-${String(counter!.seq).padStart(6, "0")}`;

    const saleId = new ObjectId();
    await db.collection("sales").insertOne({
      _id: saleId, invoiceNo, lines, subtotal, discount, total, paid, tendered,
      change: opts.method === "credit" ? 0 : round2(tendered - total), credit,
      method: opts.method, customerId: opts.customerId ?? null, customerName,
      userId: session.id, userName: session.name, status: "completed", createdAt: new Date(),
    });

    const id = saleId.toString();
    for (const line of lines) {
      if (line.itemId) await logMovement(line.itemId, -line.qty, "sale", invoiceNo, session, id);
    }
    if (credit > 0) await writeEntry(opts.customerId!, "credit", credit, "Bill", session, { id, invoiceNo });
    return { id, invoiceNo };
  } catch (error) {
    for (const step of undo.reverse()) await step();
    throw error;
  }
}

export async function getSale(id: string) {
  const db = await getDb();
  const sale = await db.collection("sales").findOne({ _id: toId(id) });
  if (!sale) throw new AppError("Bill not found.", 404);
  return sale;
}

export async function listSales(from: Date, to: Date) {
  const db = await getDb();
  return db.collection("sales").find({ createdAt: { $gte: from, $lt: to } }).sort({ createdAt: -1 }).limit(500).toArray();
}

/** Cancels a bill: puts stock back and removes its debt. Safe against double clicks. */
export async function voidSale(id: string, session: Session) {
  const db = await getDb();
  const sale = await db.collection("sales").findOneAndUpdate(
    { _id: toId(id), status: "completed" },
    { $set: { status: "void", voidedBy: session.name, voidedAt: new Date() } },
  );
  if (!sale) throw new AppError("This bill is already cancelled.");

  for (const line of sale.lines as SaleLine[]) {
    if (line.itemId) {
      await db.collection("items").updateOne({ _id: toId(line.itemId) }, { $inc: { stock: line.qty } });
      await logMovement(line.itemId, line.qty, "void", sale.invoiceNo, session, id);
    } else if (line.gwProductId && line.gwAction) {
      const effect = gwEffect(line.gwAction);
      await db.collection("gwProducts").updateOne(
        { _id: toId(line.gwProductId) },
        { $inc: { full: -effect.full * line.qty, empty: -effect.empty * line.qty } },
      );
    }
  }
  if (sale.credit > 0) {
    await db.collection("customers").updateOne({ _id: toId(sale.customerId) }, { $inc: { balance: -sale.credit } });
    await writeEntry(sale.customerId, "payment", sale.credit, "Bill cancelled", session, { id, invoiceNo: sale.invoiceNo });
  }
}
