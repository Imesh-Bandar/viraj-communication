import { handle } from "@/lib/api";
import { today } from "@/lib/format";
import { report } from "@/services/reports";

export const GET = handle(async ({ req }) => {
  const query = req.nextUrl.searchParams;
  return report(query.get("from") || today(), query.get("to") || today());
}, { admin: true });
