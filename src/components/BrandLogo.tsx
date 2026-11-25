import { useId } from "react";

export function BrandLogo({ className = "w-9 h-9" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bodyId = `lcg-body-${uid}`;
  const glassId = `lcg-glass-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyId} x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="55%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={glassId} x1="22" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${bodyId})`} />
      <rect
        x="4.75"
        y="4.75"
        width="54.5"
        height="54.5"
        rx="15.25"
        stroke="#38BDF8"
        strokeOpacity="0.3"
        strokeWidth="1.5"
      />
      <path d="M15 22V17C15 15.8954 15.8954 15 17 15H22" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15 42V47C15 48.1046 15.8954 49 17 49H22" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M42 49H47C48.1046 49 49 48.1046 49 47V42" stroke="#E0F2FE" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="12.5" stroke="#FFFFFF" strokeWidth="2.6" />
      <circle cx="32" cy="32" r="8.2" fill={`url(#${glassId})`} />
      <circle cx="32" cy="32" r="3.4" fill="#0F172A" />
      <circle cx="29" cy="28.5" r="2.1" fill="#FFFFFF" fillOpacity="0.85" />
      <circle cx="47.5" cy="16.5" r="7.5" fill="#EF4444" fillOpacity="0.28" />
      <circle cx="47.5" cy="16.5" r="4.8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.8" />
    </svg>
  );
}
