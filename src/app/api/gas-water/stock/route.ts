import { handle } from "@/lib/api";
import { gwStockSchema } from "@/lib/schemas";
import { receiveStock } from "@/services/gasWater";

export const POST = handle(async ({ req, session }) => {
  await receiveStock(gwStockSchema.parse(await req.json()), session);
}, { admin: true });
