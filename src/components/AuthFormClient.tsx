"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Github, Lock, Mail, User } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

export function AuthFormClient({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();
  const ta = messages.auth;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextUrl = searchParams.get("next");
  const oauthError = searchParams.get("error");
  const safeNext = nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
    ? nextUrl
    : localizePath("/profile", locale);

  const displayedError =
    error ||
    (oauthError === "github_not_configured"
      ? ta.githubNotConfigured
      : oauthError === "github_failed"
        ? ta.githubFailed
        : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload = mode === "login" ? { email, password } : { name, email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || ta.authError);
        setLoading(false);
        return;
      }
      window.dispatchEvent(new Event("camgl-auth-changed"));
      router.push(safeNext);
      router.refresh();
    } catch {
      setError(ta.authError);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === "login" ? ta.loginTitle : ta.registerTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {mode === "login" ? ta.loginSubtitle : ta.registerSubtitle}
          </p>
        </div>

        {displayedError && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/50 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
            {displayedError}
          </div>
        )}

        <a
          href={`/api/v1/auth/github?next=${encodeURIComponent(safeNext)}`}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
        >
          <Github className="w-4 h-4" />
          <span>{ta.continueWithGithub}</span>
        </a>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="px-3 text-[11px] uppercase tracking-wider text-slate-400 bg-white dark:bg-slate-900">
            {ta.orWithEmail}
          </span>
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ta.nameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ta.namePlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {ta.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {ta.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {loading
              ? ta.submitting
              : mode === "login"
                ? ta.loginBtn
                : ta.registerBtn}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          {mode === "login" ? (
            <>
              {ta.noAccount}{" "}
              <Link
                href={localizePath(
                  nextUrl ? `/register?next=${encodeURIComponent(nextUrl)}` : "/register",
                  locale
                )}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {ta.goRegister}
              </Link>
            </>
          ) : (
            <>
              {ta.hasAccount}{" "}
              <Link
                href={localizePath(
                  nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login",
                  locale
                )}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {ta.goLogin}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
