import { handle } from "@/lib/api";
import { itemSchema } from "@/lib/schemas";
import { createItem, listItems } from "@/services/items";

export const GET = handle(async ({ session }) => {
  const items = await listItems();
  // Cost prices are for admins only.
  return session.role === "admin" ? items : items.map(({ costPrice: _hidden, ...item }) => item);
});

export const POST = handle(async ({ req, session }) => {
  await createItem(itemSchema.parse(await req.json()), session);
}, { admin: true });
