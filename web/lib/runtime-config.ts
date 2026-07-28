export const isProductionDeployment = () =>
  process.env.VERCEL_ENV === "production" ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

export const isMockCheckoutEnabled = () =>
  process.env.COMMERCE_MOCK_CHECKOUT === "true" && !isProductionDeployment();

export const isReceiptEmailMockEnabled = () =>
  process.env.RECEIPT_EMAIL_MOCK === "true" && !isProductionDeployment();
