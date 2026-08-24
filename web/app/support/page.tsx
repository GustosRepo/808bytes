import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";
import { policyPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Support | 808bytes",
  description: policyPages.support.description,
};

export default function SupportPage() {
  return <PolicyPage content={policyPages.support} />;
}
