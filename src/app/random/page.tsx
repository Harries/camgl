import { redirect } from "next/navigation";
import { getRandomWebcam } from "@/lib/repository";
import { getServerLocale } from "@/lib/i18n-server";
import { localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RandomPage() {
  const [cam, locale] = await Promise.all([getRandomWebcam(), getServerLocale()]);
  if (!cam) redirect(localizePath("/", locale));
  redirect(localizePath(`/webcams/${cam.slug}`, locale));
}
