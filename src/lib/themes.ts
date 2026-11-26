import type { Locale } from "./i18n";
import { getDaylightInfo } from "./suncalc";
import type { PublicWebcam } from "./types";

export type WeatherThemeSlug = "daylight" | "night" | "sunny" | "snow" | "rain" | "cloudy";

export interface WeatherThemeDef {
  slug: WeatherThemeSlug;
  icon: string;
  accentClass: string;
  title: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  seoTitle: Record<Locale, string>;
  seoDesc: Record<Locale, string>;
}

export const WEATHER_THEMES: WeatherThemeDef[] = [
  {
    slug: "daylight",
    icon: "☀️",
    accentClass: "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    title: {
      en: "Daylight Views Now",
      zh: "正在白昼 · 阳光实景",
      ja: "現在昼間のライブカメラ",
      es: "Vistas de Día Ahora",
      fr: "Vues de Jour en Direct",
      de: "Aktuelle Tageslicht-Ansichten",
    },
    subtitle: {
      en: "Live cameras currently experiencing daytime and natural sunlight around the globe.",
      zh: "基于经纬度与当地日出日落时间，实时筛选全球正处于白昼的景观摄像头。",
      ja: "各地の日の出・日の入り時刻から現在昼間のライブカメラをリアルタイムで表示します。",
      es: "Cámaras en vivo donde actualmente es de día con luz solar natural.",
      fr: "Webcams en direct où il fait actuellement jour dans le monde.",
      de: "Live-Webcams weltweit, an denen aktuell Tageslicht herrscht.",
    },
    seoTitle: {
      en: "Daylight Live Webcams Around the World",
      zh: "全球白昼实时摄像头直播",
      ja: "世界の昼間のライブカメラ一覧",
      es: "Webcams en Vivo de Día en el Mundo",
      fr: "Webcams en Direct de Jour dans le Monde",
      de: "Tageslicht Live-Webcams weltweit",
    },
    seoDesc: {
      en: "Watch live webcams currently in daylight based on real-time local sunrise and sunset calculations.",
      zh: "按实时日出日落时间筛选全球正在白昼中的免费高清景观直播。",
      ja: "リアルタイムの日の出・日の入り計算に基づく昼間のライブカメラ。",
      es: "Mira webcams en vivo actualmente de día según el amanecer y atardecer local.",
      fr: "Regardez les webcams en direct actuellement de jour selon l'heure solaire locale.",
      de: "Sehen Sie Live-Webcams bei aktuellem Tageslicht basierend auf lokalem Sonnenauf- und -untergang.",
    },
  },
  {
    slug: "night",
    icon: "🌙",
    accentClass: "border-indigo-200 bg-indigo-50/70 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300",
    title: {
      en: "Night Views & City Lights",
      zh: "全球夜景 · 灯光实景",
      ja: "世界の夜景ライブカメラ",
      es: "Vistas Nocturnas y Luces",
      fr: "Vues Nocturnes & Lumières",
      de: "Nachtansichten & Lichter",
    },
    subtitle: {
      en: "Explore skylines, streets, and harbours currently after sunset around the world.",
      zh: "探索全球已进入黑夜的城市天际线、街头灯火与海港夜景直播。",
      ja: "日没後の都市の夜景、街並み、港のライブ映像をリアルタイムで楽しめます。",
      es: "Explora horizontes urbanos, calles y puertos actualmente de noche.",
      fr: "Explorez les villes, rues et ports actuellement plongés dans la nuit.",
      de: "Entdecken Sie Skylines, Straßen und Häfen weltweit nach Sonnenuntergang.",
    },
    seoTitle: {
      en: "Night Live Webcams & City Lights",
      zh: "全球夜景实时摄像头直播",
      ja: "世界の夜景・夜のライブカメラ",
      es: "Webcams Nocturnas en Vivo",
      fr: "Webcams Nocturnes en Direct",
      de: "Nacht-Webcams & Stadtlichter live",
    },
    seoDesc: {
      en: "Watch live night webcams and illuminated city skylines where the sun has already set.",
      zh: "观看全球已入夜地区的城市夜景与灯光实时摄像头。",
      ja: "現在夜を迎えている世界の都市夜景ライブカメラを視聴できます。",
      es: "Mira webcams nocturnas en vivo donde ya se ha puesto el sol.",
      fr: "Regardez les webcams nocturnes en direct où le soleil s'est déjà couché.",
      de: "Sehen Sie Live-Nacht-Webcams und beleuchtete Skylines nach Sonnenuntergang.",
    },
  },
  {
    slug: "sunny",
    icon: "🌤️",
    accentClass: "border-sky-200 bg-sky-50/70 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300",
    title: {
      en: "Sunny & Clear Skies",
      zh: "晴朗好天气",
      ja: "晴天・快晴のライブカメラ",
      es: "Cielos Despejados y Sol",
      fr: "Ciel Dégagé & Ensoleillé",
      de: "Sonnig & Klar",
    },
    subtitle: {
      en: "Destinations currently reporting clear or sunny weather via live Open-Meteo telemetry.",
      zh: "根据 Open-Meteo 实时气象数据筛选当前晴朗或少云的目的地直播。",
      ja: "Open-Meteoのリアルタイム気象データで現在晴れている地域のライブカメラです。",
      es: "Destinos que reportan cielo despejado o soleado en tiempo real.",
      fr: "Destinations affichant actuellement un ciel dégagé ou ensoleillé.",
      de: "Reiseziele mit aktuell klarem oder sonnigem Wetter laut Open-Meteo.",
    },
    seoTitle: {
      en: "Live Webcams Where It Is Sunny",
      zh: "当前晴朗的全球实时摄像头",
      ja: "現在晴れている世界のライブカメラ",
      es: "Webcams en Vivo Donde Hace Sol",
      fr: "Webcams en Direct Où Il Fait Beau",
      de: "Live-Webcams bei sonnigem Wetter",
    },
    seoDesc: {
      en: "Discover live webcams with clear and sunny skies right now.",
      zh: "发现当前全球天气晴朗、能见度极佳的实时景观摄像头。",
      ja: "現在晴天・快晴のライブカメラをリアルタイムで検索できます。",
      es: "Descubre webcams en vivo con cielo despejado y sol ahora mismo.",
      fr: "Découvrez les webcams en direct sous un ciel dégagé et ensoleillé.",
      de: "Entdecken Sie Live-Webcams mit aktuell klarem und sonnigem Himmel.",
    },
  },
  {
    slug: "snow",
    icon: "❄️",
    accentClass: "border-cyan-200 bg-cyan-50/70 text-cyan-800 dark:border-cyan-900/50 dark:bg-cyan-950/30 dark:text-cyan-300",
    title: {
      en: "Snowing Now",
      zh: "正在下雪的直播",
      ja: "現在雪が降っているカメラ",
      es: "Nevando Ahora",
      fr: "Neige en Direct",
      de: "Aktueller Schneefall",
    },
    subtitle: {
      en: "Live webcams where snowfall or freezing winter weather is currently detected.",
      zh: "实时气象数据显示当前正在降雪或下阵雪的冬季景观摄像头。",
      ja: "現在降雪が観測されている地域のリアルタイムライブカメラです。",
      es: "Cámaras en vivo donde actualmente está nevando.",
      fr: "Webcams en direct où la neige tombe actuellement.",
      de: "Live-Webcams an Orten mit aktuellem Schneefall.",
    },
    seoTitle: {
      en: "Live Webcams Where It Is Snowing",
      zh: "正在下雪的全球实时摄像头",
      ja: "現在雪が降っているライブカメラ",
      es: "Webcams en Vivo Donde Está Nevando",
      fr: "Webcams en Direct Où Il Neige",
      de: "Live-Webcams bei aktuellem Schneefall",
    },
    seoDesc: {
      en: "Watch live webcams where it is currently snowing based on real-time weather feeds.",
      zh: "观看当前正在下雪的全球实时景观摄像头与滑雪场实况。",
      ja: "リアルタイム気象データに基づく現在降雪中のライブカメラ。",
      es: "Mira webcams en vivo donde está nevando ahora mismo.",
      fr: "Regardez les webcams en direct où il neige en ce moment.",
      de: "Sehen Sie Live-Webcams, an denen es aktuell schneit.",
    },
  },
  {
    slug: "rain",
    icon: "🌧️",
    accentClass: "border-slate-200 bg-slate-100/80 text-slate-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
    title: {
      en: "Rain & Showers",
      zh: "雨景与雷暴实况",
      ja: "雨・にわか雨のライブカメラ",
      es: "Lluvia y Chubascos",
      fr: "Pluie & Averses",
      de: "Regen & Schauer",
    },
    subtitle: {
      en: "Cozy rainy streets, coastal squalls, and storm-watching cameras live right now.",
      zh: "感受世界各地正在下雨的街头、海岸与雨景直播。",
      ja: "世界各地の雨の街並みや海岸のライブ映像をリアルタイムでお届けします。",
      es: "Calles lluviosas y costas con lluvia en directo ahora mismo.",
      fr: "Rues pluvieuses et averses côtières en direct dans le monde.",
      de: "Regnerische Straßen und Küstenwetter weltweit live erleben.",
    },
    seoTitle: {
      en: "Live Webcams Where It Is Raining",
      zh: "正在下雨的全球实时摄像头",
      ja: "現在雨が降っているライブカメラ",
      es: "Webcams en Vivo Donde Está Lloviendo",
      fr: "Webcams en Direct Où Il Pleut",
      de: "Live-Webcams bei aktuellem Regen",
    },
    seoDesc: {
      en: "Watch live webcams experiencing rain, showers, or storms around the world.",
      zh: "观看全球正在下雨或阵雨地区的实时景观摄像头。",
      ja: "現在雨が降っている世界のライブカメラを視聴できます。",
      es: "Mira webcams en vivo con lluvia y chubascos en todo el mundo.",
      fr: "Regardez les webcams en direct sous la pluie dans le monde entier.",
      de: "Sehen Sie Live-Webcams mit aktuellem Regen weltweit.",
    },
  },
  {
    slug: "cloudy",
    icon: "☁️",
    accentClass: "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200",
    title: {
      en: "Cloudy, Mist & Fog",
      zh: "多云与雾景",
      ja: "曇り・霧のライブカメラ",
      es: "Nublado y Niebla",
      fr: "Nuageux & Brouillard",
      de: "Bewölkt & Nebel",
    },
    subtitle: {
      en: "Atmospheric overcast skies, mountain mist, and coastal fog live right now.",
      zh: "正在经历多云、阴天或海雾山岚的实时景观视角。",
      ja: "曇り空や霧に包まれた山岳・海岸のライブ映像をお届けします。",
      es: "Cielos nublados y niebla atmosférica en vivo ahora mismo.",
      fr: "Ciels couverts et brumes atmosphériques en direct.",
      de: "Bedeckter Himmel und stimmungsvoller Nebel live.",
    },
    seoTitle: {
      en: "Cloudy & Foggy Live Webcams",
      zh: "多云与雾景实时摄像头",
      ja: "曇り・霧のライブカメラ一覧",
      es: "Webcams Nubladas y con Niebla",
      fr: "Webcams Nuageuses et Brumeuses",
      de: "Bewölkte & neblige Live-Webcams",
    },
    seoDesc: {
      en: "Explore live webcams currently under cloudy, overcast, or foggy weather.",
      zh: "浏览当前天气为多云、阴天或有雾的全球实时摄像头。",
      ja: "現在曇りや霧が観測されている世界のライブカメラ。",
      es: "Explora webcams en vivo bajo condiciones nubladas o con niebla.",
      fr: "Explorez les webcams en direct par temps nuageux ou brumeux.",
      de: "Entdecken Sie Live-Webcams bei bewölktem oder nebligem Wetter.",
    },
  },
];

export function getWeatherTheme(slug: string): WeatherThemeDef | null {
  return WEATHER_THEMES.find((t) => t.slug === slug) ?? null;
}

export function matchesWeatherTheme(webcam: PublicWebcam, theme: WeatherThemeSlug): boolean {
  const weather = webcam.weatherSummary.toLowerCase();
  if (theme === "daylight") {
    return getDaylightInfo(webcam.city.lat, webcam.city.lng, webcam.city.timezone).isDaylight;
  }
  if (theme === "night") {
    return !getDaylightInfo(webcam.city.lat, webcam.city.lng, webcam.city.timezone).isDaylight;
  }
  if (theme === "sunny") {
    return /clear|sunny|fair/.test(weather);
  }
  if (theme === "snow") {
    return /snow|rime/.test(weather);
  }
  if (theme === "rain") {
    return /rain|drizzle|showers|thunderstorm/.test(weather);
  }
  if (theme === "cloudy") {
    return /cloudy|overcast|fog/.test(weather);
  }
  return false;
}

export function getThemeSectionHeading(locale: Locale): { title: string; subtitle: string; emptyTitle: string; emptyBody: string } {
  const dict: Record<Locale, { title: string; subtitle: string; emptyTitle: string; emptyBody: string }> = {
    en: {
      title: "Discover by Daylight & Weather",
      subtitle: "Live theme collections filtered by real-time sun position and Open-Meteo weather",
      emptyTitle: "No webcams currently match this weather condition",
      emptyBody: "Weather conditions update automatically every 15 minutes. Try another live theme below.",
    },
    zh: {
      title: "昼夜与天气主题发现",
      subtitle: "结合实时日出日落计算与 Open-Meteo 气象数据动态筛选",
      emptyTitle: "当前暂无符合该天气条件的直播点位",
      emptyBody: "全球天气每 15 分钟自动更新一次，您可以切换其他昼夜或天气主题。",
    },
    ja: {
      title: "昼夜・天気テーマから探す",
      subtitle: "リアルタイムの太陽位置とOpen-Meteo気象データで自動抽出",
      emptyTitle: "現在この天気条件に一致するカメラはありません",
      emptyBody: "気象データは15分ごとに自動更新されます。他のテーマをお試しください。",
    },
    es: {
      title: "Explorar por Luz y Clima",
      subtitle: "Colecciones filtradas en vivo por posición solar y clima Open-Meteo",
      emptyTitle: "No hay webcams con esta condición climática ahora mismo",
      emptyBody: "El clima se actualiza cada 15 minutos. Prueba otro tema en vivo.",
    },
    fr: {
      title: "Découvrir par Lumière & Météo",
      subtitle: "Collections filtrées en temps réel par ensoleillement et météo Open-Meteo",
      emptyTitle: "Aucune webcam ne correspond actuellement à cette météo",
      emptyBody: "La météo est actualisée toutes les 15 minutes. Essayez un autre thème ci-dessous.",
    },
    de: {
      title: "Nach Tageszeit & Wetter entdecken",
      subtitle: "Live-Themen basierend auf aktuellem Sonnenstand und Open-Meteo-Wetter",
      emptyTitle: "Aktuell keine Webcams für diese Wetterbedingung",
      emptyBody: "Wetterdaten werden alle 15 Minuten aktualisiert. Wählen Sie unten ein anderes Thema.",
    },
  };
  return dict[locale] ?? dict.en;
}
