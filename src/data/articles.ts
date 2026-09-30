import heroStadion from "@/assets/hero-stadion.jpg";
import newsReprezentacija from "@/assets/news-reprezentacija.jpg";
import newsKosarka from "@/assets/news-kosarka.jpg";
import newsTrener from "@/assets/news-trener.jpg";

export type Category = "fudbal" | "kosarka" | "ostali-sportovi";

export const categoryLabels: Record<Category, string> = {
  fudbal: "Fudbal",
  kosarka: "Košarka",
  "ostali-sportovi": "Ostali sportovi",
};

export type Article = {
  slug: string;
  title: string;
  lead: string;
  kicker: string;
  category: Category;
  image: string;
  author: string;
  published: string;
  comments: number;
  body: string[];
};

export const articles: Article[] = [
  {
    slug: "zmajevi-pred-kvalifikacijsku-utakmicu",
    title: "Zmajevi pred ključnu utakmicu: Selektor otkrio ko počinje na Grbavici",
    lead: "Reprezentacija BiH u petak igra utakmicu koja odlučuje o nastavku kvalifikacija, a sastav je gotovo poznat.",
    kicker: "Reprezentacija",
    category: "fudbal",
    image: heroStadion,
    author: "Korner redakcija",
    published: "30.09.2026.",
    comments: 42,
    body: [
      "Nogometna reprezentacija Bosne i Hercegovine odradila je posljednji trening pred utakmicu koja bi mogla odlučiti o plasmanu u baraž. Atmosfera u taboru Zmajeva je, kažu iz stručnog štaba, bolja nego ikad ove godine.",
      "Selektor je na konferenciji za medije potvrdio da su svi igrači zdravi i spremni, te da odluka o startnoj postavi neće biti donesena do jutra pred meč.",
      "Ulaznice za susret rasprodane su za manje od 48 sati, a navijačka grupa najavila je veliku koreografiju na sjevernoj tribini.",
    ],
  },
  {
    slug: "premijer-liga-derbi-kola",
    title: "Derbi kola u Premijer ligi BiH: Sarajevo i Željezničar u borbi za vrh",
    lead: "Gradski derbi ponovo odlučuje o liderskoj poziciji, a oba tima ulaze bez poraza u posljednjih pet kola.",
    kicker: "Premijer liga",
    category: "fudbal",
    image: newsTrener,
    author: "Amar H.",
    published: "29.09.2026.",
    comments: 118,
    body: [
      "Vječiti derbi ponovo se igra u trenutku kada obje ekipe jure vrh tabele. Posljednjih pet kola donijelo je devet bodova jednima i deset drugima.",
      "Treneri su se u najavi susreta uzdržali od provokacija, ali je jasno da pobjednik preuzima psihološku prednost pred nastavak sezone.",
      "Sudijsku kontrolu preuzeo je iskusan sudijski tim, a meč se igra pred punim tribinama.",
    ],
  },
  {
    slug: "kosarkasi-bih-pobjeda-kvalifikacije",
    title: "Košarkaši BiH slavili u gostima i ostali u igri za Eurobasket",
    lead: "Snažna odbrana u posljednjoj četvrtini donijela je našoj selekciji možda i najvažniju pobjedu u ciklusu.",
    kicker: "Košarka",
    category: "kosarka",
    image: newsKosarka,
    author: "Dino S.",
    published: "28.09.2026.",
    comments: 27,
    body: [
      "Košarkaška reprezentacija BiH odigrala je sjajnu posljednju dionicu i došla do pobjede koja je vraća u trku za plasman na Eurobasket.",
      "Najefikasniji u redovima naše selekcije bio je krilni igrač s 24 poena i osam skokova.",
      "Naredni susret igra se za tri dana pred domaćom publikom.",
    ],
  },
  {
    slug: "mladi-talent-transfer-bundesliga",
    title: "Mladi bh. talent pred transferom u Bundesligu: Ponuda stigla na sto",
    lead: "Njemački prvoligaš spreman je platiti odštetu koja bi bila među najvećima u historiji kluba.",
    kicker: "Transferi",
    category: "fudbal",
    image: newsReprezentacija,
    author: "Korner redakcija",
    published: "28.09.2026.",
    comments: 63,
    body: [
      "Prema informacijama iz kluba, pregovori su u završnoj fazi, a igrač bi ljekarski pregled mogao obaviti već naredne sedmice.",
      "Riječ je o jednom od najperspektivnijih igrača domaće lige, koji je ove sezone upisao sedam golova i četiri asistencije.",
      "Klub bi od transfera mogao zaraditi rekordnu sumu za bh. uslove.",
    ],
  },
  {
    slug: "rukomet-evropski-kup",
    title: "Rukometaši iznenadili favorita i izborili drugo kolo evropskog kupa",
    lead: "Nakon poraza u prvoj utakmici, uslijedio je preokret kakav se pamti.",
    kicker: "Rukomet",
    category: "ostali-sportovi",
    image: heroStadion,
    author: "Lejla M.",
    published: "27.09.2026.",
    comments: 11,
    body: [
      "Preokret od sedam golova zaostatka rijetko se viđa, a upravo to je uspjelo našem predstavniku pred svojom publikom.",
      "Golman domaćih odbranio je 17 udaraca i bio prvo ime susreta.",
    ],
  },
  {
    slug: "atletika-rekord-bih",
    title: "Novi državni rekord: Bh. atletičarka ušla među najbolje u Evropi",
    lead: "Rezultat sa mitinga u Beogradu donio joj je normu za naredno veliko takmičenje.",
    kicker: "Atletika",
    category: "ostali-sportovi",
    image: newsKosarka,
    author: "Korner redakcija",
    published: "26.09.2026.",
    comments: 8,
    body: [
      "Državni rekord star više od decenije pao je na mitingu u Beogradu.",
      "Naša predstavnica sada se nalazi među deset najboljih u Evropi ove sezone.",
    ],
  },
  {
    slug: "analiza-taktika-kolo",
    title: "Analiza kola: Zašto je presing visoko na terenu promijenio sliku lige",
    lead: "Tri kluba su ove sezone potpuno promijenila pristup i rezultati su odmah uslijedili.",
    kicker: "Analiza",
    category: "fudbal",
    image: newsTrener,
    author: "Amar H.",
    published: "26.09.2026.",
    comments: 19,
    body: [
      "Statistika pokazuje da su tri kluba ove sezone gotovo udvostručila broj oduzetih lopti u posljednjoj trećini terena.",
      "Rezultat je vidljiv: više golova iz tranzicije i manje primljenih pogodaka iz kontri.",
    ],
  },
  {
    slug: "kosarkaski-derbi-lige",
    title: "Košarkaški derbi odlučen u posljednjoj sekundi",
    lead: "Trojka sa zvukom sirene donijela je gostima pobjedu i prvo mjesto na tabeli.",
    kicker: "Liga BiH",
    category: "kosarka",
    image: newsKosarka,
    author: "Dino S.",
    published: "25.09.2026.",
    comments: 35,
    body: [
      "Dvorana je eksplodirala nakon što je lopta prošla kroz obruč u posljednjoj sekundi susreta.",
      "Gosti su tako preuzeli prvo mjesto uoči nastavka sezone.",
    ],
  },
];

export const getArticle = (slug: string) => articles.find((a) => a.slug === slug);
export const byCategory = (c: Category) => articles.filter((a) => a.category === c);

export const standings = [
  { team: "Zrinjski", played: 9, points: 22 },
  { team: "Sarajevo", played: 9, points: 20 },
  { team: "Željezničar", played: 9, points: 19 },
  { team: "Borac", played: 9, points: 17 },
  { team: "Velež", played: 9, points: 14 },
  { team: "Široki Brijeg", played: 9, points: 12 },
];

export const fixtures = [
  { home: "BiH", away: "Švedska", time: "petak 20:45", comp: "Kvalifikacije" },
  { home: "Sarajevo", away: "Željezničar", time: "subota 17:00", comp: "Premijer liga" },
  { home: "Borac", away: "Zrinjski", time: "nedjelja 15:00", comp: "Premijer liga" },
  { home: "Igokea", away: "Spars", time: "nedjelja 19:00", comp: "Košarka" },
];
