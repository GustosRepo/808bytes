export const siteConfig = {
  name: "808bytes",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://808bytes.com",
  description: "Interactive music workstation and storefront for Sauce packs, plugins, one-shots, and producer tools.",
  supportEmail: "help@808bytes.com",
};

export const policyLinks = [
  { label: "Support", href: "/support" },
  { label: "Privacy", href: "/privacy" },
  { label: "Refunds", href: "/refunds" },
  { label: "Terms", href: "/terms" },
  { label: "Legal", href: "/legal" },
];

export type PolicySection = {
  heading: string;
  body: string[];
};

export type PolicyPageContent = {
  title: string;
  eyebrow: string;
  description: string;
  updated: string;
  sections: PolicySection[];
};

export const policyPages = {
  support: {
    title: "Support",
    eyebrow: "Customer help",
    description: "Help with checkout, receipts, downloads, and digital delivery for 808bytes products.",
    updated: "August 24, 2026",
    sections: [
      {
        heading: "Contact",
        body: [
          `Email ${siteConfig.supportEmail} with your order email, order number if available, and a short description of the issue.`,
          "Support covers checkout access, receipt links, download delivery, corrupted files, and product access questions.",
        ],
      },
      {
        heading: "Response window",
        body: [
          "Most support requests are reviewed within 2 business days.",
          "Delivery issues for completed orders are prioritized so customers can access purchased files quickly.",
        ],
      },
      {
        heading: "Downloads",
        body: [
          "Download links may expire for security. If a valid order link has expired, contact support from the same email used at checkout.",
          "Keep a local backup of downloaded files after successful delivery.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    eyebrow: "Privacy",
    description: "How 808bytes handles account-free checkout information, order records, analytics events, and support emails.",
    updated: "August 24, 2026",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "We collect information needed to operate the store, including checkout email, cart contents, order records, download grant status, and support messages you send.",
          "Payments are processed by the payment provider. 808bytes does not store full card numbers.",
        ],
      },
      {
        heading: "How we use information",
        body: [
          "We use order information to process checkout, deliver digital products, send receipts, prevent abuse, and provide support.",
          "Basic first-party analytics may be used to understand page views, product interest, checkout starts, and download flow reliability.",
        ],
      },
      {
        heading: "Sharing",
        body: [
          "We share information with service providers only when needed for checkout, email delivery, storage, analytics, fraud prevention, or site hosting.",
          "We do not sell personal information.",
        ],
      },
      {
        heading: "Retention and requests",
        body: [
          `For privacy questions or access/deletion requests, contact ${siteConfig.supportEmail}. Some order records may be retained when needed for tax, fraud prevention, accounting, or legal obligations.`,
        ],
      },
    ],
  },
  refunds: {
    title: "Refund Policy",
    eyebrow: "Digital products",
    description: "Refund and delivery policy for downloadable 808bytes products.",
    updated: "August 24, 2026",
    sections: [
      {
        heading: "Digital delivery",
        body: [
          "Most 808bytes products are delivered as digital downloads. Once a digital product is delivered or downloaded, refunds are limited because files cannot be returned.",
          "If a download link fails, the wrong file is delivered, or the product is unusable because of a delivery issue, contact support so we can fix access or evaluate a refund.",
        ],
      },
      {
        heading: "Refund review",
        body: [
          `Send refund requests to ${siteConfig.supportEmail} with your order email, order number if available, and the reason for the request.`,
          "Approved refunds are returned through the original payment method when supported by the payment provider.",
        ],
      },
      {
        heading: "Preview-only items",
        body: [
          "Products marked preview-only are not available for checkout. Physical merch is not sold until shipping terms are published.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    eyebrow: "Legal",
    description: "Terms for using the 808bytes website, workstation, checkout, and digital product downloads.",
    updated: "August 24, 2026",
    sections: [
      {
        heading: "Site use",
        body: [
          "You may use the site and interactive workstation for personal browsing, product preview, and checkout.",
          "Do not attempt to disrupt the site, bypass checkout, abuse download links, or access administrative areas without permission.",
        ],
      },
      {
        heading: "Digital products",
        body: [
          "Purchased downloads are licensed to the customer for personal or commercial music production use unless a specific product page says otherwise.",
          "You may not resell, redistribute, repackage, or share raw product files as standalone assets.",
        ],
      },
      {
        heading: "Availability",
        body: [
          "Product availability, pricing, and descriptions may change. We may update or remove products and site features at any time.",
          "If checkout or delivery fails, the available remedy is correction of access, replacement delivery, or refund review according to the refund policy.",
        ],
      },
    ],
  },
  legal: {
    title: "Legal",
    eyebrow: "Store policies",
    description: "Legal, support, refund, and privacy information for 808bytes.",
    updated: "August 24, 2026",
    sections: [
      {
        heading: "Policy hub",
        body: [
          "This hub links to the current customer-facing store policies for support, privacy, refunds, and site terms.",
          "For questions about an order or policy, contact support from the email address used at checkout.",
        ],
      },
    ],
  },
} satisfies Record<string, PolicyPageContent>;
