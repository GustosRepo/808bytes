import type { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import { songPromo } from "@/lib/promo-content";

const metaPixelId = "1083388787460947";

export const metadata: Metadata = {
  title: `${songPromo.title} by ${songPromo.artist}`,
  description: songPromo.subtitle,
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: `${songPromo.title} by ${songPromo.artist}`,
    description: songPromo.subtitle,
    images: [songPromo.coverArt],
  },
};

export default function ListenPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-6">
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
          fbq('track', 'ViewContent', {content_name: '${songPromo.title}', content_category: 'music'});
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" height="1" src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`} style={{ display: "none" }} width="1" />
      </noscript>
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-white/55">
          <span>{songPromo.releaseLine}</span>
          <span>Ad landing</span>
        </div>

        <div className="mt-8">
          <div className="relative aspect-square overflow-hidden rounded-[26px] border border-white/10 bg-[#141414] shadow-[0_28px_80px_rgba(0,0,0,0.62)]">
            <Image alt={`${songPromo.title} cover art`} className="object-cover" fill priority src={songPromo.coverArt} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1db954]">{songPromo.artist}</p>
              <h1 className="mt-2 text-5xl font-black leading-[0.9] tracking-normal [font-family:var(--font-heading)]">
                {songPromo.title}
              </h1>
            </div>
          </div>

          <p className="mt-5 text-center text-base font-semibold leading-7 text-white/68">{songPromo.subtitle}</p>
        </div>

        <div className="mt-7 grid gap-3">
          {songPromo.links.map((link) => (
            <a
              className="group flex min-h-16 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.11] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              data-analytics="promo_platform_click"
              data-analytics-label={link.label}
              href={link.href}
              key={link.label}
              rel="noopener noreferrer"
              style={{ boxShadow: `inset 4px 0 0 ${link.accent}` }}
              target="_blank"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-black" style={{ backgroundColor: link.accent }}>
                {link.label.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black leading-none">{link.label}</span>
                <span className="mt-1 block text-sm font-semibold text-white/55">{link.description}</span>
              </span>
              <span aria-hidden="true" className="text-2xl leading-none text-white/45 transition group-hover:translate-x-1 group-hover:text-white">
                &rarr;
              </span>
            </a>
          ))}
        </div>

        {songPromo.previewUrl ? (
          <audio className="mt-6 w-full" controls preload="none" src={songPromo.previewUrl}>
            <a href={songPromo.previewUrl}>Play preview</a>
          </audio>
        ) : null}

        <footer className="mt-auto pt-8 text-center text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/35">
          808bytes
        </footer>
      </section>
    </main>
  );
}
