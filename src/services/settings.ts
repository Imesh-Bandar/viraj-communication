import { getDb } from "@/lib/db";

export type ShopSettings = {
  shopName: string; tagline?: string; address: string; phone: string; currency: string;
  receiptFooter: string; receiptWidth: "58" | "80"; autoPrint: boolean; logo?: string | null;
};

const DEFAULTS: ShopSettings = {
  shopName: "Viraj Communication", address: "", phone: "", currency: "Rs.",
  receiptFooter: "Thank you! Come again.", receiptWidth: "80", autoPrint: true, logo: null,
};

export async function getSettings(): Promise<ShopSettings> {
  const db = await getDb();
  const saved = await db.collection<{ _id: string }>("settings").findOne({ _id: "shop" });
  const { _id, ...rest } = saved ?? { _id: "" };
  return { ...DEFAULTS, ...rest };
}

export async function saveSettings(input: ShopSettings) {
  const db = await getDb();
  await db.collection<{ _id: string }>("settings").updateOne({ _id: "shop" }, { $set: input }, { upsert: true });
}
