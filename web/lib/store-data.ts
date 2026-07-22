export type ProductType = "vst" | "pack" | "oneshot" | "merch";

export type Category = {
  id: string;
  name: string;
  slug: string;
  accent: string;
  description: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  type: ProductType;
  fulfillment: "digital" | "physical";
  isPurchasable: boolean;
  shortDescription: string;
  longDescription: string;
  isFree: boolean;
  price: number;
  cover: string;
  downloadKey?: string;
  compatibility: string[];
  featured?: boolean;
  badge?: string;
  statusLabel?: string;
};

export const categories: Category[] = [
  {
    id: "featured",
    name: "Featured",
    slug: "featured",
    accent: "var(--accent-cyan)",
    description: "Top picks from the catalog.",
  },
  {
    id: "vsts",
    name: "VSTs",
    slug: "vsts",
    accent: "var(--accent-green)",
    description: "Synths and FX tools for modern production.",
  },
  {
    id: "packs",
    name: "Packs",
    slug: "packs",
    accent: "var(--accent-amber)",
    description: "Full drum and melody packs.",
  },
  {
    id: "oneshots",
    name: "One Shots",
    slug: "oneshots",
    accent: "var(--accent-red)",
    description: "Single-hit drums and textures.",
  },
  {
    id: "merch",
    name: "Merch",
    slug: "merch",
    accent: "var(--accent-cyan)",
    description: "Studio-inspired gear and apparel.",
  },
];

export const products: Product[] = [
  {
    id: "p001",
    title: "Neon Grain",
    slug: "neon-grain",
    categoryId: "vsts",
    type: "vst",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "Bitcrushed texture synth.",
    longDescription:
      "Neon Grain blends lo-fi oscillators with quick macro controls for distorted leads and pads.",
    isFree: false,
    price: 19,
    cover: "/covers/neon-grain.svg",
    downloadKey: "products/neon-grain/neon-grain.zip",
    compatibility: ["VST3", "AU", "macOS", "Windows"],
    featured: true,
    badge: "NEW",
  },
  {
    id: "p002",
    title: "Tape Bloom",
    slug: "tape-bloom",
    categoryId: "vsts",
    type: "vst",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "Analog-style saturation and width.",
    longDescription:
      "Tape Bloom gives drums and melodies a warm tape profile with stereo bloom and controlled noise.",
    isFree: true,
    price: 0,
    cover: "/covers/tape-bloom.svg",
    downloadKey: "products/tape-bloom/tape-bloom.zip",
    compatibility: ["VST3", "AU", "macOS", "Windows"],
    featured: true,
    badge: "FREE",
  },
  {
    id: "p003",
    title: "Midnight Drums Vol. 1",
    slug: "midnight-drums-vol-1",
    categoryId: "packs",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "120 trap and drill drum hits.",
    longDescription:
      "A focused drum toolkit with crisp 808s, snares, hats, and percs designed for dark modern beats.",
    isFree: false,
    price: 24,
    cover: "/covers/midnight-drums.svg",
    downloadKey: "products/midnight-drums-vol-1/midnight-drums-vol-1.zip",
    compatibility: ["WAV", "44.1kHz", "24-bit"],
    featured: true,
  },
  {
    id: "p004",
    title: "Silver Loop Archive",
    slug: "silver-loop-archive",
    categoryId: "packs",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "50 melodic loops with stems.",
    longDescription:
      "Song-starter loops and stems built around keys, bells, and ambient textures for quick arrangement ideas.",
    isFree: false,
    price: 29,
    cover: "/covers/silver-loop.svg",
    downloadKey: "products/silver-loop-archive/silver-loop-archive.zip",
    compatibility: ["WAV", "MIDI"],
  },
  {
    id: "p005",
    title: "Kick Vault Lite",
    slug: "kick-vault-lite",
    categoryId: "oneshots",
    type: "oneshot",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "40 clean kick one-shots.",
    longDescription:
      "A lightweight free pack of punchy kicks that layer cleanly in trap, house, and hip-hop projects.",
    isFree: true,
    price: 0,
    cover: "/covers/kick-vault-lite.svg",
    downloadKey: "products/kick-vault-lite/kick-vault-lite.zip",
    compatibility: ["WAV", "24-bit"],
  },
  {
    id: "p006",
    title: "Snare Lab 808",
    slug: "snare-lab-808",
    categoryId: "oneshots",
    type: "oneshot",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "80 snare and rim one-shots.",
    longDescription:
      "Tight snare and rim collection with multiple textures for clean layering and punch.",
    isFree: false,
    price: 12,
    cover: "/covers/snare-lab.svg",
    downloadKey: "products/snare-lab-808/snare-lab-808.zip",
    compatibility: ["WAV", "24-bit"],
  },
  {
    id: "p007",
    title: "Channel Rack Tee",
    slug: "channel-rack-tee",
    categoryId: "merch",
    type: "merch",
    fulfillment: "physical",
    isPurchasable: false,
    shortDescription: "Heavyweight black tee.",
    longDescription:
      "Minimal front print, DAW-inspired back grid. Heavyweight cotton cut for studio and street.",
    isFree: false,
    price: 38,
    cover: "/covers/channel-rack-tee.svg",
    compatibility: ["S", "M", "L", "XL"],
    statusLabel: "Shipping setup pending",
  },
  {
    id: "p008",
    title: "808bytes Sticker Pack",
    slug: "808bytes-sticker-pack",
    categoryId: "merch",
    type: "merch",
    fulfillment: "physical",
    isPurchasable: false,
    shortDescription: "5 matte studio stickers.",
    longDescription:
      "Laptop-safe matte vinyl sticker set with 5 icon designs based on the track lane system.",
    isFree: false,
    price: 9,
    cover: "/covers/sticker-pack.svg",
    compatibility: ["Matte vinyl"],
    featured: true,
    statusLabel: "Shipping setup pending",
  },
];

export const getFeaturedProducts = (): Product[] =>
  products.filter((product) => product.featured);

export const getProductsByCategory = (categoryId: string): Product[] => {
  if (categoryId === "featured") {
    return getFeaturedProducts();
  }

  return products.filter((product) => product.categoryId === categoryId);
};

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((product) => product.slug === slug);
