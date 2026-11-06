import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { createSession, Role } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const db = await getDb();
    const user = await db.collection("users").findOne({ username: String(username ?? "").trim().toLowerCase(), active: true });
    if (!user || !(await bcrypt.compare(String(password ?? ""), user.passwordHash))) {
      throw new AppError("Wrong username or password.", 401);
    }
    await createSession({ id: user._id.toString(), name: user.name, username: user.username, role: user.role as Role });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
