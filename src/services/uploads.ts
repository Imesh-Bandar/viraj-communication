import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Binary } from "mongodb";
import { getDb } from "@/lib/db";
import { AppError } from "@/lib/errors";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_BYTES = 3 * 1024 * 1024;

/** Detect the type from the file's real bytes, never its name. */
function detectType(b: Buffer): { ext: string; mime: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.subarray(0, 4).toString("hex") === "89504e47") return { ext: "png", mime: "image/png" };
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

/**
 * Saves the image in the "uploads" collection and, where the disk is writable,
 * in the /uploads folder too. Hosts such as Vercel have no lasting disk, so the
 * database copy is what the site serves there.
 */
export async function saveUpload(file: File, userId: string) {
  if (file.size > MAX_BYTES) throw new AppError("The image is too large. The limit is 3 MB.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectType(buffer);
  if (!type) throw new AppError("Please choose a JPG, PNG or WEBP image.");

  const fileName = `${randomBytes(12).toString("hex")}.${type.ext}`;
  const url = `/uploads/${fileName}`;
  const db = await getDb();
  await db.collection("uploads").insertOne({
    fileName, url, originalName: file.name, mime: type.mime, size: file.size,
    data: new Binary(buffer), userId, createdAt: new Date(),
  });

  if (!process.env.VERCEL) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, fileName), buffer);
  }
  return { url };
}

export async function readUpload(fileName: string): Promise<Uint8Array | null> {
  const db = await getDb();
  const upload = await db.collection("uploads").findOne({ fileName });
  return upload?.data ? (upload.data as Binary).buffer : null;
}
