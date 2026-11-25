"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubmitPage() {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 text-center space-y-3 shadow-sm">
        <div className="text-2xl">✅</div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Submission Received</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your webcam has been placed in the Admin Review Queue for licensing and privacy verification.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          Partner &amp; Operator Portal
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submit a Live Webcam</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Hotels, resorts, tourism boards, and camera operators can submit public scenic live streams for free listing. Submissions are reviewed before publishing.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-4 text-sm shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">Webcam Title *</span>
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
            <span className="font-medium text-slate-700 dark:text-slate-300">Category *</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            >
              <option>City</option>
              <option>Beach</option>
              <option>Nature</option>
              <option>Wildlife</option>
              <option>Rail</option>
              <option>Ski</option>
              <option>Volcano</option>
              <option>Port</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">Country &amp; City *</span>
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
            <span className="font-medium text-slate-700 dark:text-slate-300">Official Stream / Embed URL *</span>
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
            <span className="font-medium text-slate-700 dark:text-slate-300">Operator / Hotel Name</span>
            <input
              type="text"
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
              placeholder="Organization or channel name"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">Contact Email *</span>
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
          <span className="font-medium text-slate-700 dark:text-slate-300">Description *</span>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what this webcam shows, visible landmarks, viewing angle, or best time to watch..."
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
            I confirm this camera is a public scenic view (no private surveillance or sensitive areas) and I have authority to permit public embedding.
          </span>
        </label>

        <div className="pt-2 flex justify-end gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
