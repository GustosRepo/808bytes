import Link from "next/link";
import { policyLinks, siteConfig } from "@/lib/site-content";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#151515] bg-[#151515] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 text-xs font-bold uppercase tracking-[0.14em]">
        <Link className="inline-flex min-h-11 items-center text-[#78dcca]" href="/">808bytes</Link>
        <Link className="inline-flex min-h-11 items-center text-[#d9d4c8] transition hover:text-white" href="/sounds">Sounds</Link>
        <Link className="inline-flex min-h-11 items-center text-[#d9d4c8] transition hover:text-white" href="/about">About</Link>
        {policyLinks.map((link) => (
          <Link className="inline-flex min-h-11 items-center text-[#d9d4c8] transition hover:text-white" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
        <a className="inline-flex min-h-11 items-center text-[#d9d4c8] underline decoration-[#78dcca] underline-offset-4 transition hover:text-white" data-analytics="support_email" href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>
      </div>
    </footer>
  );
}
