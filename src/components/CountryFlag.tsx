const REGIONAL_INDICATOR_START = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

/**
 * Convert a two-character regional indicator flag emoji (e.g. "🇺🇸") to lowercase ISO 3166-1 alpha-2 ("us").
 */
export function emojiToIsoCode(flag?: string | null): string | null {
  if (!flag) return null;
  const codePoints = Array.from(flag.trim()).map((ch) => ch.codePointAt(0) ?? 0);
  if (
    codePoints.length === 2 &&
    codePoints.every((cp) => cp >= REGIONAL_INDICATOR_START && cp <= REGIONAL_INDICATOR_END)
  ) {
    return String.fromCharCode(
      codePoints[0] - REGIONAL_INDICATOR_START + 97,
      codePoints[1] - REGIONAL_INDICATOR_START + 97
    );
  }
  return null;
}

export function CountryFlag({
  isoCode,
  flag,
  className = "",
}: {
  isoCode?: string | null;
  flag?: string | null;
  className?: string;
}) {
  const normalizedIso =
    isoCode && /^[a-zA-Z]{2}$/.test(isoCode.trim()) ? isoCode.trim().toLowerCase() : null;
  const code = emojiToIsoCode(flag) ?? normalizedIso;

  if (code) {
    return (
      <span
        className={`fi fi-${code} inline-block shrink-0 rounded-[2px] ${className}`.trim()}
        aria-hidden="true"
      />
    );
  }

  return (
    <span className={`inline-block shrink-0 ${className}`.trim()} aria-hidden="true">
      {flag || "🌍"}
    </span>
  );
}
