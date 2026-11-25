import SunCalc from "suncalc";

function formatLocalClock(date: Date, timezone: string): string {
  if (Number.isNaN(date.getTime())) return "—";
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
  const isDaylight = now >= times.sunrise && now <= times.sunset;

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
    sunrise: times.sunrise.toISOString(),
    sunset: times.sunset.toISOString(),
    sunriseLocal: formatLocalClock(times.sunrise, timezone),
    sunsetLocal: formatLocalClock(times.sunset, timezone),
    goldenHourLocal: formatLocalClock(times.goldenHour, timezone),
  };
}
