import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";
import { policyPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Legal | 808bytes",
  description: policyPages.legal.description,
};

export default function LegalPage() {
  return <PolicyPage content={policyPages.legal} />;
}
