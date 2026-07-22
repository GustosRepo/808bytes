export type CartItem = {
  productId: string;
  quantity: number;
};

export const CART_STORAGE_KEY = "808bytes_cart_v1";
export const CART_CHANGE_EVENT = "808bytes_cart_change";

const notifyCartChanged = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
};

const normalizeItems = (items: CartItem[]) =>
  items
    .filter((entry) => typeof entry?.productId === "string")
    .map((entry) => ({
      productId: entry.productId,
      quantity: Math.min(99, Math.max(1, Math.floor(entry.quantity || 1))),
    }));

export const readCartItems = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeItems(parsed);
  } catch {
    return [];
  }
};

export const writeCartItems = (items: CartItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeItems(items);
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
  notifyCartChanged();
};

export const clearCartItems = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(CART_STORAGE_KEY);
  notifyCartChanged();
};

export const upsertCartItem = (items: CartItem[], productId: string, delta = 1) => {
  const found = items.find((item) => item.productId === productId);

  if (!found) {
    return normalizeItems([...items, { productId, quantity: Math.max(1, delta) }]);
  }

  return normalizeItems(
    items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(99, Math.max(1, item.quantity + delta)) }
        : item,
    ),
  );
};

export const setCartItemQuantity = (items: CartItem[], productId: string, quantity: number) =>
  normalizeItems(
    items
      .map((item) => (item.productId === productId ? { ...item, quantity: Math.floor(quantity) } : item))
      .filter((item) => item.quantity > 0),
  );
