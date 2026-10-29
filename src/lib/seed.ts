import { categories, type State } from "./model";
const names = [
  "Deniz Aral",
  "Mira Ekin",
  "Atlas Kaya",
  "Lara Aydın",
  "Ege Yalın",
  "Ada Işık",
  "Aras Demir",
  "Duru Akın",
  "Bora Eren",
  "Selin Yel",
  "Can Koral",
  "İpek Tan",
];
const handles = [
  "denizaral",
  "mira.ekin",
  "atlaskaya",
  "laraaydin",
  "egeyalin",
  "adaisik",
  "arasdemir",
  "duruakin",
  "boraeren",
  "selinyel",
  "cankoral",
  "ipektan",
];
const captions = [
  "Kendi ritmini bul. Gerisi zaten geliyor.",
  "Bu köşeyi sıfırdan kurdum. Her detayın bir hikâyesi var.",
  "Şehrin sesi azaldığında, fikirler çoğalıyor.",
  "Az parça, çok karakter. Bugünün seçkisi.",
  "Biriktirdiğim şeyler değil, anlattıkları hikâyeler.",
  "Hafta sonu rotası: daha önce gitmediğim bir yer.",
  "Kusursuz olması gerekmiyor. Sana ait olması yeterli.",
  "Günün ışığı, gecenin ilhamı.",
  "Küçük bir detay bütün hissi değiştiriyor.",
  "Uzun zamandır üzerinde çalıştığım şey sonunda burada.",
];
export function seed(): State {
  const now = Date.now();
  return {
    profiles: names.map((name, i) => ({
      id: `demo-${i}`,
      name,
      username: handles[i].replace(".", ""),
      bio:
        i === 0
          ? "Tasarım, şehir ve arada kalan her şey.\nKendi dünyamı kuruyorum."
          : "Detayları seven bir ruh. Kendi dünyamdan küçük kareler. · Demo profil",
      location: ["İstanbul", "İzmir", "Ankara"][i % 3],
      website: "",
      avatar: `/art/avatar-${i % 6}.svg`,
      cover: `/art/scene-${i % 6}.svg`,
      role: i === 11 ? "moderator" : "member",
      createdAt: new Date(now - 86400000 * 90).toISOString(),
    })),
    posts: Array.from({ length: 36 }, (_, i) => ({
      id: `post-${i}`,
      authorId: `demo-${i % 12}`,
      caption: captions[i % 10],
      category: categories[i % categories.length],
      media: [`/art/scene-${i % 6}.svg`],
      tags: [
        ["ownyourflex", "details", "citymood", "madebyme", "slowdays", "papi"][
          i % 6
        ],
        categories[i % categories.length].toLowerCase().replace(/[^a-z]/g, ""),
      ],
      createdAt: new Date(now - i * 3600000 * 3).toISOString(),
      hidden: false,
    })),
    comments: Array.from({ length: 18 }, (_, i) => ({
      id: `comment-${i}`,
      postId: `post-${i % 9}`,
      authorId: `demo-${(i + 2) % 12}`,
      text: ["Detaylara bayıldım. ✨", "Tam benim tarzım.", "Emeğine sağlık!"][
        i % 3
      ],
      createdAt: new Date(now - i * 3600000).toISOString(),
    })),
    likes: Array.from({ length: 90 }, (_, i) => ({
      userId: `demo-${1 + (i % 11)}`,
      targetId: `post-${i % 36}`,
    })).filter(
      (r, i, a) =>
        a.findIndex(
          (x) => x.userId === r.userId && x.targetId === r.targetId,
        ) === i,
    ),
    follows: [
      { userId: "demo-0", targetId: "demo-1" },
      { userId: "demo-0", targetId: "demo-3" },
      { userId: "demo-2", targetId: "demo-0" },
    ],
    bookmarks: [],
    blocks: [],
    reports: [],
    notifications: [
      {
        id: "notice-1",
        recipientId: "demo-0",
        actorId: "demo-2",
        type: "follow",
        targetId: "demo-2",
        read: false,
        createdAt: new Date(now).toISOString(),
      },
    ],
    preferences: { theme: "dark", notifications: true },
  };
}
