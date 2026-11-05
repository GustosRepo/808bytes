import { describe, expect, it } from "vitest";
import { inventoryToProduct, type ProductInventoryRecord } from "@/lib/commerce";

const baseRecord: ProductInventoryRecord = {
  productId: "test-pack",
  sku: "test-pack",
  title: "Test Pack",
  slug: "test-pack",
  categoryId: "sauce-packets",
  type: "pack",
  fulfillment: "digital",
  shortDescription: "Short",
  longDescription: "Long",
  price: 19.99,
  isFree: false,
  isActive: true,
  isPurchasable: true,
  cover: "/covers/sauce-packet.svg",
  objectKey: "downloads/test-pack/test-pack.zip",
  compatibility: ["Digital download", "ZIP"],
  fileFormats: [],
  version: null,
  downloadSizeLabel: null,
  licenseSummary: null,
  previewUrl: null,
  featured: false,
  badge: null,
  statusLabel: null,
  stockQuantity: null,
  lowStockThreshold: null,
  sortOrder: 0,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("inventoryToProduct media metadata", () => {
  it("omits metadata fields when unset", () => {
    const product = inventoryToProduct(baseRecord);

    expect(product.fileFormats).toBeUndefined();
    expect(product.version).toBeUndefined();
    expect(product.downloadSizeLabel).toBeUndefined();
    expect(product.licenseSummary).toBeUndefined();
    expect(product.previewUrl).toBeUndefined();
  });

  it("maps metadata fields when set", () => {
    const product = inventoryToProduct({
      ...baseRecord,
      fileFormats: ["WAV", "MIDI"],
      version: "1.2",
      downloadSizeLabel: "250 MB",
      licenseSummary: "Royalty-free for commercial productions.",
      previewUrl: "/previews/test-pack.mp3",
    });

    expect(product.fileFormats).toEqual(["WAV", "MIDI"]);
    expect(product.version).toBe("1.2");
    expect(product.downloadSizeLabel).toBe("250 MB");
    expect(product.licenseSummary).toBe("Royalty-free for commercial productions.");
    expect(product.previewUrl).toBe("/previews/test-pack.mp3");
  });

  it("keeps purchasability derived from active and purchasable flags", () => {
    expect(inventoryToProduct({ ...baseRecord, isActive: false }).isPurchasable).toBe(false);
    expect(inventoryToProduct({ ...baseRecord, isPurchasable: false }).isPurchasable).toBe(false);
  });
});
