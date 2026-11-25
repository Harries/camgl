"use client";

import { createContext, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  getMessages,
  LOCALE_COOKIE,
  localizePath,
  stripLocalePrefix,
  type Locale,
  type Messages,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  messages: Messages;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  messages: getMessages(DEFAULT_LOCALE),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const { locale } = stripLocalePrefix(pathname);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem(LOCALE_COOKIE, locale);
    } catch {
      // ignore storage errors
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const target = `${localizePath(pathname, next)}${search}`;
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = next;
    router.push(target);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        messages: getMessages(locale),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
