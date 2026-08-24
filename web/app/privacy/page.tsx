import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";
import { policyPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Privacy Policy | 808bytes",
  description: policyPages.privacy.description,
};

export default function PrivacyPage() {
  return <PolicyPage content={policyPages.privacy} />;
}
