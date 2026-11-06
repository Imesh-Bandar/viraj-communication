import { handle } from "@/lib/api";
import { voidSale } from "@/services/sales";

export const POST = handle(async ({ params, session }) => {
  await voidSale(params.id, session);
}, { admin: true });
