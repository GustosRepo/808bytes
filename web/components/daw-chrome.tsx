import Link from "next/link";

type DawMenuItem = {
  label: string;
  href?: string;
};

type DawMenuBarProps = {
  items: DawMenuItem[];
  activeLabel?: string;
};

type DawMeterProps = {
  label: string;
  bars?: number;
  className?: string;
  accent?: string;
};

export const dawButtonClass =
  "inline-flex min-h-11 items-center border border-[#4a4c50] bg-[#24262a] px-3 py-2 text-[0.68rem] font-semibold uppercase text-[var(--text)] transition hover:border-[#6a6d72] hover:bg-[#303236]";

export function DawMenuBar({ items, activeLabel }: DawMenuBarProps) {
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#2a2d31] bg-[#0b0c0e] px-3 text-[0.66rem] uppercase text-[#aaa69e]">
      <Link className="inline-flex min-h-11 items-center px-1 [font-family:var(--font-heading)] text-sm font-bold text-[#eee8dc] transition hover:text-[var(--accent-cyan)]" href="/">
        808bytes
      </Link>
      {items.map((item) =>
        item.href ? (
          <Link
            className={`inline-flex min-h-11 items-center px-2.5 transition hover:text-[var(--accent-cyan)] ${activeLabel === item.label ? "text-[var(--accent-cyan)]" : ""}`}
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        ) : (
          <span className={`inline-flex min-h-11 items-center px-1 ${activeLabel === item.label ? "text-[var(--accent-cyan)]" : ""}`} key={item.label}>
            {item.label}
          </span>
        ),
      )}
    </div>
  );
}

export function DawButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className={dawButtonClass} href={href}>
      {children}
    </Link>
  );
}

export function DawMeter({ label, bars = 22, className = "", accent = "var(--accent-green)" }: DawMeterProps) {
  return (
    <div className={`ml-auto hidden min-w-[160px] items-end gap-[3px] border border-[#4a4c50] bg-[#0b0c0e] px-2 py-1 md:flex ${className}`}>
      {Array.from({ length: bars }).map((_, index) => (
        <span
          aria-hidden="true"
          className="w-1"
          key={`${label}-meter-${index}`}
          style={{
            height: 5 + ((index * 7) % 24),
            opacity: index > bars - 5 ? 0.45 : 0.9,
            backgroundColor: accent,
          }}
        />
      ))}
      <span className="ml-2 text-[0.62rem] text-[#9d9991]">{label}</span>
    </div>
  );
}
