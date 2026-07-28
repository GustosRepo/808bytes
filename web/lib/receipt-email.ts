import type { OrderRecord } from "@/lib/commerce";
import { isReceiptEmailMockEnabled } from "@/lib/runtime-config";

type ReceiptDownload = {
  productId: string;
  expiresAt: string;
  url: string;
};

type SendReceiptEmailParams = {
  order: OrderRecord;
  downloads: ReceiptDownload[];
  orderAccessUrl?: string;
};

const getReceiptEmailConfig = () => ({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.RECEIPT_EMAIL_FROM,
  mock: isReceiptEmailMockEnabled(),
});

export const hasReceiptEmailConfig = () => {
  const config = getReceiptEmailConfig();
  return config.mock || Boolean(config.apiKey && config.from);
};

const buildReceiptText = ({ order, downloads, orderAccessUrl }: SendReceiptEmailParams) => {
  const lines = [
    `Order ${order.id}`,
    `Status: ${order.status}`,
    `Total: $${order.total.toFixed(2)} ${order.currency}`,
    "",
    "Items:",
    ...order.items.map((item) => `- ${item.title} x ${item.quantity}`),
  ];

  if (downloads.length > 0) {
    lines.push("", "Downloads:");
    lines.push(...downloads.map((download) => `- ${download.url} (grant expires ${download.expiresAt})`));
  }

  if (orderAccessUrl) {
    lines.push("", `Order access: ${orderAccessUrl}`);
  }

  return lines.join("\n");
};

export const sendReceiptEmail = async (params: SendReceiptEmailParams) => {
  const config = getReceiptEmailConfig();

  if (config.mock) {
    return {
      mode: "mock" as const,
      delivered: true,
      providerId: null,
    };
  }

  if (!config.apiKey || !config.from) {
    return {
      mode: "disabled" as const,
      delivered: false,
      providerId: null,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: params.order.email,
      subject: `808bytes order ${params.order.id}`,
      text: buildReceiptText(params),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

  if (!response.ok) {
    throw new Error(payload.message ?? "Receipt email provider rejected the message.");
  }

  return {
    mode: "resend" as const,
    delivered: true,
    providerId: payload.id ?? null,
  };
};
