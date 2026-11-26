import type { Locale } from "./i18n";

const COUNTRY_NAMES: Record<string, Partial<Record<Locale, string>>> = {
  international: { en: "International", zh: "国际 / 全球", ja: "国際", es: "Internacional", fr: "International", de: "International" },
  "united-states": { en: "United States", zh: "美国", ja: "アメリカ合衆国", es: "Estados Unidos", fr: "États-Unis", de: "Vereinigte Staaten" },
  "united-kingdom": { en: "United Kingdom", zh: "英国", ja: "イギリス", es: "Reino Unido", fr: "Royaume-Uni", de: "Vereinigtes Königreich" },
  japan: { en: "Japan", zh: "日本", ja: "日本", es: "Japón", fr: "Japon", de: "Japan" },
  italy: { en: "Italy", zh: "意大利", ja: "イタリア", es: "Italia", fr: "Italie", de: "Italien" },
  canada: { en: "Canada", zh: "加拿大", ja: "カナダ", es: "Canadá", fr: "Canada", de: "Kanada" },
  namibia: { en: "Namibia", zh: "纳米比亚", ja: "ナミビア", es: "Namibia", fr: "Namibie", de: "Namibia" },
  australia: { en: "Australia", zh: "澳大利亚", ja: "オーストラリア", es: "Australia", fr: "Australie", de: "Australien" },
  "south-korea": { en: "South Korea", zh: "韩国", ja: "韓国", es: "Corea del Sur", fr: "Corée du Sud", de: "Südkorea" },
  netherlands: { en: "Netherlands", zh: "荷兰", ja: "オランダ", es: "Países Bajos", fr: "Pays-Bas", de: "Niederlande" },
  kenya: { en: "Kenya", zh: "肯尼亚", ja: "ケニア", es: "Kenia", fr: "Kenya", de: "Kenia" },
  switzerland: { en: "Switzerland", zh: "瑞士", ja: "スイス", es: "Suiza", fr: "Suisse", de: "Schweiz" },
  "south-africa": { en: "South Africa", zh: "南非", ja: "南アフリカ", es: "Sudáfrica", fr: "Afrique du Sud", de: "Südafrika" },
  norway: { en: "Norway", zh: "挪威", ja: "ノルウェー", es: "Noruega", fr: "Norvège", de: "Norwegen" },
  greece: { en: "Greece", zh: "希腊", ja: "ギリシャ", es: "Grecia", fr: "Grèce", de: "Griechenland" },
  finland: { en: "Finland", zh: "芬兰", ja: "フィンランド", es: "Finlandia", fr: "Finlande", de: "Finnland" },
  czechia: { en: "Czechia", zh: "捷克", ja: "チェコ", es: "Chequia", fr: "Tchéquie", de: "Tschechien" },
  france: { en: "France", zh: "法国", ja: "フランス", es: "Francia", fr: "France", de: "Frankreich" },
  germany: { en: "Germany", zh: "德国", ja: "ドイツ", es: "Alemania", fr: "Allemagne", de: "Deutschland" },
  spain: { en: "Spain", zh: "西班牙", ja: "スペイン", es: "España", fr: "Espagne", de: "Spanien" },
  china: { en: "China", zh: "中国", ja: "中国", es: "China", fr: "Chine", de: "China" },
  austria: { en: "Austria", zh: "奥地利", ja: "オーストリア", es: "Austria", fr: "Autriche", de: "Österreich" },
  iceland: { en: "Iceland", zh: "冰岛", ja: "アイスランド", es: "Islandia", fr: "Islande", de: "Island" },
  mexico: { en: "Mexico", zh: "墨西哥", ja: "メキシコ", es: "México", fr: "Mexique", de: "Mexiko" },
  taiwan: { en: "Taiwan", zh: "中国台湾", ja: "台湾", es: "Taiwán", fr: "Taïwan", de: "Taiwan" },
  thailand: { en: "Thailand", zh: "泰国", ja: "タイ", es: "Tailandia", fr: "Thaïlande", de: "Thailand" },
  portugal: { en: "Portugal", zh: "葡萄牙", ja: "ポルトガル", es: "Portugal", fr: "Portugal", de: "Portugal" },
  brazil: { en: "Brazil", zh: "巴西", ja: "ブラジル", es: "Brasil", fr: "Brésil", de: "Brasilien" },
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
  arrecife: { en: "Arrecife", zh: "阿雷西费", ja: "アレシフェ", es: "Arrecife", fr: "Arrecife" },
  cambrils: { en: "Cambrils", zh: "坎布里尔斯", ja: "カンブリルス", es: "Cambrils", fr: "Cambrils" },
  caussols: { en: "Caussols", zh: "科索勒", ja: "コソル", es: "Caussols", fr: "Caussols" },
  chania: { en: "Chania", zh: "干尼亚", ja: "ハニア", es: "La Canea", fr: "La Canée" },
  chioggia: { en: "Chioggia", zh: "基奥贾", ja: "キオッジャ", es: "Chioggia", fr: "Chioggia" },
  drapano: { en: "Drapano", zh: "德拉帕诺", ja: "ドラパノ", es: "Drapano", fr: "Drapano" },
  grenoble: { en: "Grenoble", zh: "格勒诺布尔", ja: "グルノーブル", es: "Grenoble", fr: "Grenoble" },
  "grundarfjor-ur": { en: "Grundarfjörður", zh: "格伦达菲厄泽", ja: "グルンダルフィヨルズル", es: "Grundarfjörður", fr: "Grundarfjörður" },
  "jackson-hole": { en: "Jackson Hole", zh: "杰克逊霍尔", ja: "ジャクソンホール", es: "Jackson Hole", fr: "Jackson Hole" },
  kagoshima: { en: "Kagoshima", zh: "鹿儿岛", ja: "鹿児島", es: "Kagoshima", fr: "Kagoshima" },
  kyoto: { en: "Kyoto", zh: "京都", ja: "京都", es: "Kioto", fr: "Kyoto" },
  "limone-piemonte": { en: "Limone Piemonte", zh: "利莫内皮埃蒙特", ja: "リモーネ・ピエモンテ", es: "Limone Piemonte", fr: "Limone Piemonte" },
  minden: { en: "Minden", zh: "明登", ja: "ミンデン", es: "Minden", fr: "Minden" },
  montpellier: { en: "Montpellier", zh: "蒙彼利埃", ja: "モンペリエ", es: "Montpellier", fr: "Montpellier" },
  "niagara-falls": { en: "Niagara Falls", zh: "尼亚加拉瀑布", ja: "ナイアガラの滝", es: "Cataratas del Niágara", fr: "Chutes du Niagara" },
  nuremberg: { en: "Nuremberg", zh: "纽伦堡", ja: "ニュルンベルク", es: "Núremberg", fr: "Nuremberg" },
  osaka: { en: "Osaka", zh: "大阪", ja: "大阪", es: "Osaka", fr: "Osaka" },
  "pa-tong": { en: "Pa Tong", zh: "芭东", ja: "パトン", es: "Patong", fr: "Patong" },
  palafrugell: { en: "Palafrugell", zh: "帕拉夫鲁赫尔", ja: "パラフルジェイ", es: "Palafrugell", fr: "Palafrugell" },
  plymouth: { en: "Plymouth", zh: "普利茅斯", ja: "プリマス", es: "Plymouth", fr: "Plymouth" },
  "podersdorf-am-see": { en: "Podersdorf am See", zh: "波德斯多夫", ja: "ポーダースドルフ", es: "Podersdorf am See", fr: "Podersdorf am See" },
  prague: { en: "Prague", zh: "布拉格", ja: "プラハ", es: "Praga", fr: "Prague" },
  "puerto-aventuras": { en: "Puerto Aventuras", zh: "阿文图拉斯港", ja: "プエルト・アベントゥラス", es: "Puerto Aventuras", fr: "Puerto Aventuras" },
  reykjavik: { en: "Reykjavik", zh: "雷克雅未克", ja: "レイキャビク", es: "Reikiavik", fr: "Reykjavik" },
  rhodes: { en: "Rhodes", zh: "罗得岛", ja: "ロドス", es: "Rodas", fr: "Rhodes" },
  rosarito: { en: "Rosarito", zh: "罗萨里托", ja: "ロサリト", es: "Rosarito", fr: "Rosarito" },
  "san-bartolome-de-tirajana": { en: "San Bartolomé de Tirajana", zh: "圣巴托洛梅德蒂拉哈纳", ja: "サン・バルトロメ・デ・ティラハナ", es: "San Bartolomé de Tirajana", fr: "San Bartolomé de Tirajana" },
  "st-john-s": { en: "St. John's", zh: "圣约翰斯", ja: "セントジョンズ", es: "San Juan de Terranova", fr: "Saint-Jean" },
  stralsund: { en: "Stralsund", zh: "施特拉尔松德", ja: "シュトラールズント", es: "Stralsund", fr: "Stralsund" },
  taipei: { en: "Taipei", zh: "台北", ja: "台北", es: "Taipéi", fr: "Taipei" },
  tulum: { en: "Tulum", zh: "图卢姆", ja: "トゥルム", es: "Tulum", fr: "Tulum", de: "Tulum" },
  vienna: { en: "Vienna", zh: "维也纳", ja: "ウィーン", es: "Viena", fr: "Vienne", de: "Wien" },
  appenzell: { en: "Appenzell", zh: "阿彭策尔", ja: "アッペンツェル", es: "Appenzell", fr: "Appenzell", de: "Appenzell" },
  ascona: { en: "Ascona", zh: "阿斯科纳", ja: "アスコナ", es: "Ascona", fr: "Ascona", de: "Ascona" },
  bangkok: { en: "Bangkok", zh: "曼谷", ja: "バンコク", es: "Bangkok", fr: "Bangkok", de: "Bangkok" },
  barcelona: { en: "Barcelona", zh: "巴塞罗那", ja: "バルセロナ", es: "Barcelona", fr: "Barcelone", de: "Barcelona" },
  beaucourt: { en: "Beaucourt", zh: "博库尔", ja: "ボークール", es: "Beaucourt", fr: "Beaucourt", de: "Beaucourt" },
  berlin: { en: "Berlin", zh: "柏林", ja: "ベルリン", es: "Berlín", fr: "Berlin", de: "Berlin" },
  blankenberge: { en: "Blankenberge", zh: "布兰肯贝赫", ja: "ブランケンベルヘ", es: "Blankenberge", fr: "Blankenberge", de: "Blankenberge" },
  cabarete: { en: "Cabarete", zh: "卡巴雷特", ja: "カバレテ", es: "Cabarete", fr: "Cabarete", de: "Cabarete" },
  cancun: { en: "Cancun", zh: "坎昆", ja: "カンクン", es: "Cancún", fr: "Cancún", de: "Cancún" },
  davos: { en: "Davos", zh: "达沃斯", ja: "ダボス", es: "Davos", fr: "Davos", de: "Davos" },
  "daytona-beach": { en: "Daytona Beach", zh: "代托纳海滩", ja: "デイトナビーチ", es: "Daytona Beach", fr: "Daytona Beach", de: "Daytona Beach" },
  "de-panne": { en: "De Panne", zh: "德帕内", ja: "デ・パンネ", es: "De Panne", fr: "La Panne", de: "De Panne" },
  diomede: { en: "Diomede", zh: "迪奥米德", ja: "ダイオミード", es: "Diomede", fr: "Diomède", de: "Diomede" },
  "district-of-tvrdo-n": { en: "District of Tvrdošín", zh: "特夫尔多辛区", ja: "トヴルドシーン郡", es: "Distrito de Tvrdošín", fr: "District de Tvrdošín", de: "Okres Tvrdošín" },
  fiesch: { en: "Fiesch", zh: "菲施", ja: "フィーシュ", es: "Fiesch", fr: "Fiesch", de: "Fiesch" },
  geneva: { en: "Geneva", zh: "日内瓦", ja: "ジュネーブ", es: "Ginebra", fr: "Genève", de: "Genf" },
  hamburg: { en: "Hamburg", zh: "汉堡", ja: "ハンブルク", es: "Hamburgo", fr: "Hambourg", de: "Hamburg" },
  haukeliseter: { en: "Haukeliseter", zh: "豪克利塞特", ja: "ハウケリセテル", es: "Haukeliseter", fr: "Haukeliseter", de: "Haukeliseter" },
  "hoyos-del-espino": { en: "Hoyos del Espino", zh: "奥约斯德尔埃斯皮诺", ja: "オヨス・デル・エスピノ", es: "Hoyos del Espino", fr: "Hoyos del Espino", de: "Hoyos del Espino" },
  "island-harbour": { en: "Island Harbour", zh: "艾兰哈伯", ja: "アイランドハーバー", es: "Island Harbour", fr: "Island Harbour", de: "Island Harbour" },
  jackson: { en: "Jackson", zh: "杰克逊", ja: "ジャクソン", es: "Jackson", fr: "Jackson", de: "Jackson" },
  "knokke-heist": { en: "Knokke-Heist", zh: "克诺克-海斯特", ja: "クノック＝ヘイスト", es: "Knokke-Heist", fr: "Knokke-Heist", de: "Knokke-Heist" },
  lausanne: { en: "Lausanne", zh: "洛桑", ja: "ローザンヌ", es: "Lausana", fr: "Lausanne", de: "Lausanne" },
  "los-andes": { en: "Los Andes", zh: "洛斯安第斯", ja: "ロス・アンデス", es: "Los Andes", fr: "Los Andes", de: "Los Andes" },
  marseille: { en: "Marseille", zh: "马赛", ja: "マルセイユ", es: "Marsella", fr: "Marseille", de: "Marseille" },
  martigues: { en: "Martigues", zh: "马蒂格", ja: "マルティーグ", es: "Martigues", fr: "Martigues", de: "Martigues" },
  meyrin: { en: "Meyrin", zh: "梅兰", ja: "メイラン", es: "Meyrin", fr: "Meyrin", de: "Meyrin" },
  miami: { en: "Miami", zh: "迈阿密", ja: "マイアミ", es: "Miami", fr: "Miami", de: "Miami" },
  mogan: { en: "Mogan", zh: "莫甘", ja: "モガン", es: "Mogán", fr: "Mogán", de: "Mogán" },
  "muir-beach": { en: "Muir Beach", zh: "缪尔海滩", ja: "ミュアービーチ", es: "Muir Beach", fr: "Muir Beach", de: "Muir Beach" },
  munich: { en: "Munich", zh: "慕尼黑", ja: "ミュンヘン", es: "Múnich", fr: "Munich", de: "München" },
  nairobi: { en: "Nairobi", zh: "内罗毕", ja: "ナイロビ", es: "Nairobi", fr: "Nairobi", de: "Nairobi" },
  nesslau: { en: "Nesslau", zh: "内斯劳", ja: "ネスラウ", es: "Nesslau", fr: "Nesslau", de: "Nesslau" },
  olten: { en: "Olten", zh: "奥尔滕", ja: "オルテン", es: "Olten", fr: "Olten", de: "Olten" },
  oludeniz: { en: "Oludeniz", zh: "厄吕代尼兹", ja: "オルデニズ", es: "Ölüdeniz", fr: "Ölüdeniz", de: "Ölüdeniz" },
  pajala: { en: "Pajala", zh: "帕亚拉", ja: "パヤラ", es: "Pajala", fr: "Pajala", de: "Pajala" },
  paris: { en: "Paris", zh: "巴黎", ja: "パリ", es: "París", fr: "Paris", de: "Paris" },
  piancavallo: { en: "Piancavallo", zh: "皮安卡瓦洛", ja: "ピアンカヴァッロ", es: "Piancavallo", fr: "Piancavallo", de: "Piancavallo" },
  portofino: { en: "Portofino", zh: "波托菲诺", ja: "ポルトフィーノ", es: "Portofino", fr: "Portofino", de: "Portofino" },
  ravoire: { en: "Ravoire", zh: "拉瓦尔", ja: "ラヴォワール", es: "Ravoire", fr: "Ravoire", de: "Ravoire" },
  "rio-de-janeiro": { en: "Rio de Janeiro", zh: "里约热内卢", ja: "リオデジャネイロ", es: "Río de Janeiro", fr: "Rio de Janeiro", de: "Rio de Janeiro" },
  "sankt-moritz": { en: "St. Moritz", zh: "圣莫里茨", ja: "サンモリッツ", es: "Sankt Moritz", fr: "Saint-Moritz", de: "St. Moritz" },
  "santa-pola": { en: "Santa Pola", zh: "圣波拉", ja: "サンタ・ポラ", es: "Santa Pola", fr: "Santa Pola", de: "Santa Pola" },
  scuol: { en: "Scuol", zh: "施库奥尔", ja: "シュクオル", es: "Scuol", fr: "Scuol", de: "Scuol" },
  stans: { en: "Stans", zh: "施坦斯", ja: "シュタンス", es: "Stans", fr: "Stans", de: "Stans" },
  "s-renberg": { en: "Sörenberg", zh: "瑟伦贝格", ja: "ゼーレンベルク", es: "Sörenberg", fr: "Sörenberg", de: "Sörenberg" },
  tortoreto: { en: "Tortoreto", zh: "托尔托雷托", ja: "トルトレート", es: "Tortoreto", fr: "Tortoreto", de: "Tortoreto" },
  troms: { en: "Tromsø", zh: "特罗姆瑟", ja: "トロムソ", es: "Tromsø", fr: "Tromsø", de: "Tromsø" },
  varazdin: { en: "Varaždin", zh: "瓦拉日丁", ja: "ヴァラジュディン", es: "Varaždin", fr: "Varaždin", de: "Varaždin" },
  vladivostok: { en: "Vladivostok", zh: "符拉迪沃斯托克", ja: "ウラジオストク", es: "Vladivostok", fr: "Vladivostok", de: "Wladiwostok" },
  zakopane: { en: "Zakopane", zh: "扎科帕内", ja: "ザコパネ", es: "Zakopane", fr: "Zakopane", de: "Zakopane" },
  unknown: { en: "Scenic View", zh: "风景点位", ja: "絶景スポット", es: "Vista Panorámica", fr: "Vue Panoramique", de: "Panoramablick" },
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

  const resolvedIso = resolveCountryIsoCode(key, isoCode);
  if (key !== "international" && /^[A-Z]{2}$/.test(resolvedIso)) {
    const intl = getRegionDisplayNames(locale);
    const localized = intl?.of(resolvedIso);
    if (localized) return localized;
  }

  return COUNTRY_NAMES[key]?.en ?? fallback ?? slug;
}

export function getCityLabel(locale: Locale, slug: string, fallback?: string): string {
  const key = slug.toLowerCase().trim();
  return CITY_NAMES[key]?.[locale] ?? CITY_NAMES[key]?.en ?? fallback ?? slug;
}

const COUNTRY_SLUG_TO_ISO: Record<string, string> = {
  "united-states": "US",
  "united-kingdom": "GB",
  japan: "JP",
  italy: "IT",
  canada: "CA",
  namibia: "NA",
  australia: "AU",
  "south-korea": "KR",
  netherlands: "NL",
  kenya: "KE",
  switzerland: "CH",
  "south-africa": "ZA",
  norway: "NO",
  greece: "GR",
  finland: "FI",
  czechia: "CZ",
  "czech-republic": "CZ",
  france: "FR",
  germany: "DE",
  spain: "ES",
  china: "CN",
  austria: "AT",
  iceland: "IS",
  mexico: "MX",
  taiwan: "TW",
  thailand: "TH",
  portugal: "PT",
  brazil: "BR",
  sweden: "SE",
  denmark: "DK",
  poland: "PL",
  turkey: "TR",
  turkiye: "TR",
  ireland: "IE",
  belgium: "BE",
  croatia: "HR",
  slovenia: "SI",
  slovakia: "SK",
  hungary: "HU",
  romania: "RO",
  bulgaria: "BG",
  ukraine: "UA",
  russia: "RU",
  "new-zealand": "NZ",
  india: "IN",
  indonesia: "ID",
  malaysia: "MY",
  philippines: "PH",
  vietnam: "VN",
  singapore: "SG",
  "hong-kong": "HK",
  argentina: "AR",
  chile: "CL",
  colombia: "CO",
  peru: "PE",
  "costa-rica": "CR",
  panama: "PA",
  "dominican-republic": "DO",
  jamaica: "JM",
  bahamas: "BS",
  egypt: "EG",
  morocco: "MA",
  israel: "IL",
  "united-arab-emirates": "AE",
  uae: "AE",
  malta: "MT",
  cyprus: "CY",
  estonia: "EE",
  latvia: "LV",
  lithuania: "LT",
  luxembourg: "LU",
  monaco: "MC",
  andorra: "AD",
  maldives: "MV",
  mauritius: "MU",
  fiji: "FJ",
  montenegro: "ME",
  serbia: "RS",
  albania: "AL",
  bosnia: "BA",
  "bosnia-and-herzegovina": "BA",
  scotland: "GB",
  wales: "GB",
  england: "GB",
  "puerto-rico": "PR",
  aruba: "AW",
  curacao: "CW",
  bermuda: "BM",
  greenland: "GL",
  "faroe-islands": "FO",
};

export function resolveCountryIsoCode(slugOrName: string, fallbackIso?: string | null): string {
  const key = slugOrName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (COUNTRY_SLUG_TO_ISO[key]) return COUNTRY_SLUG_TO_ISO[key];
  if (fallbackIso && /^[A-Z]{2}$/i.test(fallbackIso.trim())) {
    return fallbackIso.trim().toUpperCase();
  }
  return key.slice(0, 2).toUpperCase();
}

export function isoToFlagEmoji(iso: string): string {
  const code = iso.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(
    0x1f1e6 + (code.charCodeAt(0) - 65),
    0x1f1e6 + (code.charCodeAt(1) - 65)
  );
}

export function getCountryFlag(
  slugOrName: string,
  isoCode?: string | null,
  currentFlag?: string | null
): string {
  const resolvedIso = resolveCountryIsoCode(slugOrName, isoCode);
  if (/^[A-Z]{2}$/.test(resolvedIso) && slugOrName.toLowerCase() !== "international") {
    return isoToFlagEmoji(resolvedIso);
  }
  if (currentFlag && currentFlag !== "🌍") return currentFlag;
  return "🌍";
}
