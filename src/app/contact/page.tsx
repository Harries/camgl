import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ShieldCheck, Video, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | LiveCam Global",
  description:
    "Contact LiveCam Global for webcam partnerships, stream removal or privacy requests, and technical support.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-2 shadow-sm">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          Support &amp; Partnerships
        </span>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Contact LiveCam Global
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Reach out to our team for operator partnerships, stream attribution updates, privacy inquiries, or broken feed reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Partners &amp; Camera Operators
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Want to list your hotel, resort, city, or scenic live stream? Submit it directly or email our partnerships team.
          </p>
          <div className="pt-1 flex flex-col gap-2 text-xs">
            <a
              href="mailto:partners@camgl.com"
              className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              partners@camgl.com
            </a>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 w-fit"
            >
              Submit a Webcam
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Privacy &amp; Removal Requests
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Need to update stream attribution, report a privacy concern, or request immediate removal of a listed camera?
          </p>
          <div className="pt-1 flex flex-col gap-2 text-xs">
            <a
              href="mailto:privacy@camgl.com"
              className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              privacy@camgl.com
            </a>
            <Link
              href="/privacy"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
            >
              View Privacy Policy →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Technical &amp; General Support
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Spotted an offline feed, wrong location tag, or playback issue? Use the Report button on any webcam page or write to us.
          </p>
          <div className="pt-1 flex flex-col gap-2 text-xs">
            <a
              href="mailto:hello@camgl.com"
              className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              hello@camgl.com
            </a>
            <Link
              href="/countries"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:underline"
            >
              Browse Live Webcams →
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-3 shadow-sm text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          What to Include in Your Message
        </h2>
        <p>
          To help us respond quickly (typically within 1–2 business days), please include the webcam page URL (for example, <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">https://camgl.com/webcams/...</code>), your organization or channel name, and any relevant ownership or technical details.
        </p>
      </div>
    </div>
  );
}
