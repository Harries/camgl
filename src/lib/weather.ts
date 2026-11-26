const WMO_CODE_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Rain Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Snow Showers",
  86: "Heavy Snow",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export function formatWmoCode(code: number | undefined): string {
  if (code === undefined || Number.isNaN(code)) return "Fair";
  return WMO_CODE_LABELS[code] ?? "Cloudy";
}

export interface DetailedWeather {
  tempC: number;
  humidity: number | null;
  windKmh: number | null;
  condition: string;
  daily: Array<{
    date: string;
    condition: string;
    minC: number;
    maxC: number;
  }>;
}

const WEATHER_TTL_MS = 15 * 60 * 1000;

interface WeatherCacheStore {
  batch: Map<string, { value: string; expiresAt: number }>;
  detailed: Map<string, { value: DetailedWeather; expiresAt: number }>;
}

const globalForWeather = globalThis as unknown as {
  __camglWeatherCache?: WeatherCacheStore;
};

const weatherCache = (globalForWeather.__camglWeatherCache ??= {
  batch: new Map(),
  detailed: new Map(),
});

export async function fetchDetailedWeather(
  lat: number,
  lng: number
): Promise<DetailedWeather | null> {
  if (lat === 0 && lng === 0) return null;
  const key = coordKey(lat, lng);
  const now = Date.now();
  const cached = weatherCache.detailed.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=auto`;
    const res = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        wind_speed_10m?: number;
        weather_code?: number;
      };
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
      };
    };
    if (!json.current || typeof json.current.temperature_2m !== "number") return null;

    const times = json.daily?.time ?? [];
    const codes = json.daily?.weather_code ?? [];
    const maxs = json.daily?.temperature_2m_max ?? [];
    const mins = json.daily?.temperature_2m_min ?? [];

    const daily = times.slice(0, 4).map((date, idx) => ({
      date,
      condition: formatWmoCode(codes[idx]),
      minC: Math.round(mins[idx] ?? json.current!.temperature_2m!),
      maxC: Math.round(maxs[idx] ?? json.current!.temperature_2m!),
    }));

    const detailed: DetailedWeather = {
      tempC: Math.round(json.current.temperature_2m),
      humidity:
        typeof json.current.relative_humidity_2m === "number"
          ? Math.round(json.current.relative_humidity_2m)
          : null,
      windKmh:
        typeof json.current.wind_speed_10m === "number"
          ? Math.round(json.current.wind_speed_10m)
          : null,
      condition: formatWmoCode(json.current.weather_code),
      daily,
    };
    weatherCache.detailed.set(key, { value: detailed, expiresAt: now + WEATHER_TTL_MS });
    return detailed;
  } catch {
    return null;
  }
}

export function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

interface OpenMeteoItem {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
}

export async function fetchWeatherBatch(
  coords: { lat: number; lng: number }[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (coords.length === 0) return result;

  const now = Date.now();
  const missing = new Map<string, { lat: number; lng: number }>();

  for (const c of coords) {
    if (c.lat === 0 && c.lng === 0) continue;
    const key = coordKey(c.lat, c.lng);
    const cached = weatherCache.batch.get(key);
    if (cached && cached.expiresAt > now) {
      result.set(key, cached.value);
    } else if (!missing.has(key)) {
      missing.set(key, c);
    }
  }

  if (missing.size === 0) return result;

  const list = Array.from(missing.entries());
  const CHUNK_SIZE = 40;
  const chunks: Array<Array<[string, { lat: number; lng: number }]>> = [];
  for (let i = 0; i < list.length; i += CHUNK_SIZE) {
    chunks.push(list.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      const latitudes = chunk.map(([, c]) => c.lat.toFixed(4)).join(",");
      const longitudes = chunk.map(([, c]) => c.lng.toFixed(4)).join(",");
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}&current=temperature_2m,weather_code`;
        const res = await fetch(url, {
          next: { revalidate: 900 },
          signal: AbortSignal.timeout(1800),
        });
        if (!res.ok) return;

        const json = (await res.json()) as OpenMeteoItem | OpenMeteoItem[];
        const items = Array.isArray(json) ? json : [json];

        chunk.forEach(([key], idx) => {
          const current = items[idx]?.current;
          if (current && typeof current.temperature_2m === "number") {
            const temp = Math.round(current.temperature_2m);
            const label = formatWmoCode(current.weather_code);
            const formatted = `${temp}°C · ${label}`;
            result.set(key, formatted);
            weatherCache.batch.set(key, {
              value: formatted,
              expiresAt: Date.now() + WEATHER_TTL_MS,
            });
          }
        });
      } catch {
        // Gracefully skip if offline or Open-Meteo times out
      }
    })
  );

  return result;
}
