"use client";

import { useState } from "react";

export function WebcamThumbnail({
  src,
  alt,
  flag,
  subtitle,
  isDaylight = true,
  className = "",
}: {
  src: string | null;
  alt: string;
  flag: string;
  subtitle?: string;
  isDaylight?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${
        isDaylight
          ? "bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900"
          : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800"
      } ${className}`}
    >
      <div className="text-center px-4 text-white/90">
        <div className="text-2xl mb-1">{flag}</div>
        {subtitle && <div className="text-xs font-medium opacity-80">{subtitle}</div>}
      </div>
    </div>
  );
}
