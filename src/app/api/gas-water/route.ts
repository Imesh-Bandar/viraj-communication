import { handle } from "@/lib/api";
import { gwProductSchema } from "@/lib/schemas";
import { gasWaterOverview, saveProduct } from "@/services/gasWater";

export const GET = handle(() => gasWaterOverview());

export const POST = handle(async ({ req }) => {
  await saveProduct(gwProductSchema.parse(await req.json()));
}, { admin: true });
