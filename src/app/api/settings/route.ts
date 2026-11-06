import { handle } from "@/lib/api";
import { settingsSchema } from "@/lib/schemas";
import { getSettings, saveSettings } from "@/services/settings";

export const GET = handle(() => getSettings());

export const PUT = handle(async ({ req }) => {
  await saveSettings(settingsSchema.parse(await req.json()));
}, { admin: true });
