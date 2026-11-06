import { handle } from "@/lib/api";
import { getDb, toId } from "@/lib/db";
import { AppError } from "@/lib/errors";

export const PATCH = handle(async ({ req, params, session }) => {
  if (params.id === session.id) throw new AppError("You cannot disable your own account.");
  const { active } = await req.json();
  const db = await getDb();
  await db.collection("users").updateOne({ _id: toId(params.id) }, { $set: { active: Boolean(active) } });
}, { admin: true });
