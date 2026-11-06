import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, Session } from "./auth";
import { AppError } from "./errors";

type Context = { req: NextRequest; session: Session; params: Record<string, string> };
type RouteContext = { params: Promise<Record<string, string>> };

/** Wraps a route: checks login/role and turns errors into friendly JSON messages. */
export function handle(fn: (ctx: Context) => Promise<unknown>, options: { admin?: boolean } = {}) {
  return async (req: NextRequest, route: RouteContext) => {
    try {
      const session = await getSession();
      if (!session) throw new AppError("Please log in again.", 401);
      if (options.admin && session.role !== "admin") {
        throw new AppError("Only an admin can do this.", 403);
      }
      const result = await fn({ req, session, params: (await route?.params) ?? {} });
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0].message }, { status: 422 });
  }
  if ((error as { code?: number })?.code === 11000) {
    return NextResponse.json({ error: "That value is already in use." }, { status: 409 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
