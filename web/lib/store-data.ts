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
    id: "sauce-packets",
    name: "Sauce Packets",
    slug: "sauce-packets",
    accent: "var(--accent-amber)",
    description: "Individual Sauce drops for production-ready texture and bounce.",
  },
  {
    id: "sauce-box",
    name: "Sauce Box",
    slug: "sauce-box",
    accent: "var(--accent-green)",
    description: "The full Sauce suite bundled in one download.",
  },
];

const sauceCompatibility = ["Digital download", "ZIP"];

export const products: Product[] = [
  {
    id: "hot-packet-pro",
    title: "Hot Packet",
    slug: "hot-packet",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "A high-energy Sauce packet built for immediate heat.",
    longDescription:
      "Hot Packet is a focused Sauce drop for adding instant energy, punch, and movement to modern production sessions.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/hot-packet/hot-packet.zip",
    compatibility: sauceCompatibility,
    featured: true,
    badge: "PRO",
  },
  {
    id: "secret-sauce-pro",
    title: "Secret Sauce",
    slug: "secret-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "A signature Sauce packet for polished bounce and character.",
    longDescription:
      "Secret Sauce is designed as a go-to flavor pack for bringing character, finish, and musical glue into a beat quickly.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/secret-sauce/secret-sauce.zip",
    compatibility: sauceCompatibility,
    featured: true,
    badge: "PRO",
  },
  {
    id: "sweet-sauce-pro",
    title: "Sweet Sauce",
    slug: "sweet-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "Smooth melodic Sauce for softer pockets and glossy ideas.",
    longDescription:
      "Sweet Sauce focuses on smoother production moments, adding polish and melodic color without crowding the arrangement.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/sweet-sauce/sweet-sauce.zip",
    compatibility: sauceCompatibility,
    featured: true,
    badge: "PRO",
  },
  {
    id: "thick-sauce-pro",
    title: "Thick Sauce",
    slug: "thick-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "Dense Sauce for heavier drums, stacks, and low-end weight.",
    longDescription:
      "Thick Sauce is built for weight and presence, helping beats feel fuller while keeping the workflow direct.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/thick-sauce/thick-sauce.zip",
    compatibility: sauceCompatibility,
    badge: "PRO",
  },
  {
    id: "glue-sauce-pro",
    title: "Glue Sauce",
    slug: "glue-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "A Sauce packet for cohesion, transitions, and mix-ready feel.",
    longDescription:
      "Glue Sauce is aimed at tying sections together and giving loops, drums, and melodies a more finished feel.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/glue-sauce/glue-sauce.zip",
    compatibility: sauceCompatibility,
    badge: "PRO",
  },
  {
    id: "drip-sauce-pro",
    title: "Drip Sauce",
    slug: "drip-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "Stylized Sauce for ear candy, bounce, and standout details.",
    longDescription:
      "Drip Sauce is for adding memorable detail and movement so a simple idea feels more styled and intentional.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/drip-sauce/drip-sauce.zip",
    compatibility: sauceCompatibility,
    badge: "PRO",
  },
  {
    id: "extra-sauce-pro",
    title: "Extra Sauce",
    slug: "extra-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "More Sauce for producers who want extra texture and variation.",
    longDescription:
      "Extra Sauce expands the palette with additional production-ready pieces for building variation fast.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/extra-sauce/extra-sauce.zip",
    compatibility: sauceCompatibility,
    badge: "PRO",
  },
  {
    id: "light-sauce-pro",
    title: "Light Sauce",
    slug: "light-sauce",
    categoryId: "sauce-packets",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "A lighter Sauce packet for subtle polish and clean movement.",
    longDescription:
      "Light Sauce is built for subtle enhancement, giving tracks a cleaner lift without overpowering the core idea.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-packet.svg",
    downloadKey: "downloads/light-sauce/light-sauce.zip",
    compatibility: sauceCompatibility,
    badge: "PRO",
  },
  {
    id: "sauce-box-suite",
    title: "Sauce Box",
    slug: "sauce-box",
    categoryId: "sauce-box",
    type: "pack",
    fulfillment: "digital",
    isPurchasable: true,
    shortDescription: "The complete Sauce suite in one bundle.",
    longDescription:
      "Sauce Box bundles the full Sauce collection into one package for producers who want the complete toolkit.",
    isFree: false,
    price: 19.99,
    cover: "/covers/sauce-box.svg",
    downloadKey: "downloads/sauce-box/sauce-box.zip",
    compatibility: sauceCompatibility,
    featured: true,
    badge: "SUITE",
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
