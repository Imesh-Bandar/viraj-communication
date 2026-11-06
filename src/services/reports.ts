import { getDb } from "@/lib/db";

const TZ = "Asia/Colombo";
const OFFSET = "+05:30";

export const dayStart = (date: string) => new Date(`${date}T00:00:00${OFFSET}`);
export const dayEnd = (date: string) => new Date(dayStart(date).getTime() + 86_400_000);

/** Sum of (line total - line cost) less the bill discount. */
const PROFIT = {
  $subtract: [
    { $sum: { $map: { input: "$lines", as: "l", in: { $subtract: ["$$l.total", { $multiply: ["$$l.cost", "$$l.qty"] }] } } } },
    "$discount",
  ],
};

async function salesTotals(from: Date, to: Date) {
  const db = await getDb();
  const [row] = await db.collection("sales").aggregate([
    { $match: { status: "completed", createdAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: "$total" }, bills: { $sum: 1 }, profit: { $sum: PROFIT }, credit: { $sum: "$credit" }, discount: { $sum: "$discount" } } },
  ]).toArray();
  return { total: row?.total ?? 0, bills: row?.bills ?? 0, profit: row?.profit ?? 0, credit: row?.credit ?? 0, discount: row?.discount ?? 0 };
}

async function outstanding() {
  const db = await getDb();
  const [row] = await db.collection("customers").aggregate([
    { $match: { balance: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: "$balance" }, customers: { $sum: 1 } } },
  ]).toArray();
  return { total: row?.total ?? 0, customers: row?.customers ?? 0 };
}

async function lowStockItems() {
  const db = await getDb();
  return db.collection("items")
    .find({ active: true, $expr: { $lte: ["$stock", "$reorderLevel"] } })
    .sort({ stock: 1 }).limit(50).toArray();
}

export async function dashboard(date: string) {
  const db = await getDb();
  const [totals, credit, lowStock, recent, gasWater] = await Promise.all([
    salesTotals(dayStart(date), dayEnd(date)),
    outstanding(),
    lowStockItems(),
    db.collection("sales").find().sort({ createdAt: -1 }).limit(6).toArray(),
    db.collection("gwProducts").find({ active: true }).sort({ type: 1, name: 1 }).toArray(),
  ]);
  return { totals, credit, lowStock: lowStock.slice(0, 6), recent, gasWater };
}

export async function report(fromDate: string, toDate: string) {
  const db = await getDb();
  const from = dayStart(fromDate);
  const to = dayEnd(toDate);
  const match = { $match: { status: "completed", createdAt: { $gte: from, $lt: to } } };
  const sales = db.collection("sales");

  const [totals, daily, methods, topItems, gasWater, stock, credit, lowStock, debtors] = await Promise.all([
    salesTotals(from, to),
    sales.aggregate([
      match,
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } }, total: { $sum: "$total" }, bills: { $sum: 1 }, profit: { $sum: PROFIT } } },
      { $sort: { _id: -1 } },
    ]).toArray(),
    sales.aggregate([match, { $group: { _id: "$method", total: { $sum: "$total" }, bills: { $sum: 1 } } }, { $sort: { total: -1 } }]).toArray(),
    sales.aggregate([
      match, { $unwind: "$lines" },
      { $group: { _id: "$lines.name", qty: { $sum: "$lines.qty" }, total: { $sum: "$lines.total" } } },
      { $sort: { total: -1 } }, { $limit: 10 },
    ]).toArray(),
    sales.aggregate([
      match, { $unwind: "$lines" }, { $match: { "lines.gwProductId": { $exists: true } } },
      { $group: { _id: "$lines.name", qty: { $sum: "$lines.qty" }, total: { $sum: "$lines.total" } } },
      { $sort: { total: -1 } },
    ]).toArray(),
    db.collection("items").aggregate([
      { $match: { active: true } },
      { $group: { _id: null, cost: { $sum: { $multiply: ["$stock", "$costPrice"] } }, retail: { $sum: { $multiply: ["$stock", "$sellPrice"] } } } },
    ]).toArray(),
    outstanding(),
    lowStockItems(),
    db.collection("customers").find({ balance: { $gt: 0 } }).sort({ balance: -1 }).limit(20).toArray(),
  ]);
  return { totals, daily, methods, topItems, gasWater, stock: stock[0] ?? { cost: 0, retail: 0 }, credit, lowStock, debtors };
}

/** One month in detail, plus the 12 months up to it. Days and months with no sales show as 0. */
export async function monthlyReport(month: string) {
  const db = await getDb();
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const keyOf = (offset: number) => new Date(Date.UTC(year, monthNumber - 1 + offset, 1)).toISOString().slice(0, 7);

  const data = await report(`${month}-01`, `${month}-${String(lastDay).padStart(2, "0")}`);
  const rows = await db.collection("sales").aggregate([
    { $match: { status: "completed", createdAt: { $gte: dayStart(`${keyOf(-11)}-01`), $lt: dayStart(`${keyOf(1)}-01`) } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: TZ } }, total: { $sum: "$total" }, bills: { $sum: 1 }, profit: { $sum: PROFIT } } },
  ]).toArray();

  const empty = { total: 0, bills: 0, profit: 0 };
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = keyOf(i - 11);
    const row = rows.find((r) => r._id === key);
    return { month: key, ...empty, ...(row && { total: row.total, bills: row.bills, profit: row.profit }) };
  });
  const days = Array.from({ length: lastDay }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    const row = data.daily.find((d) => d._id === date);
    return { date, ...empty, ...(row && { total: row.total, bills: row.bills, profit: row.profit }) };
  });

  return { totals: data.totals, topItems: data.topItems, days, months, previous: months[10] };
}
