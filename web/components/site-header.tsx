import Link from "next/link";

const navLinks = [
  { label: "Workstation", href: "/#instrument" },
  { label: "Store", href: "/#store" },
  { label: "Sounds", href: "/sounds" },
  { label: "About", href: "/about" },
];

export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[#f7f3ea]/92 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link className="inline-flex min-h-11 items-center [font-family:var(--font-heading)] text-2xl font-bold tracking-normal" href="/">
          808bytes
        </Link>
        <div className="hidden items-center gap-6 text-sm font-semibold text-[#4f504d] md:flex">
          {navLinks.map((link) => (
            <Link className="inline-flex min-h-11 items-center px-1 transition hover:text-black" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <Link
          className="ml-auto inline-flex min-h-11 items-center whitespace-nowrap border border-[#151515] bg-[#151515] px-3 py-2 text-xs font-bold uppercase text-white transition hover:bg-[#2a2a2a] sm:px-4 sm:text-sm"
          data-analytics="nav_shop_sounds"
          href="/#store"
        >
          Shop sounds
        </Link>
      </nav>
    </header>
  );
}
