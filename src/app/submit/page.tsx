"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { getCategoryLabel, localizePath } from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";
import type { AuthUser } from "@/lib/types";

export default function SubmitPage() {
  const router = useRouter();
  const { locale, messages } = useI18n();
  const ts = messages.submit;
  const ta = messages.auth;
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "City",
    location: "",
    sourceUrl: "",
    operator: "",
    contact: "",
    declaration: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loadAuth = () => {
      fetch("/api/v1/auth/me")
        .then((res) => (res.ok ? res.json() : { user: null }))
        .then((data: { user?: AuthUser | null }) => {
          if (cancelled) return;
          const u = data.user ?? null;
          setUser(u);
          if (u?.email) {
            setForm((prev) => (prev.contact ? prev : { ...prev, contact: u.email }));
          }
          setAuthLoading(false);
        })
        .catch(() => {
          if (!cancelled) setAuthLoading(false);
        });
    };
    loadAuth();
    window.addEventListener("camgl-auth-changed", loadAuth);
    return () => {
      cancelled = true;
      window.removeEventListener("camgl-auth-changed", loadAuth);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(localizePath("/login?next=/submit", locale));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        router.push(localizePath("/login?next=/submit", locale));
        return;
      }
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
        <div className="h-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{ta.loginTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{ts.subtitle}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href={localizePath("/login?next=/submit", locale)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {ta.loginBtn}
            </Link>
            <Link
              href={localizePath("/register?next=/submit", locale)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {ta.registerBtn}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 text-center space-y-3 shadow-sm">
        <div className="text-2xl">✅</div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">{ts.successTitle}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {ts.successBody}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">
            {ts.backHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          {ts.portalEyebrow}
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{ts.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {ts.subtitle}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 text-sm shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{ts.webcamTitle}</span>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Sunset Beach Resort Live Cam"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{ts.category}</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            >
              <option value="City">{getCategoryLabel(locale, "city", "City")}</option>
              <option value="Beach">{getCategoryLabel(locale, "beach", "Beach")}</option>
              <option value="Nature">{getCategoryLabel(locale, "nature", "Nature")}</option>
              <option value="Wildlife">{getCategoryLabel(locale, "wildlife", "Wildlife")}</option>
              <option value="Rail">{getCategoryLabel(locale, "rail", "Rail")}</option>
              <option value="Ski">{getCategoryLabel(locale, "ski", "Ski")}</option>
              <option value="Volcano">{getCategoryLabel(locale, "volcano", "Volcano")}</option>
              <option value="Port">{getCategoryLabel(locale, "port", "Port")}</option>
              <option value="Airport">{getCategoryLabel(locale, "airport", "Airport")}</option>
              <option value="Mountain">{getCategoryLabel(locale, "mountain", "Mountain")}</option>
              <option value="Landmark">{getCategoryLabel(locale, "landmark", "Landmark")}</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{ts.countryCity}</span>
            <input
              required
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Maldives · Male"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{ts.streamUrl}</span>
            <input
              required
              type="url"
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{ts.operator}</span>
            <input
              type="text"
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              placeholder="Organization or channel name"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">{ts.contactEmail}</span>
            <input
              required
              type="email"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="partner@example.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">{ts.description}</span>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={ts.descriptionPlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
        </label>

        <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
          <input
            required
            type="checkbox"
            checked={form.declaration}
            onChange={(e) => setForm({ ...form, declaration: e.target.checked })}
            className="mt-0.5 accent-blue-600"
          />
          <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {ts.declaration}
          </span>
        </label>

        <div className="pt-2 flex justify-end gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            {ts.cancel}
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? ts.submitting : ts.submitBtn}
          </button>
        </div>
      </form>
    </div>
  );
}
