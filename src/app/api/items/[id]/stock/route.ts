import { handle } from "@/lib/api";
import { stockSchema } from "@/lib/schemas";
import { adjustStock } from "@/services/items";

export const POST = handle(async ({ req, params, session }) => {
  const { change, note } = stockSchema.parse(await req.json());
  await adjustStock(params.id, change, note, session);
}, { admin: true });
