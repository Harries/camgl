"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, KeyRound, Lock, Mail, User } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { localizePath } from "@/lib/i18n";

export function AuthFormClient({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, messages } = useI18n();
  const ta = messages.auth;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError(ta.emailRequiredForCode);
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch("/api/v1/auth/send-register-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || ta.authError);
      } else {
        setCodeSent(true);
        setCountdown(60);
      }
    } catch {
      setError(ta.authError);
    } finally {
      setSendingCode(false);
    }
  };

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
        : oauthError === "google_not_configured"
          ? ta.googleNotConfigured
          : oauthError === "google_failed"
            ? ta.googleFailed
            : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload = mode === "login" ? { email, password } : { name, email, password, code };
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

        <div className="space-y-2.5">
          <a
            href={`/api/v1/auth/google?next=${encodeURIComponent(safeNext)}`}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>{ta.continueWithGoogle}</span>
          </a>

          <a
            href={`/api/v1/auth/github?next=${encodeURIComponent(safeNext)}`}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Github className="w-4 h-4" />
            <span>{ta.continueWithGithub}</span>
          </a>
        </div>

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
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
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
              {mode === "register" && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0}
                  className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {countdown > 0 ? `${countdown}s` : ta.sendCodeBtn}
                </button>
              )}
            </div>
            {mode === "register" && codeSent && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                {ta.codeSentHint}
              </p>
            )}
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ta.codeLabel}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={ta.codePlaceholder}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {ta.passwordLabel}
              </label>
              {mode === "login" && (
                <Link
                  href={localizePath("/forgot-password", locale)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {ta.forgotPasswordLink}
                </Link>
              )}
            </div>
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
