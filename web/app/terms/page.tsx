import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";
import { policyPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Terms of Use | 808bytes",
  description: policyPages.terms.description,
};

export default function TermsPage() {
  return <PolicyPage content={policyPages.terms} />;
}
