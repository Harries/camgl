import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, type Locale } from "./i18n";

export async function getServerLocale(): Promise<Locale> {
  try {
    const hdrs = await headers();
    const fromHeader = hdrs.get("x-camgl-lang");
    if (fromHeader) {
      return normalizeLocale(fromHeader);
    }
    const store = await cookies();
    return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}
