"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  getMessages,
  LOCALE_COOKIE,
  normalizeLocale,
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

function readClientLocale(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  if (match) {
    return normalizeLocale(decodeURIComponent(match.split("=")[1] ?? ""));
  }
  try {
    const stored = localStorage.getItem(LOCALE_COOKIE);
    if (stored) return normalizeLocale(stored);
  } catch {
    // ignore storage errors
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = readClientLocale();
    setLocaleState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = next;
    router.refresh();
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
