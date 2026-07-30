/* ============================================================
   PC Game FPS Estimator - Data
   All performance "scores" are relative index numbers used only
   for the built-in estimation model. They are not lab-measured
   benchmark results.
   ============================================================ */

const REFERENCE_SCORE = 70; // baseline CPU/GPU score the game FPS numbers below are tuned against

const RESOLUTION_MULTIPLIER = {
  "1080p": 1.0,
  "1440p": 0.68,
  "4k": 0.42
};

/* ---------------- DESKTOP PARTS ---------------- */

const DESKTOP_PARTS = {
  cpu: {
    Intel: [
      { id: "i5-12400", name: "Intel Core i5-12400", score: 62, price: 150 },
      { id: "i5-13600k", name: "Intel Core i5-13600K", score: 82, price: 260 },
      { id: "i5-14600k", name: "Intel Core i5-14600K", score: 88, price: 290 },
      { id: "i7-14700k", name: "Intel Core i7-14700K", score: 98, price: 400 },
      { id: "i9-13900k", name: "Intel Core i9-13900K", score: 104, price: 480 },
      { id: "i9-14900k", name: "Intel Core i9-14900K", score: 108, price: 520 }
    ],
    AMD: [
      { id: "ryzen5-5600", name: "AMD Ryzen 5 5600", score: 66, price: 120 },
      { id: "ryzen5-7600", name: "AMD Ryzen 5 7600", score: 84, price: 180 },
      { id: "ryzen5-9600x", name: "AMD Ryzen 5 9600X", score: 90, price: 220 },
      { id: "ryzen7-7800x3d", name: "AMD Ryzen 7 7800X3D", score: 110, price: 380 },
      { id: "ryzen9-7950x3d", name: "AMD Ryzen 9 7950X3D", score: 112, price: 550 },
      { id: "ryzen7-9800x3d", name: "AMD Ryzen 7 9800X3D", score: 120, price: 480 },
      { id: "ryzen9-9950x3d", name: "AMD Ryzen 9 9950X3D", score: 118, price: 650 }
    ]
  },
  gpu: {
    NVIDIA: [
      { id: "rtx3060", name: "NVIDIA GeForce RTX 3060", score: 44, price: 280 },
      { id: "rtx4060", name: "NVIDIA GeForce RTX 4060", score: 56, price: 300 },
      { id: "rtx5060", name: "NVIDIA GeForce RTX 5060", score: 60, price: 300 },
      { id: "rtx4060ti", name: "NVIDIA GeForce RTX 4060 Ti", score: 66, price: 400 },
      { id: "rtx5060ti", name: "NVIDIA GeForce RTX 5060 Ti", score: 70, price: 430 },
      { id: "rtx4070", name: "NVIDIA GeForce RTX 4070", score: 80, price: 550 },
      { id: "rtx5070", name: "NVIDIA GeForce RTX 5070", score: 86, price: 550 },
      { id: "rtx4070tisuper", name: "NVIDIA GeForce RTX 4070 Ti Super", score: 98, price: 800 },
      { id: "rtx5070ti", name: "NVIDIA GeForce RTX 5070 Ti", score: 102, price: 750 },
      { id: "rtx4080super", name: "NVIDIA GeForce RTX 4080 Super", score: 112, price: 1000 },
      { id: "rtx5080", name: "NVIDIA GeForce RTX 5080", score: 118, price: 1000 },
      { id: "rtx4090", name: "NVIDIA GeForce RTX 4090", score: 145, price: 1600 },
      { id: "rtx5090", name: "NVIDIA GeForce RTX 5090", score: 150, price: 2000 }
    ],
    AMD: [
      { id: "rx7600", name: "AMD Radeon RX 7600", score: 50, price: 270 },
      { id: "rx7700xt", name: "AMD Radeon RX 7700 XT", score: 70, price: 450 },
      { id: "rx7800xt", name: "AMD Radeon RX 7800 XT", score: 82, price: 500 },
      { id: "rx9070", name: "AMD Radeon RX 9070", score: 88, price: 600 },
      { id: "rx9070xt", name: "AMD Radeon RX 9070 XT", score: 100, price: 700 },
      { id: "rx7900xt", name: "AMD Radeon RX 7900 XT", score: 100, price: 750 },
      { id: "rx7900xtx", name: "AMD Radeon RX 7900 XTX", score: 115, price: 950 }
    ],
    Intel: [
      { id: "arca770", name: "Intel Arc A770", score: 52, price: 330 },
      { id: "arcb580", name: "Intel Arc B580", score: 58, price: 250 }
    ]
  },
  ram: [
    { id: "ram8", name: "8 GB", gb: 8, price: 30 },
    { id: "ram16", name: "16 GB", gb: 16, price: 55 },
    { id: "ram32", name: "32 GB", gb: 32, price: 100 },
    { id: "ram64", name: "64 GB", gb: 64, price: 190 },
    { id: "ram128", name: "128 GB", gb: 128, price: 380 }
  ],
  motherboard: {
    Intel: [
      { id: "b760", name: "B760 Chipset", platform: "Intel", price: 130 },
      { id: "z790", name: "Z790 Chipset", platform: "Intel", price: 220 },
      { id: "z890", name: "Z890 Chipset", platform: "Intel", price: 280 }
    ],
    AMD: [
      { id: "b650", name: "B650 Chipset", platform: "AMD", price: 140 },
      { id: "x670e", name: "X670E Chipset", platform: "AMD", price: 280 },
      { id: "x870e", name: "X870E Chipset", platform: "AMD", price: 320 }
    ]
  }
};

/* ---------------- LAPTOP PARTS ---------------- */
/* Mobile parts generally score lower than their desktop counterparts
   due to power and thermal limits, even when similarly named. */

const LAPTOP_PARTS = {
  cpu: {
    Intel: [
      { id: "i5-13450hx", name: "Intel Core i5-13450HX (Laptop)", score: 68, price: 150 },
      { id: "ultra5-225h", name: "Intel Core Ultra 5 225H (Laptop)", score: 70, price: 170 },
      { id: "i7-14700hx", name: "Intel Core i7-14700HX (Laptop)", score: 92, price: 280 },
      { id: "ultra7-255h", name: "Intel Core Ultra 7 255H (Laptop)", score: 84, price: 260 },
      { id: "ultra9-275hx", name: "Intel Core Ultra 9 275HX (Laptop)", score: 100, price: 380 }
    ],
    AMD: [
      { id: "ryzen5-7640hs", name: "AMD Ryzen 5 7640HS (Laptop)", score: 70, price: 160 },
      { id: "ryzen7-8845hs", name: "AMD Ryzen 7 8845HS (Laptop)", score: 80, price: 240 },
      { id: "ryzenai9-hx370", name: "AMD Ryzen AI 9 HX 370 (Laptop)", score: 96, price: 320 }
    ]
  },
  gpu: {
    NVIDIA: [
      { id: "rtx3050-laptop", name: "NVIDIA GeForce RTX 3050 (Laptop)", score: 30, price: 200 },
      { id: "rtx4060-laptop", name: "NVIDIA GeForce RTX 4060 (Laptop)", score: 50, price: 350 },
      { id: "rtx5060-laptop", name: "NVIDIA GeForce RTX 5060 (Laptop)", score: 54, price: 380 },
      { id: "rtx4070-laptop", name: "NVIDIA GeForce RTX 4070 (Laptop)", score: 66, price: 550 },
      { id: "rtx5070-laptop", name: "NVIDIA GeForce RTX 5070 (Laptop)", score: 68, price: 580 },
      { id: "rtx5070ti-laptop", name: "NVIDIA GeForce RTX 5070 Ti (Laptop)", score: 82, price: 750 },
      { id: "rtx4080-laptop", name: "NVIDIA GeForce RTX 4080 (Laptop)", score: 90, price: 900 },
      { id: "rtx5080-laptop", name: "NVIDIA GeForce RTX 5080 (Laptop)", score: 95, price: 950 },
      { id: "rtx4090-laptop", name: "NVIDIA GeForce RTX 4090 (Laptop)", score: 112, price: 1400 },
      { id: "rtx5090-laptop", name: "NVIDIA GeForce RTX 5090 (Laptop)", score: 118, price: 1700 }
    ],
    AMD: [
      { id: "radeon780m", name: "AMD Radeon 780M (Integrated)", score: 18, price: 0 },
      { id: "rx7600s", name: "AMD Radeon RX 7600S (Laptop)", score: 48, price: 300 }
    ],
    Intel: [
      { id: "irisxe", name: "Intel Iris Xe (Integrated)", score: 12, price: 0 },
      { id: "arc140v", name: "Intel Arc 140V (Integrated)", score: 20, price: 50 }
    ]
  },
  ram: [
    { id: "ram8", name: "8 GB", gb: 8, price: 30 },
    { id: "ram16", name: "16 GB", gb: 16, price: 55 },
    { id: "ram32", name: "32 GB", gb: 32, price: 100 },
    { id: "ram64", name: "64 GB", gb: 64, price: 190 },
    { id: "ram128", name: "128 GB", gb: 128, price: 380 }
  ],
  chassis: [
    { id: "thin-light", name: "Thin & Light", multiplier: 0.88, price: 0 },
    { id: "standard-gaming", name: "Standard Gaming", multiplier: 1.0, price: 150 },
    { id: "high-performance", name: "High-Performance / Desktop Replacement", multiplier: 1.06, price: 400 }
  ]
};

/* ---------------- GAME CATEGORIES ---------------- */

const CATEGORIES = [
  { id: "all", name: "All Games" },
  { id: "fps", name: "FPS" },
  { id: "battleRoyale", name: "Battle Royale" },
  { id: "sandbox", name: "Sandbox" },
  { id: "openWorld", name: "Open World / RPG" },
  { id: "moba", name: "MOBA" },
  { id: "racingSports", name: "Racing & Sports" }
];

/* ---------------- GAMES ----------------
   presets are base FPS values at REFERENCE_SCORE (70/70) CPU+GPU,
   1080p resolution, and RAM at or above minRAM.
   gpuWeight / cpuWeight describe how GPU-bound vs CPU-bound the
   game is (roughly sums to ~1).
------------------------------------------ */

const GAMES = [
  {
    id: "r6siege", name: "Rainbow Six Siege", categories: ["fps"],
    gpuWeight: 0.55, cpuWeight: 0.45, minRAM: 8,
    presets: { low: 220, medium: 180, high: 140, ultra: 110 }
  },
  {
    id: "warzone", name: "Call of Duty: Warzone", categories: ["fps", "battleRoyale"],
    gpuWeight: 0.7, cpuWeight: 0.3, minRAM: 16,
    presets: { low: 100, medium: 80, high: 60, ultra: 45 }
  },
  {
    id: "valorant", name: "Valorant", categories: ["fps"],
    gpuWeight: 0.3, cpuWeight: 0.7, minRAM: 8,
    presets: { low: 400, medium: 350, high: 300, ultra: 250 }
  },
  {
    id: "cs2", name: "Counter-Strike 2", categories: ["fps"],
    gpuWeight: 0.4, cpuWeight: 0.6, minRAM: 16,
    presets: { low: 300, medium: 250, high: 200, ultra: 160 }
  },
  {
    id: "apex", name: "Apex Legends", categories: ["fps", "battleRoyale"],
    gpuWeight: 0.6, cpuWeight: 0.4, minRAM: 16,
    presets: { low: 180, medium: 150, high: 120, ultra: 95 }
  },
  {
    id: "overwatch2", name: "Overwatch 2", categories: ["fps"],
    gpuWeight: 0.5, cpuWeight: 0.5, minRAM: 8,
    presets: { low: 250, medium: 200, high: 165, ultra: 130 }
  },
  {
    id: "fortnite", name: "Fortnite", categories: ["battleRoyale"],
    gpuWeight: 0.6, cpuWeight: 0.4, minRAM: 16,
    presets: { low: 200, medium: 160, high: 120, ultra: 90 }
  },
  {
    id: "pubg", name: "PUBG: Battlegrounds", categories: ["battleRoyale"],
    gpuWeight: 0.65, cpuWeight: 0.35, minRAM: 16,
    presets: { low: 140, medium: 110, high: 85, ultra: 65 }
  },
  {
    id: "minecraft", name: "Minecraft", categories: ["sandbox"],
    gpuWeight: 0.3, cpuWeight: 0.7, minRAM: 8,
    presets: { low: 300, medium: 220, high: 150, ultra: 90 }
  },
  {
    id: "roblox", name: "Roblox", categories: ["sandbox"],
    gpuWeight: 0.35, cpuWeight: 0.65, minRAM: 8,
    presets: { low: 240, medium: 180, high: 140, ultra: 100 }
  },
  {
    id: "terraria", name: "Terraria", categories: ["sandbox"],
    gpuWeight: 0.2, cpuWeight: 0.8, minRAM: 8,
    presets: { low: 400, medium: 350, high: 300, ultra: 250 }
  },
  {
    id: "cyberpunk2077", name: "Cyberpunk 2077", categories: ["openWorld"],
    gpuWeight: 0.8, cpuWeight: 0.2, minRAM: 16,
    presets: { low: 90, medium: 70, high: 50, ultra: 32 }
  },
  {
    id: "gtav", name: "Grand Theft Auto V", categories: ["openWorld"],
    gpuWeight: 0.65, cpuWeight: 0.35, minRAM: 8,
    presets: { low: 180, medium: 140, high: 100, ultra: 75 }
  },
  {
    id: "rdr2", name: "Red Dead Redemption 2", categories: ["openWorld"],
    gpuWeight: 0.75, cpuWeight: 0.25, minRAM: 16,
    presets: { low: 100, medium: 78, high: 58, ultra: 42 }
  },
  {
    id: "witcher3", name: "The Witcher 3: Wild Hunt", categories: ["openWorld"],
    gpuWeight: 0.7, cpuWeight: 0.3, minRAM: 16,
    presets: { low: 110, medium: 85, high: 62, ultra: 45 }
  },
  {
    id: "eldenring", name: "Elden Ring", categories: ["openWorld"],
    gpuWeight: 0.6, cpuWeight: 0.4, minRAM: 16,
    presets: { low: 130, medium: 105, high: 80, ultra: 60 }
  },
  {
    id: "lol", name: "League of Legends", categories: ["moba"],
    gpuWeight: 0.3, cpuWeight: 0.7, minRAM: 8,
    presets: { low: 350, medium: 300, high: 250, ultra: 200 }
  },
  {
    id: "dota2", name: "Dota 2", categories: ["moba"],
    gpuWeight: 0.4, cpuWeight: 0.6, minRAM: 8,
    presets: { low: 300, medium: 250, high: 200, ultra: 160 }
  },
  {
    id: "forzah5", name: "Forza Horizon 5", categories: ["racingSports"],
    gpuWeight: 0.7, cpuWeight: 0.3, minRAM: 16,
    presets: { low: 150, medium: 120, high: 90, ultra: 65 }
  },
  {
    id: "fc25", name: "EA Sports FC 25", categories: ["racingSports"],
    gpuWeight: 0.55, cpuWeight: 0.45, minRAM: 8,
    presets: { low: 200, medium: 160, high: 120, ultra: 90 }
  }
];

const PRESET_ORDER = ["low", "medium", "high", "ultra"];
const PRESET_LABELS = { low: "Low", medium: "Medium", high: "High", ultra: "Ultra" };

/* Memory generation - affects effective bandwidth/latency, applied as a
   flat multiplier on top of the capacity-based ramFactor. */
const RAM_TYPES = [
  { id: "ddr3", name: "DDR3", multiplier: 0.85 },
  { id: "ddr4", name: "DDR4", multiplier: 1.0 },
  { id: "ddr5", name: "DDR5", multiplier: 1.06 }
];
