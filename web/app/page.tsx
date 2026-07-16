"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, getFeaturedProducts, products, type Product } from "@/lib/store-data";

const typeLabel: Record<Product["type"], string> = {
  vst: "Plugin",
  pack: "Pack",
  oneshot: "One-shot",
  merch: "Merch",
};

const banks = [
  { id: "kick", label: "Kick", color: "#f05d5e" },
  { id: "clap", label: "Clap", color: "#78dcca" },
  { id: "hats", label: "Hats", color: "#f4c95d" },
  { id: "perc", label: "Perc", color: "#8fa7ff" },
] as const;

type BankId = (typeof banks)[number]["id"];
type Patterns = Record<BankId, number[]>;

const defaultPatterns: Patterns = {
  kick: [0, 8, 10],
  clap: [4, 12],
  hats: [0, 2, 4, 6, 8, 10, 12, 14],
  perc: [7, 15],
};

const knobLabels = ["Tone", "Drive", "Space", "Glue"];
const transportLabels = ["Hit", "Drums", "Melody", "Save"];
const whiteKeys = ["C", "D", "E", "F", "G", "A", "B", "C2", "D2", "E2", "F2", "G2"];
const blackKeys = [
  { note: "C#", left: "7.2%" },
  { note: "D#", left: "15.6%" },
  { note: "F#", left: "32.3%" },
  { note: "G#", left: "40.7%" },
  { note: "A#", left: "49%" },
  { note: "C#2", left: "65.7%" },
  { note: "D#2", left: "74%" },
  { note: "F#2", left: "90.7%" },
] as const;

const noteFrequencies: Record<string, number> = {
  C: 261.63,
  "C#": 277.18,
  D: 293.66,
  "D#": 311.13,
  E: 329.63,
  F: 349.23,
  "F#": 369.99,
  G: 392,
  "G#": 415.3,
  A: 440,
  "A#": 466.16,
  B: 493.88,
  C2: 523.25,
  "C#2": 554.37,
  D2: 587.33,
  "D#2": 622.25,
  E2: 659.25,
  F2: 698.46,
  "F#2": 739.99,
  G2: 783.99,
};

const orderedNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2"];

type AudioEngine = {
  context: AudioContext;
  drumBus: GainNode;
  keyBus: GainNode;
  noiseBuffer: AudioBuffer;
};

const formatPrice = (product: Product) => (product.isFree ? "Free" : `$${product.price}`);

export default function Home() {
  const featuredProducts = useMemo(() => getFeaturedProducts(), []);
  const [activeBank, setActiveBank] = useState<BankId>("kick");
  const [selectedProduct, setSelectedProduct] = useState<Product>(featuredProducts[0] ?? products[0]);
  const [patterns, setPatterns] = useState<Patterns>(defaultPatterns);
  const [activeKeys, setActiveKeys] = useState<string[]>(["C", "E", "G", "B"]);
  const [storeFilter, setStoreFilter] = useState<Product["type"] | "all">("all");
  const [isDrumPlaying, setIsDrumPlaying] = useState(false);
  const [isKeyPlaying, setIsKeyPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const patternsRef = useRef<Patterns>(defaultPatterns);
  const drumTimerRef = useRef<number | null>(null);
  const keyTimerRef = useRef<number | null>(null);
  const drumStepRef = useRef(0);
  const drumNextStepTimeRef = useRef(0);
  const keyIndexRef = useRef(0);
  const keyNextNoteTimeRef = useRef(0);

  const activeBankData = banks.find((bank) => bank.id === activeBank) ?? banks[0];
  const activeSteps = patterns[activeBank];
  const activeStepCount = activeSteps.length;
  const activeMelodyNotes = useMemo(() => orderedNotes.filter((note) => activeKeys.includes(note)), [activeKeys]);

  const filteredProducts = useMemo(
    () => (storeFilter === "all" ? products : products.filter((product) => product.type === storeFilter)),
    [storeFilter],
  );

  const selectedCategory = categories.find((category) => category.id === selectedProduct.categoryId);

  const toggleStep = (step: number) => {
    setPatterns((currentPatterns) => {
      const currentSteps = currentPatterns[activeBank];
      const nextSteps = currentSteps.includes(step)
        ? currentSteps.filter((currentStep) => currentStep !== step)
        : [...currentSteps, step].sort((a, b) => a - b);

      const nextPatterns = { ...currentPatterns, [activeBank]: nextSteps };
      patternsRef.current = nextPatterns;
      return nextPatterns;
    });
  };

  const getAudioEngine = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!audioEngineRef.current) {
      const context = new AudioContext();
      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const drumBus = context.createGain();
      const keyBus = context.createGain();
      const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const noise = noiseBuffer.getChannelData(0);

      for (let index = 0; index < noise.length; index += 1) {
        noise[index] = Math.random() * 2 - 1;
      }

      drumBus.gain.value = 0.72;
      keyBus.gain.value = 0.34;
      master.gain.value = 0.72;
      compressor.threshold.value = -18;
      compressor.knee.value = 14;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;

      drumBus.connect(master);
      keyBus.connect(master);
      master.connect(compressor);
      compressor.connect(context.destination);

      audioEngineRef.current = { context, drumBus, keyBus, noiseBuffer };
    }

    return audioEngineRef.current;
  }, []);

  const playNote = useCallback(
    (note: string, duration = 0.3, scheduledAt?: number) => {
      const engine = getAudioEngine();
      const frequency = noteFrequencies[note];

      if (!engine || !frequency) {
        return;
      }

      const { context, keyBus } = engine;
      const startedAt = scheduledAt ?? context.currentTime;
      const oscillator = context.createOscillator();
      const overtone = context.createOscillator();
      const oscillatorGain = context.createGain();
      const overtoneGain = context.createGain();
      const envelope = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, startedAt);
      overtone.type = "sine";
      overtone.frequency.setValueAtTime(frequency * 2, startedAt);
      overtone.detune.setValueAtTime(4, startedAt);
      oscillatorGain.gain.value = 0.8;
      overtoneGain.gain.value = 0.12;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, startedAt);
      filter.frequency.exponentialRampToValueAtTime(700, startedAt + duration);
      filter.Q.value = 1.2;
      envelope.gain.setValueAtTime(0.0001, startedAt);
      envelope.gain.exponentialRampToValueAtTime(0.3, startedAt + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.075, startedAt + 0.11);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);

      oscillator.connect(oscillatorGain);
      overtone.connect(overtoneGain);
      oscillatorGain.connect(filter);
      overtoneGain.connect(filter);
      filter.connect(envelope);
      envelope.connect(keyBus);
      oscillator.start(startedAt);
      overtone.start(startedAt);
      oscillator.stop(startedAt + duration + 0.02);
      overtone.stop(startedAt + duration + 0.02);
    },
    [getAudioEngine],
  );

  const playPad = useCallback(
    (bank: BankId, step: number, scheduledAt?: number) => {
      const engine = getAudioEngine();

      if (!engine) {
        return;
      }

      const { context, drumBus, noiseBuffer } = engine;
      const startedAt = scheduledAt ?? context.currentTime;

      if (bank === "kick") {
        const oscillator = context.createOscillator();
        const click = context.createOscillator();
        const bodyGain = context.createGain();
        const clickGain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(150, startedAt);
        oscillator.frequency.exponentialRampToValueAtTime(47, startedAt + 0.11);
        bodyGain.gain.setValueAtTime(0.72, startedAt);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.24);
        click.type = "triangle";
        click.frequency.setValueAtTime(950, startedAt);
        click.frequency.exponentialRampToValueAtTime(110, startedAt + 0.025);
        clickGain.gain.setValueAtTime(0.12, startedAt);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.03);
        oscillator.connect(bodyGain);
        click.connect(clickGain);
        bodyGain.connect(drumBus);
        clickGain.connect(drumBus);
        oscillator.start(startedAt);
        click.start(startedAt);
        oscillator.stop(startedAt + 0.26);
        click.stop(startedAt + 0.04);
        return;
      }

      if (bank === "clap") {
        [0, 0.012, 0.026].forEach((offset, index) => {
          const source = context.createBufferSource();
          const filter = context.createBiquadFilter();
          const envelope = context.createGain();
          const hitAt = startedAt + offset;

          source.buffer = noiseBuffer;
          filter.type = "bandpass";
          filter.frequency.value = 1250;
          filter.Q.value = 0.7;
          envelope.gain.setValueAtTime(index === 2 ? 0.2 : 0.14, hitAt);
          envelope.gain.exponentialRampToValueAtTime(0.0001, hitAt + (index === 2 ? 0.12 : 0.025));
          source.connect(filter);
          filter.connect(envelope);
          envelope.connect(drumBus);
          source.start(hitAt, Math.random() * 0.4, 0.14);
        });
        return;
      }

      if (bank === "hats") {
        const source = context.createBufferSource();
        const highpass = context.createBiquadFilter();
        const envelope = context.createGain();
        const duration = step % 4 === 2 ? 0.075 : 0.045;

        source.buffer = noiseBuffer;
        highpass.type = "highpass";
        highpass.frequency.value = 6800;
        envelope.gain.setValueAtTime(0.075, startedAt);
        envelope.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
        source.connect(highpass);
        highpass.connect(envelope);
        envelope.connect(drumBus);
        source.start(startedAt, Math.random() * 0.5, duration);
        return;
      }

      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(step % 2 === 0 ? 210 : 165, startedAt);
      oscillator.frequency.exponentialRampToValueAtTime(92, startedAt + 0.09);
      filter.type = "bandpass";
      filter.frequency.value = 520;
      filter.Q.value = 1.8;
      envelope.gain.setValueAtTime(0.16, startedAt);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.11);
      oscillator.connect(filter);
      filter.connect(envelope);
      envelope.connect(drumBus);
      oscillator.start(startedAt);
      oscillator.stop(startedAt + 0.13);
    },
    [getAudioEngine],
  );

  const toggleKey = (note: string) => {
    setActiveKeys((currentKeys) => (currentKeys.includes(note) ? currentKeys.filter((currentKey) => currentKey !== note) : [...currentKeys, note]));
    playNote(note);
  };

  const toggleDrumPlayback = () => {
    const engine = getAudioEngine();

    if (!engine) {
      return;
    }

    if (engine.context.state === "suspended") {
      void engine.context.resume();
    }

    setIsDrumPlaying((currentValue) => !currentValue);
  };

  const toggleKeyPlayback = () => {
    const engine = getAudioEngine();

    if (!engine || activeMelodyNotes.length === 0) {
      return;
    }

    if (engine.context.state === "suspended") {
      void engine.context.resume();
    }

    setIsKeyPlaying((currentValue) => !currentValue);
  };

  useEffect(() => {
    if (!isDrumPlaying) {
      if (drumTimerRef.current) {
        window.clearTimeout(drumTimerRef.current);
        drumTimerRef.current = null;
      }

      return undefined;
    }

    const engine = getAudioEngine();
    if (!engine) {
      return undefined;
    }

    const secondsPerStep = 60 / 104 / 4;
    drumStepRef.current = 0;
    drumNextStepTimeRef.current = engine.context.currentTime + 0.04;

    const scheduleDrums = () => {
      while (drumNextStepTimeRef.current < engine.context.currentTime + 0.075) {
        const step = drumStepRef.current;
        const playAt = drumNextStepTimeRef.current;

        banks.forEach((bank) => {
          if (patternsRef.current[bank.id].includes(step)) {
            playPad(bank.id, step, playAt);
          }
        });

        const visualDelay = Math.max(0, (playAt - engine.context.currentTime) * 1000);
        window.setTimeout(() => setCurrentStep(step), visualDelay);
        drumStepRef.current = (step + 1) % 16;
        drumNextStepTimeRef.current += secondsPerStep;
      }

      drumTimerRef.current = window.setTimeout(scheduleDrums, 25);
    };

    scheduleDrums();

    return () => {
      if (drumTimerRef.current) {
        window.clearTimeout(drumTimerRef.current);
        drumTimerRef.current = null;
      }
    };
  }, [getAudioEngine, isDrumPlaying, playPad]);

  useEffect(() => {
    if (!isKeyPlaying || activeMelodyNotes.length === 0) {
      if (keyTimerRef.current) {
        window.clearTimeout(keyTimerRef.current);
        keyTimerRef.current = null;
      }

      return undefined;
    }

    const engine = getAudioEngine();
    if (!engine) {
      return undefined;
    }

    const secondsPerNote = 60 / 104 / 2;
    keyIndexRef.current = 0;
    keyNextNoteTimeRef.current = engine.context.currentTime + 0.04;

    const scheduleKeys = () => {
      while (keyNextNoteTimeRef.current < engine.context.currentTime + 0.075) {
        const index = keyIndexRef.current % activeMelodyNotes.length;
        const note = activeMelodyNotes[index];
        const playAt = keyNextNoteTimeRef.current;

        if (note) {
          playNote(note, secondsPerNote * 0.72, playAt);
        }

        const visualDelay = Math.max(0, (playAt - engine.context.currentTime) * 1000);
        window.setTimeout(() => setCurrentKeyIndex(index), visualDelay);
        keyIndexRef.current = (index + 1) % activeMelodyNotes.length;
        keyNextNoteTimeRef.current += secondsPerNote;
      }

      keyTimerRef.current = window.setTimeout(scheduleKeys, 25);
    };

    scheduleKeys();

    return () => {
      if (keyTimerRef.current) {
        window.clearTimeout(keyTimerRef.current);
        keyTimerRef.current = null;
      }
    };
  }, [activeMelodyNotes, getAudioEngine, isKeyPlaying, playNote]);

  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        void audioEngineRef.current.context.close();
        audioEngineRef.current = null;
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f2efe7] text-[#151515]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-[#f7f3ea]/92 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link className="[font-family:var(--font-heading)] text-2xl font-bold tracking-normal" href="/">
            808bytes
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-[#4f504d] md:flex">
            <a className="transition hover:text-black" href="#instrument">
              Workstation
            </a>
            <a className="transition hover:text-black" href="#store">
              Store
            </a>
            <Link className="transition hover:text-black" href="/about">
              About
            </Link>
          </div>
          <a
            className="ml-auto border border-[#151515] bg-[#151515] px-4 py-2 text-sm font-bold uppercase text-white transition hover:bg-[#2a2a2a]"
            href="#store"
          >
            Shop sounds
          </a>
        </nav>
      </header>

      <section
        className="relative overflow-hidden px-4 pt-24 sm:px-6"
        id="instrument"
        style={{
          background:
            "linear-gradient(180deg, rgba(242,239,231,0.94), rgba(234,229,218,0.98)), repeating-linear-gradient(90deg, rgba(21,21,21,0.05) 0, rgba(21,21,21,0.05) 1px, transparent 1px, transparent 72px)",
        }}
      >
        <div className="mx-auto grid min-h-[92svh] max-w-7xl content-center gap-8 pb-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Interactive sound shop</p>
            <h1 className="mt-4 text-5xl font-bold leading-[0.9] tracking-normal [font-family:var(--font-heading)] sm:text-7xl lg:text-8xl">
              808bytes
              <span className="block text-[#3b3b38]">workstation</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#595a55] sm:text-lg">
              Browse drops like you are sketching a beat. Tap pads, switch banks, then scroll into a cleaner store built for plugins, packs, one-shots, and merch.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="bg-[#151515] px-5 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#30302d]" href="#store">
                Enter store
              </a>
              <Link className="border border-[#151515] px-5 py-3 text-sm font-bold uppercase text-[#151515] transition hover:bg-white" href={`/products/${selectedProduct.slug}`}>
                Open featured
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-5 right-8 hidden h-10 w-32 border border-[#151515]/20 bg-[#78dcca] lg:block" />
            <div className="relative border border-[#151515] bg-[#e4dfd2] p-3 shadow-[12px_12px_0_#151515] sm:p-4">
              <div className="grid gap-3 border border-[#151515] bg-[#d8d1c1] p-3 sm:p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <section className="border border-[#151515] bg-[#101113] p-3 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase text-[#8d918c]">808bytes OS</span>
                      <span className="h-2 w-16" style={{ backgroundColor: activeBankData.color }} />
                    </div>
                    <div className="mt-5 grid grid-cols-[1fr_auto] gap-5">
                      <div>
                        <p className="text-xs uppercase text-[#9da19b]">{typeLabel[selectedProduct.type]}</p>
                        <h2 className="mt-1 text-3xl font-bold leading-none [font-family:var(--font-heading)]">{selectedProduct.title}</h2>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-[#c9c7be]">{selectedProduct.shortDescription}</p>
                      </div>
                      <div className="grid h-24 w-24 place-items-center border border-white/20 bg-[#1e211f]">
                        <div className="grid grid-cols-4 gap-1">
                          {Array.from({ length: 16 }).map((_, index) => (
                            <span
                              aria-hidden="true"
                              className="h-3 w-3"
                              key={`display-dot-${index}`}
                              style={{
                                backgroundColor: activeSteps.includes(index) ? activeBankData.color : "#3a3d39",
                                opacity: (index + selectedProduct.title.length) % 5 === 0 ? 0.45 : 1,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex h-16 items-end gap-1 border-t border-white/10 pt-3">
                      {Array.from({ length: 34 }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className="w-full"
                          key={`screen-wave-${index}`}
                          style={{
                            height: 10 + ((index * 7 + selectedProduct.title.length * 3 + activeStepCount + activeKeys.length * 5) % 48),
                            backgroundColor: index % 7 === 0 ? "#f4c95d" : activeBankData.color,
                            opacity: index % 4 === 0 ? 0.52 : 0.9,
                          }}
                        />
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-2 border border-[#151515] bg-[#c9c0ad] p-3">
                    <p className="text-xs font-bold uppercase text-[#55524b]">Banks</p>
                    <div className="grid grid-cols-2 gap-2">
                      {banks.map((bank) => (
                        <button
                          className="h-14 border border-[#151515] text-xs font-bold uppercase text-[#151515] transition hover:translate-y-[-1px]"
                          key={bank.id}
                          onClick={() => setActiveBank(bank.id)}
                          style={{
                            backgroundColor: activeBank === bank.id ? bank.color : "#eee7d8",
                            boxShadow: activeBank === bank.id ? "inset 0 0 0 3px rgba(255,255,255,0.45)" : "none",
                          }}
                          type="button"
                        >
                          {bank.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {knobLabels.map((label, index) => (
                        <div className="text-center" key={label}>
                          <button
                            aria-label={`${label} macro`}
                            className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-[#151515] bg-[#eee7d8] shadow-[inset_3px_4px_0_rgba(255,255,255,0.55)]"
                            type="button"
                          >
                            <span
                              className="block h-5 w-[3px] origin-bottom bg-[#151515]"
                              style={{ transform: `rotate(${-44 + index * 26 + activeStepCount}deg)` }}
                            />
                          </button>
                          <p className="mt-1 text-[0.62rem] font-bold uppercase text-[#5d5a52]">{label}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="grid gap-3 md:grid-cols-[1fr_220px]">
                  <div className="border border-[#151515] bg-[#beb5a4] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-[#55524b]">Step pads</p>
                      <p className="text-xs font-bold uppercase text-[#55524b]">{activeStepCount}/16 active</p>
                    </div>
                    <div className="grid grid-cols-8 gap-2 sm:grid-cols-16">
                      {Array.from({ length: 16 }).map((_, index) => {
                        const isActive = activeSteps.includes(index);

                        return (
                          <button
                            aria-label={`Toggle step ${index + 1}`}
                            className="aspect-square min-h-10 border border-[#151515] transition hover:translate-y-[-1px]"
                            key={`step-${index}`}
                            onClick={() => {
                              toggleStep(index);
                              playPad(activeBank, index);
                            }}
                            style={{
                              backgroundColor: currentStep === index && isDrumPlaying ? "#151515" : isActive ? activeBankData.color : "#eee7d8",
                              boxShadow: isActive ? "inset 0 -5px 0 rgba(21,21,21,0.16)" : "inset 0 -4px 0 rgba(21,21,21,0.08)",
                            }}
                            type="button"
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border border-[#151515] bg-[#beb5a4] p-3 md:grid-cols-2">
                    {transportLabels.map((label, index) => (
                      <button
                        className="h-12 border border-[#151515] bg-[#eee7d8] text-xs font-bold uppercase text-[#151515] transition hover:bg-white"
                        key={label}
                        onClick={() => {
                          if (label === "Drums") {
                            toggleDrumPlayback();
                            return;
                          }

                          if (label === "Melody") {
                            toggleKeyPlayback();
                            return;
                          }

                          const product = featuredProducts[index % featuredProducts.length] ?? products[index % products.length];
                          if (product) {
                            setSelectedProduct(product);
                          }

                          if (label === "Hit") {
                            playPad(activeBank, currentStep);
                          }
                        }}
                        style={
                          label === "Drums" && isDrumPlaying
                            ? { backgroundColor: "#f05d5e" }
                            : label === "Melody" && isKeyPlaying
                              ? { backgroundColor: "#78dcca" }
                              : undefined
                        }
                        type="button"
                      >
                        {label === "Drums" && isDrumPlaying ? "Stop beat" : label === "Melody" && isKeyPlaying ? "Stop keys" : label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="border border-[#151515] bg-[#beb5a4] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase text-[#55524b]">Mini keys</p>
                    <button
                      className="border border-[#151515] bg-[#eee7d8] px-2 py-1 text-[0.62rem] font-bold uppercase text-[#151515] transition hover:bg-white"
                      onClick={toggleKeyPlayback}
                      type="button"
                    >
                      {isKeyPlaying ? "Stop keys" : `${activeMelodyNotes.length} key loop`}
                    </button>
                  </div>
                  <div className="relative h-28 border border-[#151515] bg-[#151515] p-1">
                    <div className="flex h-full gap-1">
                      {whiteKeys.map((note, index) => {
                        const isActive = activeKeys.includes(note);

                        return (
                          <button
                            aria-label={`Toggle key ${note}`}
                            className="relative flex min-w-0 flex-1 items-end justify-center border border-[#151515] pb-2 text-[0.62rem] font-bold uppercase transition hover:bg-white"
                            key={note}
                            onClick={() => {
                              toggleKey(note);
                              const product = featuredProducts[index % featuredProducts.length] ?? products[index % products.length];
                              if (product) {
                                setSelectedProduct(product);
                              }
                            }}
                          style={{
                              backgroundColor: activeMelodyNotes[currentKeyIndex] === note && isKeyPlaying ? "#151515" : isActive ? activeBankData.color : "#fff9ea",
                              color: activeMelodyNotes[currentKeyIndex] === note && isKeyPlaying ? "#fff9ea" : "#151515",
                              boxShadow: isActive ? "inset 0 -8px 0 rgba(21,21,21,0.18)" : "inset 0 -6px 0 rgba(21,21,21,0.08)",
                            }}
                            type="button"
                          >
                            {note.replace("2", "")}
                          </button>
                        );
                      })}
                    </div>
                    {blackKeys.map((keyData, index) => {
                      const isActive = activeKeys.includes(keyData.note);

                      return (
                        <button
                          aria-label={`Toggle key ${keyData.note}`}
                          className="absolute top-1 z-10 h-16 w-[7.4%] border border-[#151515] text-[0] shadow-[0_4px_0_rgba(0,0,0,0.24)] transition hover:translate-y-0.5"
                          key={keyData.note}
                          onClick={() => {
                            toggleKey(keyData.note);
                            const product = featuredProducts[(index + 2) % featuredProducts.length] ?? products[(index + 2) % products.length];
                            if (product) {
                              setSelectedProduct(product);
                            }
                          }}
                          style={{
                            left: keyData.left,
                            backgroundColor: activeMelodyNotes[currentKeyIndex] === keyData.note && isKeyPlaying ? "#fff9ea" : isActive ? activeBankData.color : "#151515",
                          }}
                          type="button"
                        />
                      );
                    })}
                  </div>
                </section>

                <section className="grid gap-2 md:grid-cols-4">
                  {featuredProducts.map((product) => (
                    <button
                      className="border border-[#151515] bg-[#eee7d8] p-3 text-left transition hover:-translate-y-0.5 hover:bg-white"
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      type="button"
                    >
                      <span className="text-[0.65rem] font-bold uppercase text-[#757066]">{typeLabel[product.type]}</span>
                      <span className="mt-1 block truncate text-sm font-bold text-[#151515]">{product.title}</span>
                    </button>
                  ))}
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#151515] bg-[#151515] px-4 py-3 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 text-xs font-bold uppercase tracking-[0.16em] text-[#d9d4c8]">
          <span>Plugins</span>
          <span>Packs</span>
          <span>One-shots</span>
          <span>Merch</span>
          <span className="text-[#78dcca]">Free downloads included</span>
        </div>
      </section>

      <section className="bg-[#fbfaf6] px-4 py-16 sm:px-6 lg:py-20" id="store">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Modern store</p>
              <h2 className="mt-3 text-4xl font-bold leading-none [font-family:var(--font-heading)] sm:text-6xl">
                Shop the catalog
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f605c]">
                The playful instrument stays up top. Down here the store is direct, readable, and polished.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {(["all", "vst", "pack", "oneshot", "merch"] as const).map((filter) => (
                <button
                  className={`border px-4 py-2 text-sm font-bold uppercase transition ${
                    storeFilter === filter ? "border-[#151515] bg-[#151515] text-white" : "border-[#d2cabb] bg-white text-[#34342f] hover:border-[#151515]"
                  }`}
                  key={filter}
                  onClick={() => setStoreFilter(filter)}
                  type="button"
                >
                  {filter === "all" ? "All" : typeLabel[filter]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => {
                const category = categories.find((item) => item.id === product.categoryId);
                const accent = index % 4 === 0 ? "#78dcca" : index % 4 === 1 ? "#f05d5e" : index % 4 === 2 ? "#f4c95d" : "#8fa7ff";

                return (
                  <article className="group border border-[#d8d0c0] bg-white p-4 shadow-[0_12px_34px_rgba(21,21,21,0.06)] transition hover:-translate-y-1 hover:border-[#151515]" key={product.id}>
                    <button className="block w-full text-left" onClick={() => setSelectedProduct(product)} type="button">
                      <div className="relative aspect-[1.15] overflow-hidden border border-[#151515] bg-[#eee7d8]">
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${accent} 0 18%, transparent 18% 100%), repeating-linear-gradient(90deg, rgba(21,21,21,0.14) 0, rgba(21,21,21,0.14) 1px, transparent 1px, transparent 18px), #eee7d8`,
                          }}
                        />
                        <div className="absolute inset-x-5 bottom-5 border border-[#151515] bg-[#151515] p-3 text-white">
                          <p className="text-[0.65rem] font-bold uppercase text-[#aba79e]">{category?.name ?? "Catalog"}</p>
                          <div className="mt-3 flex h-10 items-end gap-1">
                            {Array.from({ length: 18 }).map((_, barIndex) => (
                              <span
                                aria-hidden="true"
                                className="w-full"
                                key={`${product.id}-bar-${barIndex}`}
                                style={{
                                  height: 8 + ((barIndex * 9 + product.title.length) % 32),
                                  backgroundColor: barIndex % 5 === 0 ? "#f4c95d" : accent,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-[#8a8376]">{typeLabel[product.type]}</p>
                          <h3 className="mt-1 text-2xl font-bold leading-none [font-family:var(--font-heading)]">{product.title}</h3>
                        </div>
                        <span className="border border-[#151515] px-2 py-1 text-xs font-bold uppercase">{formatPrice(product)}</span>
                      </div>
                      <p className="mt-3 min-h-12 text-sm leading-6 text-[#64645f]">{product.shortDescription}</p>
                    </button>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link className="bg-[#151515] px-3 py-2 text-center text-sm font-bold uppercase text-white transition hover:bg-[#30302d]" href={`/products/${product.slug}`}>
                        {product.isFree ? "Download" : "Buy now"}
                      </Link>
                      <button className="border border-[#151515] px-3 py-2 text-sm font-bold uppercase transition hover:bg-[#f2efe7]" onClick={() => setSelectedProduct(product)} type="button">
                        Preview
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit border border-[#151515] bg-[#e9e2d4] p-4 shadow-[8px_8px_0_#151515] lg:sticky lg:top-24">
              <div className="border border-[#151515] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b34b44]">Selected drop</p>
                <h3 className="mt-2 text-4xl font-bold leading-none [font-family:var(--font-heading)]">{selectedProduct.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#60615b]">{selectedProduct.longDescription}</p>

                <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                  <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-3">
                    <p className="text-[0.65rem] font-bold uppercase text-[#8a8376]">Price</p>
                    <p className="mt-1 font-bold">{formatPrice(selectedProduct)}</p>
                  </div>
                  <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-3">
                    <p className="text-[0.65rem] font-bold uppercase text-[#8a8376]">Category</p>
                    <p className="mt-1 font-bold">{selectedCategory?.name ?? "Catalog"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedProduct.compatibility.map((item) => (
                    <span className="border border-[#d8d0c0] bg-[#fbfaf6] px-2 py-1 text-xs font-bold uppercase text-[#55554f]" key={item}>
                      {item}
                    </span>
                  ))}
                </div>

                <Link className="mt-6 block bg-[#151515] px-4 py-3 text-center text-sm font-bold uppercase text-white transition hover:bg-[#30302d]" href={`/products/${selectedProduct.slug}`}>
                  {selectedProduct.isFree ? "Download free" : "Buy now"}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
