import { handle } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { saveUpload } from "@/services/uploads";

export const POST = handle(async ({ req, session }) => {
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) throw new AppError("Please choose an image.");
  return saveUpload(file, session.id);
}, { admin: true });
