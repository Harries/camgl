import { redirect } from "next/navigation";
import { getRandomWebcam } from "@/lib/repository";
import { getServerLocale } from "@/lib/i18n-server";
import { localizePath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function RandomPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; category?: string; exclude?: string }>;
}) {
  const sp = await searchParams;
  const [cam, locale] = await Promise.all([
    getRandomWebcam({
      country: sp.country?.trim() || undefined,
      category: sp.category?.trim() || undefined,
      excludeSlug: sp.exclude?.trim() || undefined,
    }),
    getServerLocale(),
  ]);
  if (!cam) redirect(localizePath("/", locale));
  redirect(localizePath(`/webcams/${cam.slug}`, locale));
}
