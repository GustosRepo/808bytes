import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout Success",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutSuccessLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
