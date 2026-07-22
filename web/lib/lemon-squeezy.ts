import { createHmac, timingSafeEqual } from "node:crypto";
import type { CartQuote } from "@/lib/commerce";

type LemonCheckoutResponse = {
  data?: {
    id?: string;
    attributes?: {
      url?: string;
    };
  };
  errors?: Array<{ detail?: string; title?: string }>;
};

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: {
      order_id?: string;
    };
  };
};

const asLemonWebhookPayload = (payload: unknown) => payload as LemonWebhookPayload;

const LEMON_API_URL = "https://api.lemonsqueezy.com/v1/checkouts";

export const hasLemonSqueezyCheckoutConfig = () =>
  Boolean(
    process.env.LEMON_SQUEEZY_API_KEY &&
      process.env.LEMON_SQUEEZY_STORE_ID &&
      process.env.LEMON_SQUEEZY_CHECKOUT_VARIANT_ID,
  );

export const hasLemonSqueezyWebhookConfig = () =>
  Boolean(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET);

const toCents = (value: number) => Math.round(value * 100);

const buildDescription = (quote: CartQuote) =>
  quote.items.map((item) => `${item.title} x ${item.quantity}`).join("\n");

const getCheckoutVariantId = () => process.env.LEMON_SQUEEZY_CHECKOUT_VARIANT_ID ?? "";

const getEnabledVariants = () => {
  const variantId = Number.parseInt(getCheckoutVariantId(), 10);

  return Number.isFinite(variantId) ? [variantId] : undefined;
};

export const createLemonSqueezyCheckout = async (params: {
  email: string;
  orderId: string;
  quote: CartQuote;
  successUrl: string;
}) => {
  if (!hasLemonSqueezyCheckoutConfig()) {
    throw new Error(
      "Lemon Squeezy is not configured. Set LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, and LEMON_SQUEEZY_CHECKOUT_VARIANT_ID.",
    );
  }

  const response = await fetch(LEMON_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          custom_price: toCents(params.quote.total),
          checkout_data: {
            email: params.email,
            custom: {
              order_id: params.orderId,
            },
          },
          product_options: {
            name: "808bytes digital order",
            description: buildDescription(params.quote),
            redirect_url: params.successUrl,
            receipt_button_text: "Open order",
            receipt_link_url: params.successUrl,
            enabled_variants: getEnabledVariants(),
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: process.env.LEMON_SQUEEZY_STORE_ID,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: getCheckoutVariantId(),
            },
          },
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as LemonCheckoutResponse;

  if (!response.ok) {
    const error = payload.errors?.[0];
    throw new Error(error?.detail ?? error?.title ?? "Lemon Squeezy checkout creation failed.");
  }

  const checkoutUrl = payload.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error("Lemon Squeezy checkout response did not include a checkout URL.");
  }

  return {
    checkoutId: payload.data?.id ?? null,
    checkoutUrl,
  };
};

export const verifyLemonSqueezyWebhookSignature = (payload: string, signature: string) => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
};

export const getOrderIdFromLemonSqueezyWebhook = (payload: LemonWebhookPayload) =>
  payload.meta?.custom_data?.order_id ?? null;

export const getLemonSqueezyEventName = (payload: LemonWebhookPayload) =>
  payload.meta?.event_name ?? null;

export const parseLemonSqueezyWebhookPayload = (payload: string) =>
  asLemonWebhookPayload(JSON.parse(payload) as unknown);
