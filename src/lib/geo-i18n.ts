import type { Locale } from "./i18n";

const COUNTRY_NAMES: Record<string, Partial<Record<Locale, string>>> = {
  international: { en: "International", zh: "国际 / 全球", ja: "国際", es: "Internacional", fr: "International" },
  "united-states": { en: "United States", zh: "美国", ja: "アメリカ合衆国", es: "Estados Unidos", fr: "États-Unis" },
  "united-kingdom": { en: "United Kingdom", zh: "英国", ja: "イギリス", es: "Reino Unido", fr: "Royaume-Uni" },
  japan: { en: "Japan", zh: "日本", ja: "日本", es: "Japón", fr: "Japon" },
  italy: { en: "Italy", zh: "意大利", ja: "イタリア", es: "Italia", fr: "Italie" },
  canada: { en: "Canada", zh: "加拿大", ja: "カナダ", es: "Canadá", fr: "Canada" },
  namibia: { en: "Namibia", zh: "纳米比亚", ja: "ナミビア", es: "Namibia", fr: "Namibie" },
  australia: { en: "Australia", zh: "澳大利亚", ja: "オーストラリア", es: "Australia", fr: "Australie" },
  "south-korea": { en: "South Korea", zh: "韩国", ja: "韓国", es: "Corea del Sur", fr: "Corée du Sud" },
  netherlands: { en: "Netherlands", zh: "荷兰", ja: "オランダ", es: "Países Bajos", fr: "Pays-Bas" },
  kenya: { en: "Kenya", zh: "肯尼亚", ja: "ケニア", es: "Kenia", fr: "Kenya" },
  switzerland: { en: "Switzerland", zh: "瑞士", ja: "スイス", es: "Suiza", fr: "Suisse" },
  "south-africa": { en: "South Africa", zh: "南非", ja: "南アフリカ", es: "Sudáfrica", fr: "Afrique du Sud" },
  norway: { en: "Norway", zh: "挪威", ja: "ノルウェー", es: "Noruega", fr: "Norvège" },
  greece: { en: "Greece", zh: "希腊", ja: "ギリシャ", es: "Grecia", fr: "Grèce" },
  finland: { en: "Finland", zh: "芬兰", ja: "フィンランド", es: "Finlandia", fr: "Finlande" },
  czechia: { en: "Czechia", zh: "捷克", ja: "チェコ", es: "Chequia", fr: "Tchéquie" },
  france: { en: "France", zh: "法国", ja: "フランス", es: "Francia", fr: "France" },
  germany: { en: "Germany", zh: "德国", ja: "ドイツ", es: "Alemania", fr: "Allemagne" },
  spain: { en: "Spain", zh: "西班牙", ja: "スペイン", es: "España", fr: "Espagne" },
  china: { en: "China", zh: "中国", ja: "中国", es: "China", fr: "Chine" },
};

const CITY_NAMES: Record<string, Partial<Record<Locale, string>>> = {
  tokyo: { en: "Tokyo", zh: "东京", ja: "東京", es: "Tokio", fr: "Tokyo" },
  fujikawaguchiko: { en: "Fujikawaguchiko", zh: "富士河口湖", ja: "富士河口湖", es: "Fujikawaguchiko", fr: "Fujikawaguchiko" },
  "new-york": { en: "New York", zh: "纽约", ja: "ニューヨーク", es: "Nueva York", fr: "New York" },
  "los-angeles": { en: "Los Angeles", zh: "洛杉矶", ja: "ロサンゼルス", es: "Los Ángeles", fr: "Los Angeles" },
  honolulu: { en: "Honolulu", zh: "檀香山", ja: "ホノルル", es: "Honolulú", fr: "Honolulu" },
  "cape-canaveral": { en: "Cape Canaveral", zh: "卡纳维拉尔角", ja: "ケープカナベラル", es: "Cabo Cañaveral", fr: "Cap Canaveral" },
  minneapolis: { en: "Minneapolis", zh: "明尼阿波利斯", ja: "ミネアポリス", es: "Mineápolis", fr: "Minneapolis" },
  "key-west": { en: "Key West", zh: "基韦斯特", ja: "キーウェスト", es: "Cayo Hueso", fr: "Key West" },
  "hawaii-volcanoes-np": { en: "Hawaii Volcanoes NP", zh: "夏威夷火山国家公园", ja: "ハワイ火山国立公園", es: "P. N. Volcanes de Hawái", fr: "Parc des Volcans d'Hawaï" },
  hollywood: { en: "Hollywood", zh: "好莱坞", ja: "ハリウッド", es: "Hollywood", fr: "Hollywood" },
  "hollywood-fl": { en: "Hollywood", zh: "好莱坞（佛州）", ja: "ハリウッド", es: "Hollywood", fr: "Hollywood" },
  fairbanks: { en: "Fairbanks", zh: "费尔班克斯", ja: "フェアバンクス", es: "Fairbanks", fr: "Fairbanks" },
  ashford: { en: "Ashford", zh: "阿什福德", ja: "アシュフォード", es: "Ashford", fr: "Ashford" },
  "grand-canyon": { en: "Grand Canyon", zh: "大峡谷", ja: "グランド・キャニオン", es: "Gran Cañón", fr: "Grand Canyon" },
  yosemite: { en: "Yosemite", zh: "优胜美地", ja: "ヨセミテ", es: "Yosemite", fr: "Yosemite" },
  yellowstone: { en: "Yellowstone", zh: "黄石公园", ja: "イエローストーン", es: "Yellowstone", fr: "Yellowstone" },
  "mauna-loa": { en: "Mauna Loa", zh: "冒纳罗亚火山", ja: "マウナロア", es: "Mauna Loa", fr: "Mauna Loa" },
  "west-glacier": { en: "West Glacier", zh: "西冰川", ja: "ウェストグレーシャー", es: "West Glacier", fr: "West Glacier" },
  houston: { en: "Houston", zh: "休斯敦", ja: "ヒューストン", es: "Houston", fr: "Houston" },
  pahoa: { en: "Pahoa", zh: "帕霍亚", ja: "パホア", es: "Pahoa", fr: "Pahoa" },
  venice: { en: "Venice", zh: "威尼斯", ja: "ヴェネツィア", es: "Venecia", fr: "Venise" },
  rome: { en: "Rome", zh: "罗马", ja: "ローマ", es: "Roma", fr: "Rome" },
  catania: { en: "Catania", zh: "卡塔尼亚", ja: "カターニア", es: "Catania", fr: "Catane" },
  london: { en: "London", zh: "伦敦", ja: "ロンドン", es: "Londres", fr: "Londres" },
  amsterdam: { en: "Amsterdam", zh: "阿姆斯特丹", ja: "アムステルダム", es: "Ámsterdam", fr: "Amsterdam" },
  seoul: { en: "Seoul", zh: "首尔", ja: "ソウル", es: "Seúl", fr: "Séoul" },
  sydney: { en: "Sydney", zh: "悉尼", ja: "シドニー", es: "Sídney", fr: "Sydney" },
  banff: { en: "Banff", zh: "班夫", ja: "バンフ", es: "Banff", fr: "Banff" },
  zermatt: { en: "Zermatt", zh: "采尔马特", ja: "ツェルマット", es: "Zermatt", fr: "Zermatt" },
  gornergrat: { en: "Gornergrat", zh: "戈尔内格拉特", ja: "ゴルナーグラート", es: "Gornergrat", fr: "Gornergrat" },
  zurich: { en: "Zurich", zh: "苏黎世", ja: "チューリッヒ", es: "Zúrich", fr: "Zurich" },
  "st-moritz": { en: "St. Moritz", zh: "圣莫里茨", ja: "サンモリッツ", es: "Sankt Moritz", fr: "Saint-Moritz" },
  "st-gallen": { en: "St. Gallen", zh: "圣加仑", ja: "ザンクト・ガレン", es: "San Galo", fr: "Saint-Gall" },
  filisur: { en: "Filisur", zh: "菲利苏尔", ja: "フィリズール", es: "Filisur", fr: "Filisur" },
  wadenswil: { en: "Wädenswil", zh: "韦登斯维尔", ja: "ヴェーデンスヴィル", es: "Wädenswil", fr: "Wädenswil" },
  einsiedeln: { en: "Einsiedeln", zh: "艾因西德伦", ja: "アインジーデルン", es: "Einsiedeln", fr: "Einsiedeln" },
  oslo: { en: "Oslo", zh: "奥斯陆", ja: "オスロ", es: "Oslo", fr: "Oslo" },
  finse: { en: "Finse", zh: "芬瑟", ja: "フィンセ", es: "Finse", fr: "Finse" },
  rovaniemi: { en: "Rovaniemi", zh: "罗瓦涅米", ja: "ロヴァニエミ", es: "Rovaniemi", fr: "Rovaniemi" },
  "cape-town": { en: "Cape Town", zh: "开普敦", ja: "ケープタウン", es: "Ciudad del Cabo", fr: "Le Cap" },
  mpumalanga: { en: "Mpumalanga", zh: "姆普马兰加", ja: "ムプマランガ", es: "Mpumalanga", fr: "Mpumalanga" },
  milnerton: { en: "Milnerton", zh: "米尔纳顿", ja: "ミルナートン", es: "Milnerton", fr: "Milnerton" },
  "gondwana-namib": { en: "Gondwana Namib", zh: "纳米布沙漠", ja: "ゴンドワナ・ナミブ", es: "Gondwana Namib", fr: "Gondwana Namib" },
  laikipia: { en: "Laikipia", zh: "莱基皮亚", ja: "ライキピア", es: "Laikipia", fr: "Laikipia" },
  "agia-kyriaki": { en: "Agia Kyriaki", zh: "阿基亚基里亚基", ja: "アギア・キリアキ", es: "Agia Kyriaki", fr: "Agia Kyriaki" },
  kliny: { en: "Klíny", zh: "克利尼", ja: "クリーニ", es: "Klíny", fr: "Klíny" },
  "live-stream": { en: "Live Stream", zh: "全球直播", ja: "ライブ配信", es: "En Vivo", fr: "En Direct" },
};

const displayNamesCache = new Map<Locale, Intl.DisplayNames>();

function getRegionDisplayNames(locale: Locale): Intl.DisplayNames | null {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames === "undefined") return null;
  let cached = displayNamesCache.get(locale);
  if (!cached) {
    try {
      cached = new Intl.DisplayNames([locale === "zh" ? "zh-CN" : locale], { type: "region" });
      displayNamesCache.set(locale, cached);
    } catch {
      return null;
    }
  }
  return cached;
}

export function getCountryLabel(
  locale: Locale,
  slug: string,
  fallback?: string,
  isoCode?: string
): string {
  const key = slug.toLowerCase().trim();
  const explicit = COUNTRY_NAMES[key]?.[locale];
  if (explicit) return explicit;

  if (key !== "international" && isoCode && /^[A-Z]{2}$/i.test(isoCode)) {
    const intl = getRegionDisplayNames(locale);
    const localized = intl?.of(isoCode.toUpperCase());
    if (localized) return localized;
  }

  return COUNTRY_NAMES[key]?.en ?? fallback ?? slug;
}

export function getCityLabel(locale: Locale, slug: string, fallback?: string): string {
  const key = slug.toLowerCase().trim();
  return CITY_NAMES[key]?.[locale] ?? CITY_NAMES[key]?.en ?? fallback ?? slug;
}
