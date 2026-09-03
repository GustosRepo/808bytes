import Link from "next/link";
import { policyLinks, type PolicyPageContent } from "@/lib/site-content";

type PolicyPageProps = {
  content: PolicyPageContent;
};

export default function PolicyPage({ content }: PolicyPageProps) {
  return (
    <main className="min-h-screen bg-[#f2efe7] px-4 py-8 text-[#151515] sm:px-6">
      <section className="mx-auto max-w-5xl border border-[#151515] bg-white p-4 shadow-[6px_6px_0_#151515] sm:p-7 sm:shadow-[10px_10px_0_#151515]">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]" aria-label="Policy navigation">
          <Link className="inline-flex min-h-11 items-center border border-[#151515] bg-[#151515] px-3 py-2 text-white" href="/">
            808bytes
          </Link>
          {policyLinks.map((link) => (
            <Link className="inline-flex min-h-11 items-center border border-[#d8d0c0] px-3 py-2 text-[#504d45] transition hover:border-[#151515]" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">{content.eyebrow}</p>
          <h1 className="mt-3 text-5xl font-bold leading-none [font-family:var(--font-heading)] sm:text-6xl">{content.title}</h1>
          <p className="mt-4 text-base leading-7 text-[#5f605c]">{content.description}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-[#7a756b]">Last updated: {content.updated}</p>
        </div>

        <div className="mt-8 grid gap-4">
          {content.sections.map((section) => (
            <section className="border border-[#d8d0c0] bg-[#fbfaf6] p-4" key={section.heading}>
              <h2 className="text-2xl font-bold leading-none [font-family:var(--font-heading)]">{section.heading}</h2>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-[#5f5d56]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 border border-[#151515] bg-[#151515] p-4 text-sm text-white">
          <p className="font-bold uppercase tracking-[0.12em] text-[#78dcca]">Need help?</p>
          <p className="mt-2 text-[#e7e1d4]">
            Email <a className="inline-flex min-h-11 items-center underline decoration-[#78dcca] underline-offset-4" href="mailto:help@808bytes.com">help@808bytes.com</a> with your order email and a short description.
          </p>
        </div>
      </section>
    </main>
  );
}
