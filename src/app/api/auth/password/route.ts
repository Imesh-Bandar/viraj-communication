import bcrypt from "bcryptjs";
import { handle } from "@/lib/api";
import { getDb, toId } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { passwordSchema } from "@/lib/schemas";

export const POST = handle(async ({ req, session }) => {
  const { current, next } = passwordSchema.parse(await req.json());
  const users = (await getDb()).collection("users");
  const user = await users.findOne({ _id: toId(session.id) });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    throw new AppError("Current password is wrong.");
  }
  await users.updateOne({ _id: user._id }, { $set: { passwordHash: await bcrypt.hash(next, 10) } });
});
