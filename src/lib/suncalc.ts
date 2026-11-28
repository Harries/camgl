import SunCalc from "suncalc";

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function toSafeIsoString(date: Date): string | null {
  return isValidDate(date) ? date.toISOString() : null;
}

function formatLocalClock(date: Date, timezone: string): string {
  if (!isValidDate(date)) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString().slice(11, 16) + " UTC";
  }
}

export function getDaylightInfo(lat: number, lng: number, timezone: string) {
  const now = new Date();
  const times = SunCalc.getTimes(now, lat, lng);
  // High-latitude locations (e.g. northern Norway) produce Invalid Date for sunrise/sunset during polar night or midnight sun.
  const isDaylight =
    isValidDate(times.sunrise) && isValidDate(times.sunset)
      ? now >= times.sunrise && now <= times.sunset
      : SunCalc.getPosition(now, lat, lng).altitude > 0;

  let localTime = "";
  try {
    localTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(now);
  } catch {
    localTime = now.toISOString().slice(11, 16) + " UTC";
  }

  return {
    isDaylight,
    localTime,
    sunrise: toSafeIsoString(times.sunrise),
    sunset: toSafeIsoString(times.sunset),
    sunriseLocal: formatLocalClock(times.sunrise, timezone),
    sunsetLocal: formatLocalClock(times.sunset, timezone),
    goldenHourLocal: formatLocalClock(times.goldenHour, timezone),
  };
}
