import { handle } from "@/lib/api";
import { itemSchema } from "@/lib/schemas";
import { archiveItem, itemDetails, updateItem } from "@/services/items";

export const GET = handle(async ({ params, session }) => {
  const { item, movements } = await itemDetails(params.id);
  if (session.role === "admin") return { item, movements };
  const { costPrice: _hidden, ...publicItem } = item;
  return { item: publicItem, movements };
});

export const PUT = handle(async ({ req, params }) => {
  await updateItem(params.id, itemSchema.parse(await req.json()));
}, { admin: true });

export const DELETE = handle(async ({ params }) => {
  await archiveItem(params.id);
}, { admin: true });
