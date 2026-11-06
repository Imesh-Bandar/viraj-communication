import { readFile } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { readUpload, UPLOAD_DIR } from "@/services/uploads";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Serves uploads from the folder, or from the database when the folder has no copy. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const match = /^[a-f0-9]{24}\.(jpg|png|webp)$/.exec(name);
  if (!match) return new Response("Not found", { status: 404 });

  const file = await readFile(path.join(UPLOAD_DIR, name)).catch(() => readUpload(name));
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": TYPES[match[1]],
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
