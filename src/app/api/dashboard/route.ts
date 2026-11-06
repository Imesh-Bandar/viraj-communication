import { handle } from "@/lib/api";
import { today } from "@/lib/format";
import { dashboard } from "@/services/reports";

export const GET = handle(async ({ session }) => {
  const data = await dashboard(today());
  if (session.role !== "admin") data.totals.profit = 0;
  return data;
});
