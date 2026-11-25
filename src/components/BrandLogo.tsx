import { useId } from "react";

export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bgId = `lcg-bg-${uid}`;
  const lensId = `lcg-lens-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bgId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id={lensId} x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${bgId})`} />
      <rect
        x="4.75"
        y="4.75"
        width="54.5"
        height="54.5"
        rx="15.25"
        stroke="#FFFFFF"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="32" r="16" stroke={`url(#${lensId})`} strokeWidth="2.6" />
      <ellipse cx="32" cy="32" rx="7.5" ry="16" stroke="#FFFFFF" strokeOpacity="0.72" strokeWidth="2" />
      <path d="M16.5 32H47.5" stroke="#FFFFFF" strokeOpacity="0.72" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4.2" fill="#FFFFFF" />
      <circle cx="48" cy="16" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2.2" />
    </svg>
  );
}
