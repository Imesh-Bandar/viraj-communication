import { handle } from "@/lib/api";
import { gwSellSchema } from "@/lib/schemas";
import { sellGasWater } from "@/services/gasWater";

export const POST = handle(async ({ req, session }) => sellGasWater(gwSellSchema.parse(await req.json()), session));
