import Link from "next/link";
import { DawButtonLink, DawMenuBar, DawMeter } from "@/components/daw-chrome";

const sessionTracks = [
  {
    number: "01",
    title: "Origin",
    accent: "var(--accent-cyan)",
    marker: "START POINT",
    body: "808bytes is built like a producer workspace: fast, visual, and tuned for people who want usable sounds without digging through a generic shop.",
    visual: "waveform",
  },
  {
    number: "02",
    title: "Sound Philosophy",
    accent: "var(--accent-green)",
    marker: "TASTE ENGINE",
    body: "Every release should feel direct. Punchy drums, textured plugins, clean one-shots, and loops that leave room for your own bounce.",
    visual: "steps",
  },
  {
    number: "03",
    title: "Tools, Packs, VSTs",
    accent: "var(--accent-amber)",
    marker: "PLUGIN CHAIN",
    body: "The catalog moves between VSTs, kits, one-shots, and merch, but the interface treats everything like part of one project session.",
    visual: "plugin",
  },
  {
    number: "04",
    title: "Community and Releases",
    accent: "var(--accent-red)",
    marker: "OUTPUT BUS",
    body: "The roadmap is simple: ship useful drops, keep the free lane strong, listen to producers, and make the store feel like a place you actually want to browse.",
    visual: "meters",
  },
];

const browserRows = ["ABOUT_808BYTES.flp", "Session notes", "Release log", "Free lane", "Producer feedback"];

const renderTrackVisual = (track: (typeof sessionTracks)[number]) => {
  if (track.visual === "steps") {
    return (
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 24 }).map((_, index) => (
          <span
            aria-hidden="true"
            className="h-7 border border-black/40"
            key={`${track.number}-step-${index}`}
            style={{
              backgroundColor: (index + Number(track.number)) % 4 === 0 ? track.accent : "#2b2d30",
              opacity: (index + Number(track.number)) % 4 === 0 ? 0.95 : 0.75,
            }}
          />
        ))}
      </div>
    );
  }

  if (track.visual === "plugin") {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="border border-[#3d3f43] bg-[#151619] p-3">
          <p className="text-[0.62rem] uppercase text-[#9b978e]">Macro rack</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {["LOW", "AIR", "SAT", "MIX"].map((label, index) => (
              <div className="text-center" key={label}>
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#595a5d] bg-[radial-gradient(circle_at_35%_30%,#464845,#17191c_68%)]">
                  <span
                    className="block h-5 w-[2px] origin-bottom"
                    style={{ backgroundColor: track.accent, transform: `rotate(${-38 + index * 24}deg)` }}
                  />
                </div>
                <p className="mt-1 text-[0.6rem] text-[#9b978e]">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-12 items-end gap-1 border border-[#3d3f43] bg-[#151619] px-2 py-3 sm:flex">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              aria-hidden="true"
              className="w-2"
              key={`${track.number}-plugin-meter-${index}`}
              style={{ height: 18 + index * 15, backgroundColor: track.accent }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (track.visual === "meters") {
    return (
      <div className="flex h-28 items-end gap-2 border border-[#3d3f43] bg-[#151619] px-4 py-3">
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            aria-hidden="true"
            className="w-2 rounded-sm"
            key={`${track.number}-meter-${index}`}
            style={{
              height: 14 + ((index * 11 + 9) % 82),
              backgroundColor: index > 21 ? "var(--accent-amber)" : track.accent,
              opacity: index % 5 === 0 ? 0.5 : 0.88,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-28 items-center gap-1 overflow-hidden border border-[#3d3f43] bg-[#151619] px-4">
      {Array.from({ length: 42 }).map((_, index) => (
        <span
          aria-hidden="true"
          className="w-2 rounded-sm"
          key={`${track.number}-wave-${index}`}
          style={{
            height: 22 + ((index * 13 + Number(track.number) * 7) % 78),
            backgroundColor: track.accent,
            opacity: index % 6 === 0 ? 0.45 : 0.88,
          }}
        />
      ))}
    </div>
  );
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="mx-auto min-h-screen max-w-[1440px] border-x border-black bg-[var(--frame)]">
        <header className="sticky top-0 z-20 border-b border-[#090a0c] bg-[#141518] shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <DawMenuBar
            activeLabel="About"
            items={[
              { label: "File" },
              { label: "Edit" },
              { label: "View" },
              { label: "Session" },
              { label: "About" },
            ]}
          />

          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <DawButtonLink href="/">Back to playlist</DawButtonLink>
            <div className="grid grid-cols-[auto_auto] overflow-hidden border border-[#4a4c50] bg-[#1b1d20] text-[0.68rem]">
              <span className="border-r border-[#383b3f] px-2 py-1 text-[#9a9890]">PROJECT</span>
              <span className="px-3 py-1 font-semibold text-[var(--accent-cyan)]">ABOUT_808BYTES.flp</span>
              <span className="border-t border-r border-[#383b3f] px-2 py-1 text-[#9a9890]">MODE</span>
              <span className="border-t border-[#383b3f] px-3 py-1 font-semibold">SESSION NOTES</span>
            </div>
            <DawMeter bars={24} className="min-w-[170px]" label="ABOUT BUS" />
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[clamp(180px,17vw,240px)_minmax(0,1fr)]">
          <aside className="border-r border-[#090a0c] bg-[#151618]">
            <div className="border-b border-[#33363a] bg-[#1f2023] px-3 py-2">
              <p className="text-[0.67rem] uppercase text-[#96938b]">Browser</p>
              <h2 className="text-lg font-semibold [font-family:var(--font-heading)]">Project files</h2>
            </div>
            <div className="p-2">
              <p className="border border-[#34363a] bg-[#24262a] px-2 py-1 text-[0.68rem] font-semibold uppercase text-[#d4cec2]">
                808bytes session
              </p>
              {browserRows.map((row, index) => (
                <div
                  className="flex items-center justify-between border-x border-b border-[#2d3034] bg-[#17191c] px-3 py-1.5 text-[0.76rem] font-semibold text-[#ddd6c8]"
                  key={row}
                >
                  <span>{row}</span>
                  <span className="h-2 w-5" style={{ backgroundColor: sessionTracks[index - 1]?.accent ?? "var(--accent-cyan)" }} />
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <section
              className="relative min-h-[min(620px,calc(100vh-92px))] overflow-hidden border-b border-[#090a0c] bg-[#121315]"
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgba(132,130,120,0.14) 0, rgba(132,130,120,0.14) 1px, transparent 1px, transparent 54px), repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 36px), #121315",
              }}
            >
              <div className="absolute inset-x-0 top-0 grid grid-cols-[clamp(120px,13vw,168px)_repeat(12,minmax(36px,1fr))] border-b border-[#34363a] bg-[#1c1e21] text-[0.65rem] text-[#9b978e]">
                <span className="border-r border-[#34363a] px-3 py-1.5 uppercase">Arrangement</span>
                {Array.from({ length: 12 }).map((_, index) => (
                  <span className="border-r border-[#34363a] px-2 py-1.5" key={`about-bar-${index}`}>
                    {index + 1}
                  </span>
                ))}
              </div>

              <div className="relative z-10 grid min-h-[min(620px,calc(100vh-92px))] content-center gap-5 px-4 pt-14 pb-8 md:px-8">
                <div className="max-w-4xl">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--accent-cyan)]">Session loaded</p>
                  <h1 className="mt-2 text-5xl font-bold leading-[0.92] [font-family:var(--font-heading)] sm:text-7xl lg:text-8xl">
                    ABOUT_808BYTES.flp
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cbc5ba] md:text-lg">
                    A store built like a beat session: dark lanes, bright clips, useful sounds, and a workflow made for producers who move fast.
                  </p>
                </div>

                <div className="grid max-w-5xl gap-3 md:grid-cols-[1fr_280px]">
                  <div className="border border-[#3d3f43] bg-[#101113]/95 p-3">
                    <div className="flex items-center justify-between border-b border-[#34363a] pb-2">
                      <span className="text-[0.67rem] uppercase text-[#96938b]">Session notes</span>
                      <span className="text-[0.67rem] text-[var(--accent-amber)]">130 BPM</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-[#cbc5ba] sm:grid-cols-2">
                      <span>Purpose: make browsing feel like producing.</span>
                      <span>Format: clips, inserts, tracks, and meters.</span>
                      <span>Rule: abstract is fine when the interface stays readable.</span>
                      <span>Output: tools and sounds that do not waste the session.</span>
                    </div>
                  </div>

                  <div className="border border-[#3d3f43] bg-[#101113]/95 p-3">
                    <p className="text-[0.67rem] uppercase text-[#96938b]">Now playing</p>
                    <div className="mt-3 flex h-24 items-end gap-1">
                      {Array.from({ length: 18 }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className="w-2 bg-[var(--accent-green)]"
                          key={`hero-meter-${index}`}
                          style={{ height: 12 + ((index * 9) % 72), opacity: index % 4 === 0 ? 0.5 : 0.88 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-[#121315]">
              {sessionTracks.map((track) => (
                <article className="grid min-h-[230px] grid-cols-1 border-b border-[#090a0c] lg:grid-cols-[clamp(140px,14vw,180px)_minmax(0,1fr)]" key={track.number}>
                  <aside className="border-r border-[#34363a] bg-[#202124]">
                    <div className="flex items-center gap-2 border-b border-[#34363a] px-3 py-2">
                      <span className="h-3 w-3 border border-black" style={{ backgroundColor: track.accent }} />
                      <span className="text-[0.68rem] uppercase text-[#aaa69d]">Track {track.number}</span>
                    </div>
                    <div className="px-3 py-3">
                      <p className="text-[0.66rem] font-semibold uppercase text-[#9b978e]">{track.marker}</p>
                      <h2 className="mt-1 text-2xl font-semibold [font-family:var(--font-heading)]">{track.title}</h2>
                    </div>
                  </aside>

                  <div
                    className="grid gap-4 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)] md:p-5"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, rgba(132,130,120,0.11) 0, rgba(132,130,120,0.11) 1px, transparent 1px, transparent 54px), #181a1d",
                    }}
                  >
                    <div className="self-center">
                      <p className="max-w-xl text-base leading-relaxed text-[#d8d2c6]">{track.body}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {["session", "sound", "workflow"].map((tag) => (
                          <span className="border border-[#3d3f43] bg-[#151619] px-2 py-1 text-[0.64rem] font-semibold uppercase text-[#aaa59b]" key={`${track.number}-${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="self-center">{renderTrackVisual(track)}</div>
                  </div>
                </article>
              ))}
            </section>

            <section className="grid gap-4 bg-[#151619] p-4 md:grid-cols-[1fr_260px] md:p-6">
              <div className="border border-[#3d3f43] bg-[#101113] p-4">
                <p className="text-[0.67rem] uppercase text-[#96938b]">Session note</p>
                <h2 className="mt-1 text-3xl font-semibold [font-family:var(--font-heading)]">The store should feel playable.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#cbc5ba]">
                  The abstract parts should support the workflow: clips preview the catalog, channels explain the product, and the whole thing keeps the producer in a creative frame.
                </p>
              </div>

              <div className="border border-[#3d3f43] bg-[#101113] p-4">
                <p className="text-[0.67rem] uppercase text-[#96938b]">Output</p>
                <Link
                  className="mt-3 block border border-[var(--commerce)] bg-[var(--commerce)] px-3 py-2 text-center text-sm font-bold uppercase text-[var(--commerce-text)] transition hover:bg-[var(--commerce-hover)]"
                  href="/"
                >
                  Return to playlist
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
