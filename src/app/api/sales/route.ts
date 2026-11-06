import { handle } from "@/lib/api";
import { today } from "@/lib/format";
import { checkoutSchema } from "@/lib/schemas";
import { dayEnd, dayStart } from "@/services/reports";
import { createSale, listSales, priceLines } from "@/services/sales";

export const GET = handle(async ({ req }) => {
  const query = req.nextUrl.searchParams;
  return listSales(dayStart(query.get("from") || today()), dayEnd(query.get("to") || today()));
});

export const POST = handle(async ({ req, session }) => {
  const input = checkoutSchema.parse(await req.json());
  return createSale(await priceLines(input.lines), input, session);
});
