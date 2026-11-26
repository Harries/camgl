export const SUPPORTED_LOCALES = ["en", "zh", "ja", "es", "fr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "camgl_lang";

export const LOCALE_OPTIONS: { code: Locale; label: string; short: string; flag: string }[] = [
  { code: "en", label: "English", short: "EN", flag: "🇺🇸" },
  { code: "zh", label: "简体中文", short: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", short: "日本語", flag: "🇯🇵" },
  { code: "es", label: "Español", short: "ES", flag: "🇪🇸" },
  { code: "fr", label: "Français", short: "FR", flag: "🇫🇷" },
];

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase().trim();
  if ((SUPPORTED_LOCALES as readonly string[]).includes(lower)) {
    return lower as Locale;
  }
  const prefix = lower.split("-")[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(prefix)) {
    return prefix as Locale;
  }
  return DEFAULT_LOCALE;
}

export interface Messages {
  nav: {
    brandSubtitle: string;
    searchPlaceholder: string;
    discover: string;
    mapAndCountries: string;
    submit: string;
    random: string;
    live: string;
  };
  footer: {
    tagline: string;
    mapAndCountries: string;
    partnersAndSubmit: string;
    privacy: string;
    terms: string;
    contact: string;
  };
  home: {
    watchLive: string;
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    liveCams: string;
    countries: string;
    licensed: string;
    exploreMap: string;
    randomCam: string;
    allCategories: string;
    showingWebcams: string;
    browseByCountry: string;
    browseByCountrySub: string;
    viewAllCountries: string;
  };
  grid: {
    loadingMore: string;
    loadMore: string;
    showingAll: string;
  };
  search: {
    titleDefault: string;
    titleForQuery: string;
    foundCount: string;
    noResults: string;
    backHome: string;
  };
  submit: {
    portalEyebrow: string;
    title: string;
    subtitle: string;
    webcamTitle: string;
    category: string;
    countryCity: string;
    streamUrl: string;
    operator: string;
    contactEmail: string;
    description: string;
    descriptionPlaceholder: string;
    declaration: string;
    cancel: string;
    submitBtn: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    backHome: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    partnersTitle: string;
    partnersBody: string;
    submitBtn: string;
    privacyTitle: string;
    privacyBody: string;
    viewPrivacy: string;
    supportTitle: string;
    supportBody: string;
    browseCams: string;
    formTitle: string;
    formSubtitle: string;
    yourName: string;
    namePlaceholder: string;
    yourEmail: string;
    subject: string;
    subjectPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    sending: string;
    sendBtn: string;
    sentTitle: string;
    sentBody: string;
    sendAnother: string;
    includeTitle: string;
    includeBody: string;
  };
  legal: {
    eyebrow: string;
    privacyTitle: string;
    privacySubtitle: string;
    termsTitle: string;
    termsSubtitle: string;
    contactPrivacy: string;
    readTerms: string;
    contactUs: string;
    readPrivacy: string;
    privacySections: { title: string; body: string[] }[];
    termsSections: { title: string; body: string[] }[];
  };
  player: {
    unavailableTitle: string;
    unavailableBody: string;
    watchOriginal: string;
    connecting: string;
    autoRefresh: string;
    refreshSnapshot: string;
  };
  webcam: {
    home: string;
    backToDiscover: string;
    localTime: string;
    liveWeather: string;
    streamStatus: string;
    sourceAttribution: string;
    officialPartner: string;
    aboutTitle: string;
    positionedSummary: string;
    bestTimeToWatch: string;
    categoriesLabel: string;
    categoryWebcams: string;
    allCountryCams: string;
    telemetryTitle: string;
    sunriseSunset: string;
    goldenHour: string;
    coordinates: string;
    timezone: string;
    streamFormat: string;
    originalSource: string;
    openSource: string;
    officialFeed: string;
    faqTitle: string;
    nearbyRelated: string;
    random: string;
    daylight: string;
    nighttime: string;
    faq1Q: string;
    faq1A: string;
    faq2Q: string;
    faq2AWithBest: string;
    faq2ADefault: string;
    faq3Q: string;
    faq3A: string;
    faq4Q: string;
    faq4A: string;
    localizedDescription: string;
    bestTimeDefault: string;
    views: string;
  };
  countries: {
    worldExplorer: string;
    heroTitle: string;
    heroSubtitle: string;
    matchingCameras: string;
    live: string;
    selected: string;
    openLiveStream: string;
    countriesTitle: string;
    showAllCountries: string;
    citiesIn: string;
    citiesWorldwide: string;
    resetFilters: string;
    matchingWebcams: string;
    openSeoPage: string;
    directoryEyebrow: string;
    directoryTitle: string;
    directorySubtitle: string;
    countriesBadge: string;
    citiesBadge: string;
    camCount: string;
  };
  seo: {
    homeTitle: string;
    homeTemplate: string;
    homeDesc: string;
    countriesTitle: string;
    countriesDesc: string;
    countryTitle: string;
    countryDesc: string;
    cityTitle: string;
    cityDesc: string;
    categoryTitle: string;
    categoryDesc: string;
    webcamTitle: string;
    webcamDesc: string;
    submitTitle: string;
    submitDesc: string;
    privacyTitle: string;
    privacyDesc: string;
    termsTitle: string;
    termsDesc: string;
    contactTitle: string;
    contactDesc: string;
  };
  categories: Record<string, string>;
}

const en: Messages = {
  nav: {
    brandSubtitle: "Verified Live Views",
    searchPlaceholder: "Search city, country, landmark, or category...",
    discover: "Discover",
    mapAndCountries: "Map & Countries",
    submit: "Submit",
    random: "Random",
    live: "LIVE",
  },
  footer: {
    tagline: "LiveCam Global. Official embed player platform · No unauthorized surveillance streams.",
    mapAndCountries: "Map & Countries",
    partnersAndSubmit: "Partners & Submit",
    privacy: "Privacy Policy",
    terms: "Terms",
    contact: "Contact",
  },
  home: {
    watchLive: "Watch Live →",
    heroEyebrow: "Explore the World in Real Time",
    heroTitle: "Verified scenic webcams, local weather & live timezones — free, no login required.",
    heroSubtitle:
      "Browse by country, city, or category. Every stream is reviewed for licensing and privacy, embedded via official players, and monitored every 30 minutes.",
    liveCams: "Live Cams",
    countries: "Countries",
    licensed: "Licensed",
    exploreMap: "🗺️ Explore Map & Countries",
    randomCam: "🎲 Random Cam",
    allCategories: "All",
    showingWebcams: "Showing {count} webcams",
    browseByCountry: "Browse by Country & City",
    browseByCountrySub: "Hierarchical SEO directories with local time & weather context",
    viewAllCountries: "View all countries →",
  },
  grid: {
    loadingMore: "Loading more webcams...",
    loadMore: "Load More ({loaded} / {total})",
    showingAll: "Showing all {count} live webcams",
  },
  search: {
    titleDefault: "Search Live Webcams",
    titleForQuery: 'Search results for "{q}"',
    foundCount: "Found {count} verified live webcams",
    noResults: "No matching webcams found. Try another city, country, or category.",
    backHome: "Back to Discover",
  },
  submit: {
    portalEyebrow: "Partner & Operator Portal",
    title: "Submit a Live Webcam",
    subtitle:
      "Hotels, resorts, tourism boards, and camera operators can submit public scenic live streams for free listing. Submissions are reviewed before publishing.",
    webcamTitle: "Webcam Title *",
    category: "Category *",
    countryCity: "Country & City *",
    streamUrl: "Official Stream / Embed URL *",
    operator: "Operator / Hotel Name",
    contactEmail: "Contact Email *",
    description: "Description *",
    descriptionPlaceholder:
      "Describe what this webcam shows, visible landmarks, viewing angle, or best time to watch...",
    declaration:
      "I confirm this camera is a public scenic view (no private surveillance or sensitive areas) and I have authority to permit public embedding.",
    cancel: "Cancel",
    submitBtn: "Submit for Review",
    submitting: "Submitting...",
    successTitle: "Submission Received",
    successBody:
      "Your webcam has been placed in the Admin Review Queue for licensing and privacy verification.",
    backHome: "Back to Home",
  },
  contact: {
    eyebrow: "Support & Partnerships",
    title: "Contact LiveCam Global",
    subtitle:
      "Reach out to our team for operator partnerships, stream attribution updates, privacy inquiries, or broken feed reports.",
    partnersTitle: "Partners & Camera Operators",
    partnersBody:
      "Want to list your hotel, resort, city, or scenic live stream? Submit it directly or email our partnerships team.",
    submitBtn: "Submit a Webcam",
    privacyTitle: "Privacy & Removal Requests",
    privacyBody:
      "Need to update stream attribution, report a privacy concern, or request immediate removal of a listed camera?",
    viewPrivacy: "View Privacy Policy →",
    supportTitle: "Technical & General Support",
    supportBody:
      "Spotted an offline feed, wrong location tag, or playback issue? Use the Report button on any webcam page or write to us.",
    browseCams: "Browse Live Webcams →",
    formTitle: "Send Us a Message",
    formSubtitle:
      "Fill out the form below and our team will review your inquiry in the admin console.",
    yourName: "Your Name *",
    namePlaceholder: "e.g., Alex Morgan",
    yourEmail: "Contact Email *",
    subject: "Subject *",
    subjectPlaceholder: "Partnership, stream takedown, feedback, or technical issue",
    message: "Message *",
    messagePlaceholder: "Please include the webcam URL (if applicable) and any details...",
    sending: "Sending...",
    sendBtn: "Send Message",
    sentTitle: "Message Sent Successfully",
    sentBody:
      "Thank you for reaching out! Our team has received your message and will reply to your email as soon as possible.",
    sendAnother: "Send Another Message",
    includeTitle: "What to Include in Your Message",
    includeBody:
      "To help us respond quickly (typically within 1–2 business days), please include the webcam page URL, your organization or channel name, and any relevant ownership or technical details.",
  },
  legal: {
    eyebrow: "Legal & Compliance",
    privacyTitle: "Privacy Policy",
    privacySubtitle:
      "Last updated: November 25, 2026 · How LiveCam Global protects visitor privacy and reviews public scenic streams.",
    termsTitle: "Terms of Service",
    termsSubtitle:
      "Last updated: November 25, 2026 · Guidelines for visitors, stream operators, and partners on LiveCam Global.",
    contactPrivacy: "Contact Privacy Team",
    readTerms: "Read Terms of Service",
    contactUs: "Contact Us",
    readPrivacy: "Read Privacy Policy",
    privacySections: [
      {
        title: "1. Public Scenic Streams Only",
        body: [
          "LiveCam Global (camgl.com) is a curated directory of publicly accessible scenic webcams—including beaches, city skylines, mountains, ports, wildlife habitats, and transit landmarks.",
          "We do not host private surveillance cameras, residential feeds, or unauthorized streams. Every camera is reviewed prior to publication for public-view appropriateness and operator attribution.",
        ],
      },
      {
        title: "2. Information We Collect",
        body: [
          "Browsing LiveCam Global does not require an account or login. We store only minimal functional preferences—such as your light/dark theme and language selection in browser storage.",
          "If you submit a webcam through our Partner & Operator Portal (/submit), we collect the contact email and operator details you provide solely to verify stream authorization and communicate review status. Contact emails are never exposed in public pages or public APIs.",
          "If you send an inquiry via /contact or submit a stream report, we store the submitted fields to respond to your request and maintain directory accuracy.",
        ],
      },
      {
        title: "3. Third-Party Embeds & External Services",
        body: [
          "Live video streams are delivered directly from official third-party broadcasters and embed providers—such as YouTube (via privacy-enhanced youtube-nocookie.com embeds), Windy, HLS stream hosts, or official tourism/operator portals.",
          "Real-time local weather summaries displayed alongside webcams are fetched using public city coordinates via Open-Meteo without sending any personal user data.",
        ],
      },
      {
        title: "4. Cookies, Analytics & Retention",
        body: [
          "We minimize cookie usage and do not sell personal data to third parties. Standard hosting logs may temporarily record anonymized request metadata for security and uptime monitoring.",
          "You may request update or deletion of your contact information at any time.",
        ],
      },
      {
        title: "5. Privacy & Takedown Requests",
        body: [
          "If you operate a listed camera or believe a stream raises a privacy concern, please reach out to us with the webcam URL so we can review or remove it promptly.",
        ],
      },
    ],
    termsSections: [
      {
        title: "1. Acceptance of Terms",
        body: [
          "By accessing or using LiveCam Global (camgl.com), you agree to comply with these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the site.",
        ],
      },
      {
        title: "2. Nature of the Service",
        body: [
          "LiveCam Global provides an informational directory, interactive world map, and official embed viewer for publicly available live scenic webcams worldwide.",
          "All video streams, snapshots, and trademarks remain the intellectual property of their respective camera operators, tourism boards, and broadcasters.",
        ],
      },
      {
        title: "3. Partner & Operator Submissions",
        body: [
          "When submitting a webcam via /submit, you represent that the camera displays a public scenic view (no private surveillance), and that you hold authority to permit public embedding.",
          "LiveCam Global reserves the right to approve, edit metadata for clarity, or remove any listing at any time.",
        ],
      },
      {
        title: "4. Acceptable Use",
        body: [
          "You agree not to scrape, mirror, overload, or interfere with LiveCam Global's APIs or admin interfaces, and not to bypass technical restrictions enforced by upstream stream providers.",
        ],
      },
      {
        title: "5. Availability & Disclaimers",
        body: [
          "Live streams and local weather data are provided on an \"as-is\" and \"as-available\" basis. Temporary upstream outages or geo-restrictions may occur without notice.",
        ],
      },
      {
        title: "6. Copyright & Removal Requests",
        body: [
          "If you are a rights holder or camera operator and wish to update attribution or have a stream removed, please contact us with the listing URL and verification details.",
        ],
      },
    ],
  },
  player: {
    unavailableTitle: "Stream player unavailable",
    unavailableBody:
      "This stream may be temporarily offline, geo-restricted, or blocked from embedding in your region.",
    watchOriginal: "Watch on Original Source",
    connecting: "Connecting live stream...",
    autoRefresh: "Auto-refresh 15s",
    refreshSnapshot: "Refresh snapshot",
  },
  webcam: {
    home: "Home",
    backToDiscover: "← Back to Discover",
    localTime: "Local Time",
    liveWeather: "Live Weather",
    streamStatus: "Stream Status",
    sourceAttribution: "Source Attribution",
    officialPartner: "Official Partner",
    aboutTitle: "About {title}",
    positionedSummary:
      "Positioned in {city}, {country} ({lat}, {lng}), this live feed lets travelers, weather watchers, and locals check real-time sky conditions, daylight, and activity in the {timezone} timezone.",
    bestTimeToWatch: "Best Time to Watch",
    categoriesLabel: "Categories:",
    categoryWebcams: "{name} Webcams",
    allCountryCams: "All {country} Cams",
    telemetryTitle: "Daylight, Coordinates & Stream Details",
    sunriseSunset: "Sunrise / Sunset",
    goldenHour: "Golden Hour",
    coordinates: "Coordinates",
    timezone: "Timezone",
    streamFormat: "Stream Format",
    originalSource: "Original Source",
    openSource: "Open Source ↗",
    officialFeed: "Official Feed",
    faqTitle: "Frequently Asked Questions",
    nearbyRelated: "Nearby & Related",
    random: "Random →",
    daylight: "Daylight",
    nighttime: "Nighttime",
    faq1Q: "What is the current weather and local time at {title}?",
    faq1A:
      "Local time in {city}, {country} ({timezone}) is currently {localTime} ({phase}), with live weather conditions of {weather}. Today's sunrise is around {sunrise} and sunset is around {sunset}.",
    faq2Q: "When is the best time to watch {city} live?",
    faq2AWithBest: "{bestTime} Golden hour typically begins around {goldenHour} local time.",
    faq2ADefault:
      "Daylight hours between {sunrise} and {sunset} ({timezone}) offer the clearest visibility, with golden hour around {goldenHour}.",
    faq3Q: "What stream format does {title} use?",
    faq3A:
      "This webcam streams via {format} ({mediaType}) provided by {provider}. Stream availability is monitored automatically.",
    faq4Q: "Is this {city} live webcam free to watch?",
    faq4A:
      "Yes. All public scenic webcams on LiveCam Global are free to watch with no registration required, embedded from official or public-domain sources.",
    localizedDescription:
      "Watch {title} live from {city}, {country} ({categories}). Local time is {localTime} ({phase}) with current weather {weather}.",
    bestTimeDefault:
      "Daylight hours between {sunrise} and {sunset} ({timezone}) offer the clearest visibility, with golden hour around {goldenHour}.",
    views: "views",
  },
  countries: {
    worldExplorer: "World Explorer",
    heroTitle: "Explore by Map, Country & City",
    heroSubtitle: "Zoom, pan, or click any map marker, country, or city to filter live streams.",
    matchingCameras: "MapLibre GL · {count} matching cameras",
    live: "Live",
    selected: "Selected",
    openLiveStream: "Open Live Stream →",
    countriesTitle: "Countries ({count})",
    showAllCountries: "Show all countries",
    citiesIn: "Cities in {country}",
    citiesWorldwide: "Cities Worldwide",
    resetFilters: "Reset all filters",
    matchingWebcams: "Matching Live Webcams ({count})",
    openSeoPage: "Open SEO directory page →",
    directoryEyebrow: "Global Webcam Directory",
    directoryTitle: "Browse Live Webcams by Country & City",
    directorySubtitle:
      "Explore {cams} verified live streams across {countries} countries and {cities} cities with real-time local weather and daylight context.",
    countriesBadge: "{count} Countries",
    citiesBadge: "{count} Cities",
    camCount: "{count} cams",
  },
  seo: {
    homeTitle: "LiveCam Global — Verified Live Webcams Around the World",
    homeTemplate: "%s | LiveCam Global",
    homeDesc:
      "Explore verified 24/7 live scenic webcams, real-time local weather, and world map views across countries and cities worldwide.",
    countriesTitle: "Live Webcams by Country & City — Global Directory & Map",
    countriesDesc:
      "Browse verified 24/7 live webcams by country and city on an interactive world map. Explore beaches, city skylines, mountains, wildlife, and ports.",
    countryTitle: "{country} Live Webcams",
    countryDesc:
      "Watch {count} verified live webcams across cities in {country} with real-time local weather and time.",
    cityTitle: "{city}, {country} Live Webcams",
    cityDesc:
      "Watch live webcams in {city}, {country} with real-time weather and local time.",
    categoryTitle: "{category} Live Webcams",
    categoryDesc:
      "Watch verified 24/7 {category} live webcams from around the world with real-time weather.",
    webcamTitle: "{title} ({city}, {country})",
    webcamDesc:
      "Watch {title} live from {city}, {country}. Real-time local time, weather, and scenic live stream.",
    submitTitle: "Submit a Live Webcam",
    submitDesc:
      "Partner & operator portal to submit official public scenic live webcams for free listing on LiveCam Global.",
    privacyTitle: "Privacy Policy",
    privacyDesc:
      "Learn how LiveCam Global handles privacy, public scenic webcam embeds, theme preferences, and partner submissions.",
    termsTitle: "Terms of Service",
    termsDesc:
      "Terms of Service governing the use of LiveCam Global, official webcam embeds, partner submissions, and content attribution.",
    contactTitle: "Contact Us",
    contactDesc:
      "Contact LiveCam Global for webcam partnerships, stream removal or privacy requests, and technical support.",
  },
  categories: {
    all: "All",
    city: "City",
    beach: "Beach",
    nature: "Nature",
    wildlife: "Wildlife",
    rail: "Rail",
    ski: "Ski",
    volcano: "Volcano",
    port: "Port",
    live: "Live",
  },
};

const zh: Messages = {
  nav: {
    brandSubtitle: "全球实景实时直播",
    searchPlaceholder: "搜索城市、国家、地标或分类...",
    discover: "发现",
    mapAndCountries: "地图与国家",
    submit: "提交摄像头",
    random: "随机漫游",
    live: "直播",
  },
  footer: {
    tagline: "LiveCam Global · 官方授权嵌入播放平台 · 严禁未授权监控视频流",
    mapAndCountries: "地图与国家",
    partnersAndSubmit: "合作与提交",
    privacy: "隐私政策",
    terms: "服务条款",
    contact: "联系我们",
  },
  home: {
    watchLive: "立即观看 →",
    heroEyebrow: "实时探索世界角落",
    heroTitle: "精选全球风景实况摄像头、当地天气与实时时区 — 免费免登录观看。",
    heroSubtitle:
      "按国家、城市或分类浏览。每路视频流均经过授权与隐私审核，采用官方播放器嵌入，并每 30 分钟自动巡检状态。",
    liveCams: "在线镜头",
    countries: "国家/地区",
    licensed: "合规授权",
    exploreMap: "🗺️ 探索地图与国家",
    randomCam: "🎲 随机看一个",
    allCategories: "全部",
    showingWebcams: "共 {count} 个摄像头",
    browseByCountry: "按国家与城市浏览",
    browseByCountrySub: "支持当地时间与实时天气的全球城市目录",
    viewAllCountries: "查看全部国家 →",
  },
  grid: {
    loadingMore: "正在加载更多摄像头...",
    loadMore: "加载更多 ({loaded} / {total})",
    showingAll: "已显示全部 {count} 个实时摄像头",
  },
  search: {
    titleDefault: "搜索实时摄像头",
    titleForQuery: "“{q}” 的搜索结果",
    foundCount: "共找到 {count} 个已验证实时摄像头",
    noResults: "未找到匹配的摄像头，请尝试其他城市、国家或分类关键词。",
    backHome: "返回发现页",
  },
  submit: {
    portalEyebrow: "合作伙伴与运营商入口",
    title: "提交实时摄像头",
    subtitle:
      "酒店、度假村、旅游局及摄像头运营商可免费提交公开风景直播流。提交后将进入审核队列。",
    webcamTitle: "摄像头名称 *",
    category: "分类 *",
    countryCity: "国家与城市 *",
    streamUrl: "官方视频流 / 嵌入地址 *",
    operator: "运营商 / 酒店名称",
    contactEmail: "联系邮箱 *",
    description: "画面内容描述 *",
    descriptionPlaceholder: "描述镜头拍摄的画面内容、可见地标、视角或最佳观看时段...",
    declaration:
      "我确认该摄像头仅拍摄公开风景画面（不含私人监控或敏感区域），且我有权授权公开嵌入展示。",
    cancel: "取消",
    submitBtn: "提交审核",
    submitting: "提交中...",
    successTitle: "提交已收到",
    successBody: "您的摄像头已进入后台审核队列，我们将核验授权与隐私合规性。",
    backHome: "返回首页",
  },
  contact: {
    eyebrow: "支持与合作",
    title: "联系 LiveCam Global",
    subtitle: "如需商务合作、归属信息更新、隐私下架申请或故障反馈，欢迎随时联系我们。",
    partnersTitle: "合作伙伴与运营商",
    partnersBody: "希望收录您的酒店、景区、城市或风景直播？可直接在线提交或发送邮件联系我们。",
    submitBtn: "提交摄像头",
    privacyTitle: "隐私与下架请求",
    privacyBody: "如需更新视频流归属、反馈隐私问题或申请立即移除某个摄像头，请直接联系我们。",
    viewPrivacy: "查看隐私政策 →",
    supportTitle: "技术与常规支持",
    supportBody: "发现画面离线、地区标签错误或播放异常？可在摄像头详情页点击反馈或给我们留言。",
    browseCams: "浏览实时摄像头 →",
    formTitle: "在线发送消息",
    formSubtitle: "填写下方表单，我们的管理员将在后台查看并回复您的邮箱。",
    yourName: "您的姓名 *",
    namePlaceholder: "例如：张三",
    yourEmail: "联系邮箱 *",
    subject: "主题 *",
    subjectPlaceholder: "商务合作、视频下架、意见反馈或技术问题",
    message: "留言内容 *",
    messagePlaceholder: "请附上相关摄像头链接（如有）以及具体说明...",
    sending: "发送中...",
    sendBtn: "发送消息",
    sentTitle: "消息发送成功",
    sentBody: "感谢您的联系！我们已收到您的留言，并将尽快通过邮件回复您。",
    sendAnother: "再发一条消息",
    includeTitle: "建议包含的信息",
    includeBody:
      "为方便我们快速处理（通常 1–2 个工作日内回复），请在消息中附上摄像头页面链接、所属机构或频道名称及详细说明。",
  },
  legal: {
    eyebrow: "法律与合规",
    privacyTitle: "隐私政策",
    privacySubtitle: "最后更新：2026年11月25日 · LiveCam Global 如何保护访客隐私并审核公开风景流。",
    termsTitle: "服务条款",
    termsSubtitle: "最后更新：2026年11月25日 · LiveCam Global 访客、运营商与合作伙伴使用规范。",
    contactPrivacy: "联系隐私团队",
    readTerms: "阅读服务条款",
    contactUs: "联系我们",
    readPrivacy: "阅读隐私政策",
    privacySections: [
      {
        title: "1. 仅收录公开风景直播流",
        body: [
          "LiveCam Global（camgl.com）是一个精选全球公开风景实时摄像头的目录平台，涵盖海滩、城市天际线、山峰、港口、野生动物栖息地与交通地标等。",
          "我们不收录私人监控摄像头、住宅画面或任何未授权视频流。所有摄像头在发布前均会经过公开景别与来源归属审核。",
        ],
      },
      {
        title: "2. 我们收集的信息",
        body: [
          "浏览 LiveCam Global 无需注册或登录账号。我们仅在浏览器本地保存最基础的功能偏好（如浅色/深色主题与界面语言选择）。",
          "当您通过 /submit 提交摄像头时，我们仅收集您填写的联系邮箱与运营商信息用于核验授权及沟通审核结果，联系邮箱绝不会在公开页面或公开 API 中暴露。",
          "当您通过 /contact 发送留言或提交视频反馈时，我们会保存提交的内容以便处理您的请求并维护目录准确性。",
        ],
      },
      {
        title: "3. 第三方播放器与外部服务",
        body: [
          "实时视频流直接由官方第三方广播方或嵌入平台提供（如采用隐私增强模式 youtube-nocookie.com 的 YouTube 嵌入、Windy、HLS 流媒体源或官方旅游门户）。",
          "页面展示的当地实时天气摘要基于城市公开经纬度通过 Open-Meteo 获取，不会发送任何个人隐私数据。",
        ],
      },
      {
        title: "4. Cookie 与数据保留",
        body: [
          "我们尽量减少 Cookie 使用，且绝不向第三方出售个人数据。托管服务仅可能出于安全防护与可用性监控临时记录匿名请求日志。",
          "您可随时联系我们申请更新或删除您的联系信息。",
        ],
      },
      {
        title: "5. 隐私与下架申请",
        body: [
          "如果您是已收录摄像头的运营方，或认为某路画面涉及隐私问题，请携带摄像头页面链接联系我们，我们将尽快核查或下架。",
        ],
      },
    ],
    termsSections: [
      {
        title: "1. 条款接受",
        body: [
          "访问或使用 LiveCam Global（camgl.com）即表示您同意遵守本服务条款。如果您不同意其中任何内容，请停止使用本网站。",
        ],
      },
      {
        title: "2. 服务性质",
        body: [
          "LiveCam Global 为全球公开可用的风景实时摄像头提供信息目录、交互式地图与官方嵌入观看入口。",
          "所有视频流、快照及商标的知识产权均归原摄像头运营商、旅游机构或广播方所有。",
        ],
      },
      {
        title: "3. 合作伙伴提交规范",
        body: [
          "通过 /submit 提交摄像头时，您需确保画面为公开风景（不含私人监控或敏感区域），且您有权许可公开嵌入展示。",
          "LiveCam Global 保留对收录内容进行审核、为清晰度微调元信息或随时下架的权利。",
        ],
      },
      {
        title: "4. 合理使用",
        body: [
          "您同意不恶意抓取、镜像、过载攻击或干扰 LiveCam Global 的 API 与管理后台，也不绕过上游视频流服务商的技术限制。",
        ],
      },
      {
        title: "5. 可用性与免责声明",
        body: [
          "实时视频流与当地天气数据按“现状”和“可用”基础提供。由于视频源来自世界各地第三方，可能随时出现临时断流或地区访问限制。",
        ],
      },
      {
        title: "6. 版权与移除请求",
        body: [
          "如果您是版权方或摄像头运营者，希望更新来源署名或移除特定摄像头，请附带页面链接与权属说明联系我们。",
        ],
      },
    ],
  },
  player: {
    unavailableTitle: "播放器暂不可用",
    unavailableBody: "该直播流可能暂时离线、存在地区限制或禁止在当前环境嵌入播放。",
    watchOriginal: "前往原官方源观看",
    connecting: "正在连接实时视频流...",
    autoRefresh: "每 15 秒自动刷新",
    refreshSnapshot: "立即刷新画面",
  },
  webcam: {
    home: "首页",
    backToDiscover: "← 返回发现页",
    localTime: "当地时间",
    liveWeather: "实时天气",
    streamStatus: "信号状态",
    sourceAttribution: "来源归属",
    officialPartner: "官方合作伙伴",
    aboutTitle: "关于 {title}",
    positionedSummary:
      "该摄像头位于 {city}（{country}，坐标 {lat}, {lng}），方便旅行者、气象爱好者和当地居民实时查看 {timezone} 时区下的天空状况、日照变化与城市实况。",
    bestTimeToWatch: "最佳观看时段",
    categoriesLabel: "所属分类：",
    categoryWebcams: "{name} 摄像头",
    allCountryCams: "全部 {country} 摄像头",
    telemetryTitle: "日照、坐标与视频流详情",
    sunriseSunset: "日出 / 日落",
    goldenHour: "黄金时段",
    coordinates: "地理坐标",
    timezone: "时区",
    streamFormat: "流媒体格式",
    originalSource: "原始来源",
    openSource: "打开原源 ↗",
    officialFeed: "官方直播流",
    faqTitle: "常见问题",
    nearbyRelated: "附近与相关摄像头",
    random: "随机漫游 →",
    daylight: "白天",
    nighttime: "夜间",
    faq1Q: "{title} 当前的天气与当地时间是多少？",
    faq1A:
      "{city}（{country}，{timezone}）当前时间为 {localTime}（{phase}），实时天气为 {weather}。今日日出约 {sunrise}，日落约 {sunset}。",
    faq2Q: "什么时候观看 {city} 的实景直播最佳？",
    faq2AWithBest: "{bestTime} 当地黄金拍摄时段通常从 {goldenHour} 左右开始。",
    faq2ADefault:
      "当地时间 {sunrise} 至 {sunset}（{timezone}）的白天光线最清晰，黄金时段约为 {goldenHour}。",
    faq3Q: "{title} 使用什么直播流格式？",
    faq3A: "该摄像头采用 {format}（{mediaType}）格式，由 {provider} 提供，系统会自动巡检可用性。",
    faq4Q: "观看 {city} 的这个实景摄像头需要付费或注册吗？",
    faq4A: "不需要。LiveCam Global 上的所有公开风景摄像头均免费免注册观看，视频均来自官方或公开授权嵌入源。",
    localizedDescription:
      "来自 {country}{city} 的「{title}」实时风景直播（分类：{categories}）。当前为{phase}（当地时间 {localTime}），实时天气 {weather}，您可免费在线观看并查看日照与气象信息。",
    bestTimeDefault:
      "当地时间 {sunrise} 至 {sunset}（{timezone}）的白天光线最清晰，黄金时段约为 {goldenHour}。",
    views: "次浏览",
  },
  countries: {
    worldExplorer: "全球地图探索",
    heroTitle: "按地图、国家与城市探索",
    heroSubtitle: "缩放、拖动地图，或点击任意标记、国家或城市即可筛选实时摄像头。",
    matchingCameras: "MapLibre GL · 共 {count} 个匹配摄像头",
    live: "直播中",
    selected: "已选中",
    openLiveStream: "观看实时画面 →",
    countriesTitle: "国家/地区 ({count})",
    showAllCountries: "显示全部国家",
    citiesIn: "{country} 的城市",
    citiesWorldwide: "全球城市",
    resetFilters: "重置全部筛选",
    matchingWebcams: "匹配的实时摄像头 ({count})",
    openSeoPage: "打开地区专题页 →",
    directoryEyebrow: "全球摄像头目录",
    directoryTitle: "按国家与城市浏览实时摄像头",
    directorySubtitle: "浏览覆盖 {countries} 个国家、{cities} 座城市的 {cams} 路已验证实景直播，附带当地实时天气与日照信息。",
    countriesBadge: "{count} 个国家",
    citiesBadge: "{count} 座城市",
    camCount: "{count} 路",
  },
  seo: {
    homeTitle: "LiveCam Global — 全球实景高清实时摄像头",
    homeTemplate: "%s | LiveCam Global",
    homeDesc:
      "免费探索全球 24/7 实景风景摄像头、当地实时天气与交互式世界地图，覆盖全球热门国家与城市。",
    countriesTitle: "按国家与城市浏览全球实时摄像头 — 地图与目录",
    countriesDesc:
      "按国家与城市浏览全球已验证的 24/7 实景摄像头，覆盖海滩、城市天际线、雪山、野生动物与港口。",
    countryTitle: "{country} 实时摄像头",
    countryDesc: "观看 {country} 各地 {count} 路已验证实景摄像头直播，同步查看当地时间与实时天气。",
    cityTitle: "{country}{city}实时摄像头",
    cityDesc: "在线观看 {country}{city} 的实时实景摄像头直播，获取当地实时天气与时间。",
    categoryTitle: "{category}实时摄像头",
    categoryDesc: "观看全球各地 24/7 {category}主题实景摄像头直播与实时天气。",
    webcamTitle: "{title}（{country}·{city}）",
    webcamDesc: "在线观看位于{country}{city}的 {title} 实景直播，查看当地时间与天气。",
    submitTitle: "提交实时摄像头",
    submitDesc: "合作伙伴与运营商入口：免费提交公开风景实时摄像头加入 LiveCam Global。",
    privacyTitle: "隐私政策",
    privacyDesc: "了解 LiveCam Global 如何保护访客隐私、规范公开风景直播嵌入与合作提交信息。",
    termsTitle: "服务条款",
    termsDesc: "了解 LiveCam Global 的服务条款、官方嵌入规范、内容归属与下架申请流程。",
    contactTitle: "联系我们",
    contactDesc: "联系 LiveCam Global 处理摄像头合作接入、隐私与下架申请或技术支持。",
  },
  categories: {
    all: "全部",
    city: "城市",
    beach: "海滩",
    nature: "自然",
    wildlife: "野生动物",
    rail: "铁路",
    ski: "滑雪",
    volcano: "火山",
    port: "港口",
    live: "直播",
  },
};

const ja: Messages = {
  nav: {
    brandSubtitle: "認証済みライブカメラ",
    searchPlaceholder: "都市・国・ランドマーク・カテゴリで検索...",
    discover: "発見",
    mapAndCountries: "地図と国",
    submit: "投稿",
    random: "ランダム",
    live: "LIVE",
  },
  footer: {
    tagline: "LiveCam Global · 公式埋め込みプラットフォーム · 無許可監視カメラ配信禁止",
    mapAndCountries: "地図と国",
    partnersAndSubmit: "パートナー・投稿",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    contact: "お問い合わせ",
  },
  home: {
    watchLive: "ライブを見る →",
    heroEyebrow: "世界をリアルタイムで探索",
    heroTitle: "認証済みの絶景ライブカメラ、現地の天気・現地時刻をログイン不要で無料視聴。",
    heroSubtitle:
      "国・都市・カテゴリから検索できます。すべての配信はライセンスとプライバシーを審査し、公式プレーヤーで30分ごとに稼働監視しています。",
    liveCams: "ライブ配信",
    countries: "国・地域",
    licensed: "公式認可",
    exploreMap: "🗺️ 地図と国を見る",
    randomCam: "🎲 ランダム視聴",
    allCategories: "すべて",
    showingWebcams: "{count} 件のカメラを表示中",
    browseByCountry: "国・都市から探す",
    browseByCountrySub: "現地時刻と天気情報付きの地域ディレクトリ",
    viewAllCountries: "すべての国を見る →",
  },
  grid: {
    loadingMore: "さらに読み込み中...",
    loadMore: "もっと見る ({loaded} / {total})",
    showingAll: "全 {count} 件のライブカメラを表示しました",
  },
  search: {
    titleDefault: "ライブカメラを検索",
    titleForQuery: "「{q}」の検索結果",
    foundCount: "{count} 件の認証済みライブカメラが見つかりました",
    noResults: "一致するカメラが見つかりませんでした。別の都市・国・カテゴリをお試しください。",
    backHome: "トップへ戻る",
  },
  submit: {
    portalEyebrow: "パートナー・運営者ポータル",
    title: "ライブカメラを投稿",
    subtitle:
      "ホテル、リゾート、観光局、カメラ運営者は公開風景ライブ配信を無料で申請できます。",
    webcamTitle: "カメラ名 *",
    category: "カテゴリ *",
    countryCity: "国と都市 *",
    streamUrl: "公式配信 / 埋め込みURL *",
    operator: "運営者・ホテル名",
    contactEmail: "連絡先メール *",
    description: "カメラ内容の説明 *",
    descriptionPlaceholder: "映っている景色、ランドマーク、視点やおすすめの時間帯などを入力...",
    declaration:
      "このカメラは公開風景のみを撮影しており（私的監視や機密エリアを含まない）、公開埋め込みを許可する権限があることを確認します。",
    cancel: "キャンセル",
    submitBtn: "審査に送信",
    submitting: "送信中...",
    successTitle: "送信を受け付けました",
    successBody: "管理者の審査キューに登録されました。ライセンスとプライバシー確認後に公開されます。",
    backHome: "ホームに戻る",
  },
  contact: {
    eyebrow: "サポート・パートナーシップ",
    title: "お問い合わせ",
    subtitle: "掲載のご相談、クレジット修正、プライバシー削除依頼、不具合報告などはこちらからご連絡ください。",
    partnersTitle: "パートナー・運営者向け",
    partnersBody: "ホテルや観光地のライブカメラ掲載をご希望の場合は、申請フォームまたはメールでご連絡ください。",
    submitBtn: "カメラを投稿",
    privacyTitle: "プライバシー・削除依頼",
    privacyBody: "配信元の表記変更やプライバシーに関するご相談、掲載削除をご希望の場合はご連絡ください。",
    viewPrivacy: "プライバシーポリシーを見る →",
    supportTitle: "技術・一般サポート",
    supportBody: "配信停止や位置情報の誤りを見つけた場合は、各カメラページの報告ボタンまたは下記フォームからお知らせください。",
    browseCams: "ライブカメラ一覧 →",
    formTitle: "メッセージを送信",
    formSubtitle: "以下のフォームにご記入ください。担当者が管理画面で確認のうえ返信いたします。",
    yourName: "お名前 *",
    namePlaceholder: "例：山田 太郎",
    yourEmail: "メールアドレス *",
    subject: "件名 *",
    subjectPlaceholder: "提携のご相談、配信削除依頼、フィードバックなど",
    message: "お問い合わせ内容 *",
    messagePlaceholder: "該当するカメラURLや詳細をご記入ください...",
    sending: "送信中...",
    sendBtn: "送信する",
    sentTitle: "送信が完了しました",
    sentBody: "お問い合わせありがとうございます。確認次第、ご入力いただいたメールアドレスへ返信いたします。",
    sendAnother: "別のメッセージを送る",
    includeTitle: "ご記入いただきたい内容",
    includeBody: "迅速な対応（通常1〜2営業日）のため、カメラページのURLや組織名・チャンネル名などをご記載ください。",
  },
  legal: {
    eyebrow: "規約とコンプライアンス",
    privacyTitle: "プライバシーポリシー",
    privacySubtitle: "最終更新: 2026年11月25日 · LiveCam Global のプライバシー保護方針。",
    termsTitle: "利用規約",
    termsSubtitle: "最終更新: 2026年11月25日 · LiveCam Global のご利用ガイドライン。",
    contactPrivacy: "プライバシー窓口へ",
    readTerms: "利用規約を読む",
    contactUs: "お問い合わせ",
    readPrivacy: "プライバシーポリシーを読む",
    privacySections: [
      {
        title: "1. 公開風景ライブ配信のみを掲載",
        body: [
          "LiveCam Global（camgl.com）は、ビーチ、街並み、山岳、港湾、野生動物など公開されている風景ライブカメラのディレクトリです。",
          "私的な監視カメラや無許可配信は掲載せず、公開前に適切な公開風景と運営元の表記を確認しています。",
        ],
      },
      {
        title: "2. 収集する情報",
        body: [
          "閲覧にアカウント登録は不要です。テーマ設定や表示言語など最小限の機能設定のみブラウザに保存します。",
          "/submit や /contact からご入力いただいた連絡先やお問い合わせ内容は、審査・返信および掲載品質の維持のためにのみ使用し、公開ページには表示しません。",
        ],
      },
      {
        title: "3. 第三者の埋め込みと外部サービス",
        body: [
          "映像配信は YouTube（youtube-nocookie.com）、Windy、HLS 配信元などの公式プレーヤーを通じて直接提供されます。",
          "現地の天気情報は都市の公開座標をもとに Open-Meteo から取得しており、個人情報は送信されません。",
        ],
      },
      {
        title: "4. プライバシー・削除依頼",
        body: [
          "掲載カメラの運営者様やプライバシーに関する削除をご希望の場合は、該当URLを添えてお問い合わせください。速やかに対応いたします。",
        ],
      },
    ],
    termsSections: [
      {
        title: "1. 規約への同意",
        body: [
          "LiveCam Global（camgl.com）を利用することで、本利用規約に同意したものとみなされます。",
        ],
      },
      {
        title: "2. サービスの性質",
        body: [
          "当サイトは公開ライブカメラのディレクトリおよび公式埋め込みビューアを提供します。映像・商標等の権利は各運営元に帰属します。",
        ],
      },
      {
        title: "3. 投稿ガイドラインと免責事項",
        body: [
          "/submit からの申請は公開風景カメラかつ埋め込み許可のあるものに限ります。配信状況は外部提供元に依存するため、一時的な停止や地域制限が生じる場合があります。",
        ],
      },
    ],
  },
  player: {
    unavailableTitle: "プレーヤーを利用できません",
    unavailableBody: "この配信は一時的にオフライン、地域制限、または埋め込みがブロックされている可能性があります。",
    watchOriginal: "公式配信元で見る",
    connecting: "ライブ配信に接続中...",
    autoRefresh: "15秒ごとに自動更新",
    refreshSnapshot: "画像を更新",
  },
  webcam: {
    home: "ホーム",
    backToDiscover: "← 発見へ戻る",
    localTime: "現地時刻",
    liveWeather: "現地の天気",
    streamStatus: "配信ステータス",
    sourceAttribution: "配信元",
    officialPartner: "公式パートナー",
    aboutTitle: "{title} について",
    positionedSummary:
      "{city}（{country}、{lat}, {lng}）に設置されており、{timezone} タイムゾーンの空模様、日照状況、街の様子をリアルタイムで確認できます。",
    bestTimeToWatch: "おすすめの時間帯",
    categoriesLabel: "カテゴリ：",
    categoryWebcams: "{name} カメラ",
    allCountryCams: "{country} のカメラ一覧",
    telemetryTitle: "日照・座標・配信詳細",
    sunriseSunset: "日の出 / 日の入り",
    goldenHour: "ゴールデンアワー",
    coordinates: "座標",
    timezone: "タイムゾーン",
    streamFormat: "配信形式",
    originalSource: "公式ソース",
    openSource: "配信元を開く ↗",
    officialFeed: "公式フィード",
    faqTitle: "よくある質問",
    nearbyRelated: "周辺・関連カメラ",
    random: "ランダム →",
    daylight: "日中",
    nighttime: "夜間",
    faq1Q: "{title} の現在の天気と現地時刻は？",
    faq1A:
      "{city}（{country}・{timezone}）の現地時刻は現在 {localTime}（{phase}）、天気は {weather} です。本日の日の出は {sunrise} 頃、日の入りは {sunset} 頃です。",
    faq2Q: "{city} のライブ映像を見るベストタイムは？",
    faq2AWithBest: "{bestTime} ゴールデンアワーは現地時間 {goldenHour} 頃に始まります。",
    faq2ADefault:
      "日の出（{sunrise}）から日の入り（{sunset}）までの時間帯が最も鮮明で、ゴールデンアワーは {goldenHour} 頃です。",
    faq3Q: "{title} の配信形式は何ですか？",
    faq3A: "{provider} 提供の {format}（{mediaType}）形式で配信されており、稼働状況は自動監視されています。",
    faq4Q: "この {city} のライブカメラは無料で視聴できますか？",
    faq4A: "はい。LiveCam Global の公開風景カメラは登録不要で無料視聴できます。",
    localizedDescription:
      "{country}・{city} の「{title}」ライブカメラ映像です（カテゴリ：{categories}）。現在の現地時刻は {localTime}（{phase}）、天気は {weather} です。登録不要・無料でリアルタイムの風景や日照状況をご覧いただけます。",
    bestTimeDefault:
      "日の出（{sunrise}）から日の入り（{sunset}・{timezone}）までの日中が最も見やすく、ゴールデンアワーは {goldenHour} 頃です。",
    views: "回閲覧",
  },
  countries: {
    worldExplorer: "ワールドエクスプローラー",
    heroTitle: "地図・国・都市から探す",
    heroSubtitle: "地図のピン、国、または都市をクリックしてライブ配信を絞り込めます。",
    matchingCameras: "MapLibre GL · {count} 件のカメラが一致",
    live: "ライブ",
    selected: "選択中",
    openLiveStream: "ライブ配信を開く →",
    countriesTitle: "国・地域 ({count})",
    showAllCountries: "すべての国を表示",
    citiesIn: "{country} の都市",
    citiesWorldwide: "世界の都市",
    resetFilters: "フィルターをリセット",
    matchingWebcams: "一致するライブカメラ ({count})",
    openSeoPage: "地域ディレクトリページを開く →",
    directoryEyebrow: "グローバル・ウェブカメラディレクトリ",
    directoryTitle: "国・都市別のライブカメラ一覧",
    directorySubtitle: "{countries} か国・{cities} 都市の {cams} 件の認証済みライブ配信を現地の天気・時刻とともに探索できます。",
    countriesBadge: "{count} か国",
    citiesBadge: "{count} 都市",
    camCount: "{count} 件",
  },
  seo: {
    homeTitle: "LiveCam Global — 世界の認証済みライブカメラ",
    homeTemplate: "%s | LiveCam Global",
    homeDesc:
      "世界中の24時間ライブカメラ、現地の天気、インタラクティブ世界地図を無料で探索できます。",
    countriesTitle: "国・都市別ライブカメラ — 世界ディレクトリ＆マップ",
    countriesDesc:
      "インタラクティブな世界地図から国・都市別にライブカメラを検索。ビーチ、街並み、山、自然、港湾の映像を視聴できます。",
    countryTitle: "{country} のライブカメラ",
    countryDesc: "{country} 各地の認証済みライブカメラ {count} 件を現地の天気・時刻とともに視聴。",
    cityTitle: "{city}（{country}）のライブカメラ",
    cityDesc: "{country} {city} のライブカメラを現地の天気・時刻とともにリアルタイム視聴。",
    categoryTitle: "{category} ライブカメラ",
    categoryDesc: "世界中の24時間 {category} ライブカメラと現地の天気をリアルタイムで視聴。",
    webcamTitle: "{title}（{city}・{country}）",
    webcamDesc: "{country} {city} の {title} ライブ映像。現地時刻と天気も確認できます。",
    submitTitle: "ライブカメラを投稿",
    submitDesc: "LiveCam Global へ公開風景ライブカメラを無料登録するためのパートナー申請ページ。",
    privacyTitle: "プライバシーポリシー",
    privacyDesc: "LiveCam Global のプライバシー保護方針と公開ライブカメラの取り扱いについて。",
    termsTitle: "利用規約",
    termsDesc: "LiveCam Global の利用規約、公式埋め込み・権利表記・削除依頼について。",
    contactTitle: "お問い合わせ",
    contactDesc: "ライブカメラの提携、配信削除・プライバシーに関するお問い合わせ窓口。",
  },
  categories: {
    all: "すべて",
    city: "都市",
    beach: "ビーチ",
    nature: "自然",
    wildlife: "野生動物",
    rail: "鉄道",
    ski: "スキー",
    volcano: "火山",
    port: "港湾",
    live: "ライブ",
  },
};

const es: Messages = {
  nav: {
    brandSubtitle: "Vistas en Vivo Verificadas",
    searchPlaceholder: "Buscar ciudad, país, lugar o categoría...",
    discover: "Descubrir",
    mapAndCountries: "Mapa y Países",
    submit: "Enviar",
    random: "Aleatorio",
    live: "EN VIVO",
  },
  footer: {
    tagline: "LiveCam Global · Plataforma oficial de cámaras en vivo · Sin vigilancia no autorizada.",
    mapAndCountries: "Mapa y Países",
    partnersAndSubmit: "Socios y Envío",
    privacy: "Privacidad",
    terms: "Términos",
    contact: "Contacto",
  },
  home: {
    watchLive: "Ver en Vivo →",
    heroEyebrow: "Explora el Mundo en Tiempo Real",
    heroTitle: "Cámaras panorámicas verificadas, clima local y zona horaria en vivo — gratis y sin registro.",
    heroSubtitle:
      "Navega por país, ciudad o categoría. Cada transmisión se revisa por licencia y privacidad y se supervisa cada 30 minutos.",
    liveCams: "Cámaras",
    countries: "Países",
    licensed: "Autorizadas",
    exploreMap: "🗺️ Explorar Mapa y Países",
    randomCam: "🎲 Cámara Aleatoria",
    allCategories: "Todas",
    showingWebcams: "Mostrando {count} cámaras",
    browseByCountry: "Explorar por País y Ciudad",
    browseByCountrySub: "Directorios con hora local y clima en tiempo real",
    viewAllCountries: "Ver todos los países →",
  },
  grid: {
    loadingMore: "Cargando más cámaras...",
    loadMore: "Cargar más ({loaded} / {total})",
    showingAll: "Mostrando las {count} cámaras en vivo",
  },
  search: {
    titleDefault: "Buscar Cámaras en Vivo",
    titleForQuery: 'Resultados para "{q}"',
    foundCount: "Se encontraron {count} cámaras en vivo verificadas",
    noResults: "No se encontraron cámaras. Prueba otra ciudad, país o categoría.",
    backHome: "Volver a Descubrir",
  },
  submit: {
    portalEyebrow: "Portal de Socios y Operadores",
    title: "Enviar una Cámara en Vivo",
    subtitle:
      "Hoteles, resorts, oficinas de turismo y operadores pueden enviar transmisiones públicas gratuitas para revisión.",
    webcamTitle: "Título de la Cámara *",
    category: "Categoría *",
    countryCity: "País y Ciudad *",
    streamUrl: "URL Oficial / Embed *",
    operator: "Operador / Hotel",
    contactEmail: "Correo de Contacto *",
    description: "Descripción *",
    descriptionPlaceholder: "Describe qué muestra la cámara, lugares visibles o mejor hora para ver...",
    declaration:
      "Confirmo que esta cámara muestra una vista pública panorámica (sin vigilancia privada) y tengo autorización para su inserción pública.",
    cancel: "Cancelar",
    submitBtn: "Enviar para Revisión",
    submitting: "Enviando...",
    successTitle: "Envío Recibido",
    successBody: "Tu cámara pasó a la cola de revisión para verificar licencia y privacidad.",
    backHome: "Volver al Inicio",
  },
  contact: {
    eyebrow: "Soporte y Alianzas",
    title: "Contactar a LiveCam Global",
    subtitle: "Escríbenos para alianzas, atribución, privacidad o reportes técnicos.",
    partnersTitle: "Socios y Operadores",
    partnersBody: "¿Deseas incluir tu cámara turística o de hotel? Envíala directamente o escríbenos.",
    submitBtn: "Enviar Cámara",
    privacyTitle: "Privacidad y Retiro",
    privacyBody: "¿Necesitas actualizar créditos o solicitar la retirada inmediata de una cámara?",
    viewPrivacy: "Ver Política de Privacidad →",
    supportTitle: "Soporte Técnico",
    supportBody: "¿Detectaste una transmisión caída o etiqueta incorrecta? Usa el botón Reportar o escríbenos.",
    browseCams: "Ver Cámaras en Vivo →",
    formTitle: "Envíanos un Mensaje",
    formSubtitle: "Completa el formulario y nuestro equipo revisará tu consulta en el panel.",
    yourName: "Tu Nombre *",
    namePlaceholder: "ej., Alex Morgan",
    yourEmail: "Correo Electrónico *",
    subject: "Asunto *",
    subjectPlaceholder: "Alianza, retiro de transmisión, comentario o soporte",
    message: "Mensaje *",
    messagePlaceholder: "Incluye la URL de la cámara (si aplica) y los detalles...",
    sending: "Enviando...",
    sendBtn: "Enviar Mensaje",
    sentTitle: "Mensaje Enviado",
    sentBody: "¡Gracias por escribirnos! Responderemos a tu correo lo antes posible.",
    sendAnother: "Enviar Otro Mensaje",
    includeTitle: "Qué Incluir en tu Mensaje",
    includeBody: "Para responderte en 1–2 días hábiles, incluye la URL de la cámara y el nombre de tu organización.",
  },
  legal: {
    eyebrow: "Legal y Cumplimiento",
    privacyTitle: "Política de Privacidad",
    privacySubtitle: "Última actualización: 25 de noviembre de 2026 · Cómo protegemos la privacidad en LiveCam Global.",
    termsTitle: "Términos de Servicio",
    termsSubtitle: "Última actualización: 25 de noviembre de 2026 · Normas de uso para visitantes y operadores.",
    contactPrivacy: "Contactar Privacidad",
    readTerms: "Leer Términos",
    contactUs: "Contáctanos",
    readPrivacy: "Leer Privacidad",
    privacySections: [
      {
        title: "1. Solo Transmisiones Escénicas Públicas",
        body: [
          "LiveCam Global (camgl.com) es un directorio de cámaras públicas panorámicas (playas, ciudades, montañas, puertos y fauna). No alojamos cámaras privadas de vigilancia.",
        ],
      },
      {
        title: "2. Información que Recopilamos",
        body: [
          "No necesitas cuenta para navegar. Solo guardamos tu preferencia de tema e idioma en el navegador, y los datos enviados voluntariamente en /submit o /contact para responderte.",
        ],
      },
      {
        title: "3. Reproductores Externos y Privacidad",
        body: [
          "Los videos se reproducen desde proveedores oficiales (YouTube youtube-nocookie.com, Windy, HLS) y el clima proviene de Open-Meteo usando coordenadas públicas. Contáctanos si deseas retirar una cámara.",
        ],
      },
    ],
    termsSections: [
      {
        title: "1. Aceptación y Naturaleza del Servicio",
        body: [
          "Al usar LiveCam Global aceptas estos términos. Todas las transmisiones y marcas pertenecen a sus respectivos operadores y emisoras.",
        ],
      },
      {
        title: "2. Envíos y Disponibilidad",
        body: [
          "Los envíos en /submit deben ser vistas públicas autorizadas. Las transmisiones se ofrecen tal cual y pueden sufrir interrupciones externas.",
        ],
      },
    ],
  },
  player: {
    unavailableTitle: "Reproductor no disponible",
    unavailableBody:
      "Esta transmisión puede estar temporalmente fuera de línea, restringida por región o bloqueada para inserción.",
    watchOriginal: "Ver en Fuente Original",
    connecting: "Conectando transmisión en vivo...",
    autoRefresh: "Auto-actualización 15s",
    refreshSnapshot: "Actualizar imagen",
  },
  webcam: {
    home: "Inicio",
    backToDiscover: "← Volver a Descubrir",
    localTime: "Hora Local",
    liveWeather: "Clima en Vivo",
    streamStatus: "Estado",
    sourceAttribution: "Fuente",
    officialPartner: "Socio Oficial",
    aboutTitle: "Acerca de {title}",
    positionedSummary:
      "Ubicada en {city}, {country} ({lat}, {lng}), esta cámara en vivo permite ver el cielo, la luz del día y la actividad en tiempo real en la zona horaria {timezone}.",
    bestTimeToWatch: "Mejor Hora para Ver",
    categoriesLabel: "Categorías:",
    categoryWebcams: "Cámaras de {name}",
    allCountryCams: "Todas en {country}",
    telemetryTitle: "Luz Solar, Coordenadas y Detalles",
    sunriseSunset: "Amanecer / Atardecer",
    goldenHour: "Hora Dorada",
    coordinates: "Coordenadas",
    timezone: "Zona Horaria",
    streamFormat: "Formato",
    originalSource: "Fuente Original",
    openSource: "Abrir Fuente ↗",
    officialFeed: "Transmisión Oficial",
    faqTitle: "Preguntas Frecuentes",
    nearbyRelated: "Cercanas y Relacionadas",
    random: "Aleatorio →",
    daylight: "Día",
    nighttime: "Noche",
    faq1Q: "¿Cuál es el clima y la hora local actual en {title}?",
    faq1A:
      "La hora local en {city}, {country} ({timezone}) es {localTime} ({phase}), con clima {weather}. Hoy amanece sobre las {sunrise} y anochece sobre las {sunset}.",
    faq2Q: "¿Cuándo es mejor ver {city} en vivo?",
    faq2AWithBest: "{bestTime} La hora dorada suele comenzar sobre las {goldenHour} hora local.",
    faq2ADefault:
      "Entre {sunrise} y {sunset} ({timezone}) ofrece la mejor visibilidad, con la hora dorada alrededor de {goldenHour}.",
    faq3Q: "¿Qué formato de transmisión usa {title}?",
    faq3A: "Transmite vía {format} ({mediaType}) provisto por {provider}, con monitoreo automático.",
    faq4Q: "¿Es gratis ver esta cámara en vivo de {city}?",
    faq4A: "Sí, todas las cámaras públicas en LiveCam Global son gratuitas y sin registro.",
    localizedDescription:
      "Transmisión en vivo de {title} desde {city}, {country} ({categories}). Hora local actual: {localTime} ({phase}), clima: {weather}. Disfruta de esta vista panorámica gratuita en tiempo real.",
    bestTimeDefault:
      "Entre {sunrise} y {sunset} ({timezone}) ofrece la mejor visibilidad, con la hora dorada alrededor de {goldenHour}.",
    views: "vistas",
  },
  countries: {
    worldExplorer: "Explorador Mundial",
    heroTitle: "Explorar por Mapa, País y Ciudad",
    heroSubtitle: "Haz zoom o pulsa en cualquier marcador, país o ciudad para filtrar transmisiones en vivo.",
    matchingCameras: "MapLibre GL · {count} cámaras coincidentes",
    live: "En vivo",
    selected: "Seleccionada",
    openLiveStream: "Abrir Transmisión →",
    countriesTitle: "Países ({count})",
    showAllCountries: "Mostrar todos los países",
    citiesIn: "Ciudades en {country}",
    citiesWorldwide: "Ciudades del Mundo",
    resetFilters: "Restablecer filtros",
    matchingWebcams: "Cámaras en Vivo ({count})",
    openSeoPage: "Abrir página del directorio →",
    directoryEyebrow: "Directorio Global de Cámaras",
    directoryTitle: "Explorar Cámaras por País y Ciudad",
    directorySubtitle: "Explora {cams} transmisiones verificadas en {countries} países y {cities} ciudades con clima y luz solar en tiempo real.",
    countriesBadge: "{count} Países",
    citiesBadge: "{count} Ciudades",
    camCount: "{count} cám.",
  },
  seo: {
    homeTitle: "LiveCam Global — Cámaras en Vivo Verificadas del Mundo",
    homeTemplate: "%s | LiveCam Global",
    homeDesc:
      "Explora cámaras panorámicas en vivo 24/7, clima local en tiempo real y mapa mundial por países y ciudades.",
    countriesTitle: "Cámaras en Vivo por País y Ciudad — Directorio y Mapa",
    countriesDesc:
      "Explora cámaras verificadas 24/7 por país y ciudad en un mapa interactivo mundial.",
    countryTitle: "Cámaras en Vivo en {country}",
    countryDesc: "Mira {count} cámaras en vivo verificadas en {country} con clima y hora local.",
    cityTitle: "Cámaras en Vivo en {city}, {country}",
    cityDesc: "Mira cámaras en vivo en {city}, {country} con clima y hora local en tiempo real.",
    categoryTitle: "Cámaras en Vivo de {category}",
    categoryDesc: "Mira cámaras en vivo 24/7 de {category} de todo el mundo con clima en tiempo real.",
    webcamTitle: "{title} ({city}, {country})",
    webcamDesc: "Mira {title} en vivo desde {city}, {country} con hora local y clima.",
    submitTitle: "Enviar una Cámara en Vivo",
    submitDesc: "Portal para socios y operadores para enviar cámaras públicas gratuitas a LiveCam Global.",
    privacyTitle: "Política de Privacidad",
    privacyDesc: "Cómo protege LiveCam Global la privacidad y revisa las transmisiones públicas.",
    termsTitle: "Términos de Servicio",
    termsDesc: "Términos de servicio para visitantes, operadores y socios de LiveCam Global.",
    contactTitle: "Contáctanos",
    contactDesc: "Contacta con LiveCam Global para alianzas, privacidad o soporte técnico.",
  },
  categories: {
    all: "Todas",
    city: "Ciudad",
    beach: "Playa",
    nature: "Naturaleza",
    wildlife: "Fauna",
    rail: "Ferrocarril",
    ski: "Esquí",
    volcano: "Volcán",
    port: "Puerto",
    live: "En vivo",
  },
};

const fr: Messages = {
  nav: {
    brandSubtitle: "Vues en Direct Vérifiées",
    searchPlaceholder: "Rechercher ville, pays, lieu ou catégorie...",
    discover: "Découvrir",
    mapAndCountries: "Carte & Pays",
    submit: "Soumettre",
    random: "Aléatoire",
    live: "DIRECT",
  },
  footer: {
    tagline: "LiveCam Global · Plateforme officielle d'intégration · Aucune surveillance non autorisée.",
    mapAndCountries: "Carte & Pays",
    partnersAndSubmit: "Partenaires & Soumission",
    privacy: "Confidentialité",
    terms: "Conditions",
    contact: "Contact",
  },
  home: {
    watchLive: "Voir en Direct →",
    heroEyebrow: "Explorez le Monde en Temps Réel",
    heroTitle: "Webcams panoramiques vérifiées, météo locale et fuseaux horaires — gratuit, sans inscription.",
    heroSubtitle:
      "Parcourez par pays, ville ou catégorie. Chaque flux est vérifié pour sa licence et sa confidentialité, puis contrôlé toutes les 30 minutes.",
    liveCams: "Webcams",
    countries: "Pays",
    licensed: "Autorisées",
    exploreMap: "🗺️ Explorer Carte & Pays",
    randomCam: "🎲 Webcam Aléatoire",
    allCategories: "Toutes",
    showingWebcams: "{count} webcams affichées",
    browseByCountry: "Parcourir par Pays & Ville",
    browseByCountrySub: "Répertoire avec heure locale et météo en direct",
    viewAllCountries: "Voir tous les pays →",
  },
  grid: {
    loadingMore: "Chargement...",
    loadMore: "Charger plus ({loaded} / {total})",
    showingAll: "Toutes les {count} webcams affichées",
  },
  search: {
    titleDefault: "Rechercher des Webcams",
    titleForQuery: 'Résultats pour "{q}"',
    foundCount: "{count} webcams en direct vérifiées trouvées",
    noResults: "Aucune webcam trouvée. Essayez une autre ville, un pays ou une catégorie.",
    backHome: "Retour à Découvrir",
  },
  submit: {
    portalEyebrow: "Portail Partenaires & Opérateurs",
    title: "Soumettre une Webcam en Direct",
    subtitle:
      "Hôtels, offices de tourisme et opérateurs peuvent soumettre gratuitement leurs flux publics panoramiques.",
    webcamTitle: "Titre de la Webcam *",
    category: "Catégorie *",
    countryCity: "Pays & Ville *",
    streamUrl: "URL Officielle / Embed *",
    operator: "Opérateur / Hôtel",
    contactEmail: "E-mail de Contact *",
    description: "Description *",
    descriptionPlaceholder: "Décrivez la vue, les monuments visibles ou le meilleur moment pour regarder...",
    declaration:
      "Je confirme que cette caméra filme une vue publique panoramique (sans surveillance privée) et que j'ai l'autorisation d'intégration.",
    cancel: "Annuler",
    submitBtn: "Soumettre",
    submitting: "Envoi...",
    successTitle: "Soumission Reçue",
    successBody: "Votre webcam est en file d'attente pour vérification de licence et de confidentialité.",
    backHome: "Retour à l'Accueil",
  },
  contact: {
    eyebrow: "Support & Partenariats",
    title: "Contacter LiveCam Global",
    subtitle: "Contactez-nous pour un partenariat, une attribution, la confidentialité ou un signalement.",
    partnersTitle: "Partenaires & Opérateurs",
    partnersBody: "Vous souhaitez référencer votre webcam touristique ? Soumettez-la ou écrivez-nous.",
    submitBtn: "Soumettre une Webcam",
    privacyTitle: "Confidentialité & Retrait",
    privacyBody: "Besoin de mettre à jour une source ou de demander le retrait immédiat d'une caméra ?",
    viewPrivacy: "Voir la Confidentialité →",
    supportTitle: "Support Technique",
    supportBody: "Flux hors ligne ou erreur de lieu ? Utilisez le bouton Signaler ou écrivez-nous.",
    browseCams: "Parcourir les Webcams →",
    formTitle: "Envoyer un Message",
    formSubtitle: "Remplissez le formulaire ci-dessous et notre équipe vous répondra rapidement.",
    yourName: "Votre Nom *",
    namePlaceholder: "ex. : Alex Morgan",
    yourEmail: "Votre E-mail *",
    subject: "Sujet *",
    subjectPlaceholder: "Partenariat, retrait de flux, avis ou support technique",
    message: "Message *",
    messagePlaceholder: "Indiquez l'URL de la webcam (si applicable) et les détails...",
    sending: "Envoi...",
    sendBtn: "Envoyer",
    sentTitle: "Message Envoyé",
    sentBody: "Merci ! Notre équipe a bien reçu votre message et vous répondra par e-mail.",
    sendAnother: "Envoyer un Autre Message",
    includeTitle: "Informations Utiles",
    includeBody: "Pour une réponse sous 1 à 2 jours ouvrés, incluez l'URL de la webcam et le nom de votre organisation.",
  },
  legal: {
    eyebrow: "Légal & Conformité",
    privacyTitle: "Politique de Confidentialité",
    privacySubtitle: "Dernière mise à jour : 25 novembre 2026 · Protection des données sur LiveCam Global.",
    termsTitle: "Conditions d'Utilisation",
    termsSubtitle: "Dernière mise à jour : 25 novembre 2026 · Règles d'utilisation pour visiteurs et partenaires.",
    contactPrivacy: "Contacter l'Équipe",
    readTerms: "Lire les Conditions",
    contactUs: "Nous Contacter",
    readPrivacy: "Lire la Confidentialité",
    privacySections: [
      {
        title: "1. Flux Panoramiques Publics Uniquement",
        body: [
          "LiveCam Global (camgl.com) référence uniquement des webcams panoramiques publiques (plages, villes, montagnes, ports, faune). Aucune caméra de surveillance privée n'est hébergée.",
        ],
      },
      {
        title: "2. Données Collectées",
        body: [
          "Aucune inscription requise. Nous mémorisons seulement votre thème et votre langue, ainsi que les informations transmises via /submit ou /contact pour traiter votre demande.",
        ],
      },
      {
        title: "3. Lecteurs Tiers & Retrait",
        body: [
          "Les flux proviennent directement des diffuseurs officiels (YouTube youtube-nocookie.com, Windy, HLS) et la météo via Open-Meteo. Contactez-nous pour toute demande de retrait.",
        ],
      },
    ],
    termsSections: [
      {
        title: "1. Acceptation et Propriété",
        body: [
          "En utilisant LiveCam Global, vous acceptez ces conditions. Tous les flux vidéo et marques restent la propriété de leurs opérateurs respectifs.",
        ],
      },
      {
        title: "2. Soumissions et Disponibilité",
        body: [
          "Toute soumission via /submit doit concerner une vue publique autorisée. Les flux sont fournis en l'état et peuvent subir des coupures externes.",
        ],
      },
    ],
  },
  player: {
    unavailableTitle: "Lecteur indisponible",
    unavailableBody:
      "Ce flux est peut-être temporairement hors ligne, géo-restreint ou bloqué pour l'intégration.",
    watchOriginal: "Voir sur la Source Officielle",
    connecting: "Connexion au flux en direct...",
    autoRefresh: "Actualisation 15s",
    refreshSnapshot: "Actualiser l'image",
  },
  webcam: {
    home: "Accueil",
    backToDiscover: "← Retour à Découvrir",
    localTime: "Heure Locale",
    liveWeather: "Météo en Direct",
    streamStatus: "Statut",
    sourceAttribution: "Source",
    officialPartner: "Partenaire Officiel",
    aboutTitle: "À propos de {title}",
    positionedSummary:
      "Située à {city}, {country} ({lat}, {lng}), cette webcam permet d'observer le ciel, la lumière du jour et l'activité en direct dans le fuseau horaire {timezone}.",
    bestTimeToWatch: "Meilleur Moment",
    categoriesLabel: "Catégories :",
    categoryWebcams: "Webcams {name}",
    allCountryCams: "Toutes en {country}",
    telemetryTitle: "Ensoleillement, Coordonnées & Flux",
    sunriseSunset: "Lever / Coucher du soleil",
    goldenHour: "Heure Dorée",
    coordinates: "Coordonnées",
    timezone: "Fuseau Horaire",
    streamFormat: "Format du Flux",
    originalSource: "Source Originale",
    openSource: "Ouvrir la Source ↗",
    officialFeed: "Flux Officiel",
    faqTitle: "Questions Fréquentes",
    nearbyRelated: "À Proximité & Similaires",
    random: "Aléatoire →",
    daylight: "Jour",
    nighttime: "Nuit",
    faq1Q: "Quelle est la météo et l'heure locale à {title} ?",
    faq1A:
      "L'heure locale à {city}, {country} ({timezone}) est {localTime} ({phase}), avec une météo {weather}. Lever du soleil vers {sunrise} et coucher vers {sunset}.",
    faq2Q: "Quel est le meilleur moment pour regarder {city} en direct ?",
    faq2AWithBest: "{bestTime} L'heure dorée débute généralement vers {goldenHour} heure locale.",
    faq2ADefault:
      "Les heures de jour entre {sunrise} et {sunset} ({timezone}) offrent la meilleure visibilité, avec l'heure dorée vers {goldenHour}.",
    faq3Q: "Quel format de flux utilise {title} ?",
    faq3A: "Ce flux utilise {format} ({mediaType}) fourni par {provider}, surveillé automatiquement.",
    faq4Q: "Cette webcam de {city} est-elle gratuite ?",
    faq4A: "Oui, toutes les webcams panoramiques publiques sur LiveCam Global sont gratuites et sans inscription.",
    localizedDescription:
      "Vue en direct de {title} depuis {city}, {country} ({categories}). Heure locale actuelle : {localTime} ({phase}), météo : {weather}. Profitez gratuitement de ce panorama en temps réel.",
    bestTimeDefault:
      "Les heures de jour entre {sunrise} et {sunset} ({timezone}) offrent la meilleure visibilité, avec l'heure dorée vers {goldenHour}.",
    views: "vues",
  },
  countries: {
    worldExplorer: "Explorateur Mondial",
    heroTitle: "Explorer par Carte, Pays & Ville",
    heroSubtitle: "Zoomez ou cliquez sur un marqueur, un pays ou une ville pour filtrer les flux en direct.",
    matchingCameras: "MapLibre GL · {count} caméras correspondantes",
    live: "En direct",
    selected: "Sélectionnée",
    openLiveStream: "Voir le Direct →",
    countriesTitle: "Pays ({count})",
    showAllCountries: "Afficher tous les pays",
    citiesIn: "Villes en {country}",
    citiesWorldwide: "Villes du Monde",
    resetFilters: "Réinitialiser les filtres",
    matchingWebcams: "Webcams en Direct ({count})",
    openSeoPage: "Ouvrir la page du répertoire →",
    directoryEyebrow: "Répertoire Mondial de Webcams",
    directoryTitle: "Parcourir les Webcams par Pays & Ville",
    directorySubtitle: "Explorez {cams} flux vérifiés dans {countries} pays et {cities} villes avec météo locale et ensoleillement en direct.",
    countriesBadge: "{count} Pays",
    citiesBadge: "{count} Villes",
    camCount: "{count} cams",
  },
  seo: {
    homeTitle: "LiveCam Global — Webcams en Direct Vérifiées dans le Monde",
    homeTemplate: "%s | LiveCam Global",
    homeDesc:
      "Explorez des webcams panoramiques en direct 24/7, la météo locale en temps réel et la carte du monde.",
    countriesTitle: "Webcams en Direct par Pays & Ville — Répertoire & Carte",
    countriesDesc:
      "Parcourez des webcams vérifiées 24/7 par pays et ville sur une carte interactive mondiale.",
    countryTitle: "Webcams en Direct — {country}",
    countryDesc: "Regardez {count} webcams en direct vérifiées en {country} avec météo et heure locale.",
    cityTitle: "Webcams en Direct à {city}, {country}",
    cityDesc: "Regardez des webcams en direct à {city}, {country} avec météo et heure locale.",
    categoryTitle: "Webcams en Direct {category}",
    categoryDesc: "Regardez des webcams 24/7 {category} du monde entier avec météo en temps réel.",
    webcamTitle: "{title} ({city}, {country})",
    webcamDesc: "Regardez {title} en direct depuis {city}, {country} avec heure locale et météo.",
    submitTitle: "Soumettre une Webcam en Direct",
    submitDesc: "Portail partenaires pour soumettre gratuitement vos webcams publiques sur LiveCam Global.",
    privacyTitle: "Politique de Confidentialité",
    privacyDesc: "Comment LiveCam Global protège la vie privée et examine les flux publics.",
    termsTitle: "Conditions d'Utilisation",
    termsDesc: "Conditions d'utilisation pour les visiteurs, opérateurs et partenaires de LiveCam Global.",
    contactTitle: "Nous Contacter",
    contactDesc: "Contactez LiveCam Global pour un partenariat, un retrait ou le support technique.",
  },
  categories: {
    all: "Toutes",
    city: "Ville",
    beach: "Plage",
    nature: "Nature",
    wildlife: "Faune",
    rail: "Train",
    ski: "Ski",
    volcano: "Volcan",
    port: "Port",
    live: "Direct",
  },
};

const DICTIONARIES: Record<Locale, Messages> = { en, zh, ja, es, fr };

export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale] ?? en;
}

export { getCountryLabel, getCityLabel } from "./geo-i18n";

export function stripLocalePrefix(pathname: string): { locale: Locale; path: string } {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = clean.split("/");
  const first = segments[1]?.toLowerCase();
  if (first && first !== DEFAULT_LOCALE && (SUPPORTED_LOCALES as readonly string[]).includes(first)) {
    const rest = "/" + segments.slice(2).join("/");
    return { locale: first as Locale, path: rest === "/" ? "/" : rest.replace(/\/+$/, "") || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: clean };
}

export function localizePath(path: string, locale: Locale): string {
  const { path: barePath } = stripLocalePrefix(path);
  if (locale === DEFAULT_LOCALE) return barePath;
  return barePath === "/" ? `/${locale}` : `/${locale}${barePath}`;
}

export function getCategoryLabel(
  locale: Locale,
  slug: string,
  fallback?: string
): string {
  const key = slug.toLowerCase().trim();
  const dict = getMessages(locale).categories;
  return dict[key] ?? en.categories[key] ?? fallback ?? slug;
}

export function formatMessage(
  template: string,
  vars: Record<string, string | number>
): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{${key}}`, String(val)),
    template
  );
}

const WEATHER_LABELS: Record<string, Partial<Record<Locale, string>>> = {
  Clear: { zh: "晴朗", ja: "快晴", es: "Despejado", fr: "Dégagé" },
  "Mostly Clear": { zh: "大部晴朗", ja: "晴れ", es: "Mayormente despejado", fr: "Plutôt dégagé" },
  "Partly Cloudy": { zh: "局部多云", ja: "晴れ時々曇り", es: "Parcialmente nublado", fr: "Partiellement nuageux" },
  Overcast: { zh: "阴天", ja: "曇り", es: "Nublado", fr: "Couvert" },
  Cloudy: { zh: "多云", ja: "曇り", es: "Nublado", fr: "Nuageux" },
  Sunny: { zh: "晴天", ja: "晴れ", es: "Soleado", fr: "Ensoleillé" },
  Breezy: { zh: "微风", ja: "風あり", es: "Ventoso", fr: "Venteux" },
  Fair: { zh: "晴好", ja: "穏やか", es: "Agradable", fr: "Clément" },
  Fog: { zh: "有雾", ja: "霧", es: "Niebla", fr: "Brouillard" },
  "Rime Fog": { zh: "冻雾", ja: "着氷性の霧", es: "Niebla helada", fr: "Brouillard givrant" },
  "Light Drizzle": { zh: "小毛毛雨", ja: "弱い霧雨", es: "Llovizna ligera", fr: "Bruine légère" },
  Drizzle: { zh: "毛毛雨", ja: "霧雨", es: "Llovizna", fr: "Bruine" },
  "Dense Drizzle": { zh: "浓毛毛雨", ja: "濃い霧雨", es: "Llovizna intensa", fr: "Bruine dense" },
  "Freezing Drizzle": { zh: "冻毛毛雨", ja: "着氷性の霧雨", es: "Llovizna helada", fr: "Bruine verglaçante" },
  "Light Rain": { zh: "小雨", ja: "小雨", es: "Lluvia ligera", fr: "Pluie légère" },
  Rain: { zh: "降雨", ja: "雨", es: "Lluvia", fr: "Pluie" },
  "Heavy Rain": { zh: "大雨", ja: "大雨", es: "Lluvia intensa", fr: "Forte pluie" },
  "Freezing Rain": { zh: "冻雨", ja: "着氷性の雨", es: "Lluvia helada", fr: "Pluie verglaçante" },
  "Light Snow": { zh: "小雪", ja: "小雪", es: "Nieve ligera", fr: "Neige légère" },
  Snow: { zh: "降雪", ja: "雪", es: "Nieve", fr: "Neige" },
  "Heavy Snow": { zh: "大雪", ja: "大雪", es: "Nieve intensa", fr: "Forte neige" },
  "Snow Grains": { zh: "米雪", ja: "霧雪", es: "Granos de nieve", fr: "Neige en grains" },
  "Rain Showers": { zh: "阵雨", ja: "にわか雨", es: "Chubascos", fr: "Averses" },
  Showers: { zh: "阵雨", ja: "にわか雨", es: "Chubascos", fr: "Averses" },
  "Heavy Showers": { zh: "强阵雨", ja: "激しいにわか雨", es: "Chubascos fuertes", fr: "Fortes averses" },
  "Snow Showers": { zh: "阵雪", ja: "にわか雪", es: "Chubascos de nieve", fr: "Averses de neige" },
  Thunderstorm: { zh: "雷暴", ja: "雷雨", es: "Tormenta", fr: "Orage" },
};

export function localizeWeatherSummary(summary: string, locale: Locale): string {
  if (!summary || locale === "en") return summary;
  const parts = summary.split("·").map((p) => p.trim());
  if (parts.length === 2) {
    const translated = WEATHER_LABELS[parts[1]]?.[locale] ?? parts[1];
    return `${parts[0]} · ${translated}`;
  }
  return WEATHER_LABELS[summary.trim()]?.[locale] ?? summary;
}

const STREAM_STATUS_LABELS: Record<string, Record<Locale, string>> = {
  LIVE: { en: "LIVE", zh: "直播中", ja: "ライブ", es: "EN VIVO", fr: "EN DIRECT" },
  OFFLINE: { en: "OFFLINE", zh: "离线", ja: "オフライン", es: "DESCONECTADO", fr: "HORS LIGNE" },
  SCHEDULED: { en: "SCHEDULED", zh: "定时", ja: "配信予定", es: "PROGRAMADO", fr: "PROGRAMMÉ" },
  RESTRICTED: { en: "RESTRICTED", zh: "受限", ja: "制限あり", es: "RESTRINGIDO", fr: "RESTREINT" },
  UNKNOWN: { en: "UNKNOWN", zh: "未知", ja: "不明", es: "DESCONOCIDO", fr: "INCONNU" },
};

export function getStreamStatusLabel(locale: Locale, status?: string | null): string {
  const key = (status ?? "UNKNOWN").toUpperCase();
  return STREAM_STATUS_LABELS[key]?.[locale] ?? key;
}

const MEDIA_TYPE_LABELS: Record<string, Record<Locale, string>> = {
  LIVE_VIDEO: { en: "Live Video", zh: "实时视频", ja: "ライブ映像", es: "Video en vivo", fr: "Vidéo en direct" },
  SNAPSHOT: { en: "Snapshot", zh: "定时抓拍", ja: "スナップショット", es: "Instantánea", fr: "Instantané" },
  TIMELAPSE: { en: "Timelapse", zh: "延时摄影", ja: "タイムラプス", es: "Timelapse", fr: "Accéléré" },
  RECORDED: { en: "Recorded", zh: "录播", ja: "録画", es: "Grabado", fr: "Enregistré" },
};

export function getMediaTypeLabel(locale: Locale, mediaType?: string | null): string {
  const key = (mediaType ?? "LIVE_VIDEO").toUpperCase();
  return MEDIA_TYPE_LABELS[key]?.[locale] ?? key;
}
