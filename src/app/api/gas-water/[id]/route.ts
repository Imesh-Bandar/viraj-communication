import { handle } from "@/lib/api";
import { gwProductSchema } from "@/lib/schemas";
import { saveProduct } from "@/services/gasWater";

export const PUT = handle(async ({ req, params }) => {
  await saveProduct(gwProductSchema.parse(await req.json()), params.id);
}, { admin: true });
