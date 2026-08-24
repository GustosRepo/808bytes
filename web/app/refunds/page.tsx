import type { Metadata } from "next";
import PolicyPage from "@/components/policy-page";
import { policyPages } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Refund Policy | 808bytes",
  description: policyPages.refunds.description,
};

export default function RefundsPage() {
  return <PolicyPage content={policyPages.refunds} />;
}
