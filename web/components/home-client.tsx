"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductCover from "@/components/product-cover";
import { policyLinks } from "@/lib/site-content";
import type { Category, Product } from "@/lib/store-data";
import {
  CART_CHANGE_EVENT,
  readCartItems,
  upsertCartItem,
  writeCartItems,
  type CartItem,
} from "@/lib/cart-client";

const typeLabel: Record<Product["type"], string> = {
  vst: "Plugin",
  pack: "Pack",
  oneshot: "One-shot",
  merch: "Merch",
};

const typeBadgeLabel: Record<Product["type"], string> = {
  vst: "Plugins",
  pack: "Packs",
  oneshot: "One-shots",
  merch: "Merch",
};

const storeFilters = ["all", "vst", "pack", "oneshot", "merch"] as const;

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

const macroDefinitions = [
  { id: "tone", label: "Tone" },
  { id: "drive", label: "Drive" },
  { id: "space", label: "Space" },
  { id: "glue", label: "Glue" },
] as const;
const transportLabels = ["Hit", "Drums", "Melody", "Stop"];
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
  toneFilter: BiquadFilterNode;
  driveInput: GainNode;
  driveShaper: WaveShaperNode;
  spaceSend: GainNode;
  spaceReturn: GainNode;
  glueCompressor: DynamicsCompressorNode;
  noiseBuffer: AudioBuffer;
};

type MacroId = (typeof macroDefinitions)[number]["id"];
type MacroValues = Record<MacroId, number>;

const defaultMacroValues: MacroValues = {
  tone: 0.55,
  drive: 0.3,
  space: 0.24,
  glue: 0.42,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const createDriveCurve = (amount: number, samples = 2048) => {
  const curve = new Float32Array(samples);
  const shapedAmount = Math.max(1, amount * 320);

  for (let index = 0; index < samples; index += 1) {
    const x = (index * 2) / samples - 1;
    curve[index] = ((3 + shapedAmount) * x * 20 * (Math.PI / 180)) / (Math.PI + shapedAmount * Math.abs(x));
  }

  return curve;
};

const createImpulseResponse = (context: AudioContext, duration = 1.5, decay = 2.2) => {
  const sampleCount = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, sampleCount, context.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < sampleCount; index += 1) {
      const t = index / sampleCount;
      const envelope = Math.pow(1 - t, decay);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }
  }

  return impulse;
};

const applyMacroSettings = (engine: AudioEngine, macros: MacroValues, smoothAt?: number) => {
  const { context, toneFilter, driveInput, driveShaper, spaceSend, spaceReturn, glueCompressor } = engine;
  const now = smoothAt ?? context.currentTime;

  const toneFrequency = 650 + macros.tone * 6500;
  toneFilter.frequency.setTargetAtTime(toneFrequency, now, 0.018);
  toneFilter.Q.setTargetAtTime(0.7 + macros.tone * 3.4, now, 0.03);

  const driveAmount = macros.drive;
  driveInput.gain.setTargetAtTime(1 + driveAmount * 2.8, now, 0.02);
  driveShaper.curve = createDriveCurve(driveAmount);

  const spaceAmount = macros.space;
  spaceSend.gain.setTargetAtTime(spaceAmount * 0.42, now, 0.04);
  spaceReturn.gain.setTargetAtTime(0.2 + spaceAmount * 0.95, now, 0.04);

  const glueAmount = macros.glue;
  glueCompressor.threshold.setTargetAtTime(-14 - glueAmount * 18, now, 0.03);
  glueCompressor.ratio.setTargetAtTime(2.2 + glueAmount * 6.2, now, 0.03);
  glueCompressor.attack.setTargetAtTime(0.02 - glueAmount * 0.017, now, 0.03);
  glueCompressor.release.setTargetAtTime(0.1 + glueAmount * 0.22, now, 0.03);
};

const formatPrice = (product: Product) => {
  if (!product.isPurchasable) {
    return product.statusLabel ?? "Preview only";
  }

  return product.isFree ? "Free" : `$${product.price}`;
};

type HomeClientProps = {
  categories: Category[];
  products: Product[];
};

export default function HomeClient({ categories, products }: HomeClientProps) {
  const router = useRouter();
  const featuredProducts = useMemo(() => products.filter((product) => product.featured), [products]);
  const [activeBank, setActiveBank] = useState<BankId>("kick");
  const [selectedProduct, setSelectedProduct] = useState<Product>(featuredProducts[0] ?? products[0]);
  const [patterns, setPatterns] = useState<Patterns>(defaultPatterns);
  const [activeKeys, setActiveKeys] = useState<string[]>(["C", "E", "G", "B"]);
  const [storeFilter, setStoreFilter] = useState<Product["type"] | "all">("all");
  const [isDrumPlaying, setIsDrumPlaying] = useState(false);
  const [isKeyPlaying, setIsKeyPlaying] = useState(false);
  const [macroValues, setMacroValues] = useState<MacroValues>(defaultMacroValues);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentKeyIndex, setCurrentKeyIndex] = useState(0);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const macroValuesRef = useRef<MacroValues>(defaultMacroValues);
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

  const selectedCategory = categories.find((category) => category.id === selectedProduct.categoryId);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const availableStoreFilters = useMemo(
    () => storeFilters.filter((filter) => filter === "all" || products.some((product) => product.type === filter)),
    [products],
  );
  const effectiveStoreFilter = availableStoreFilters.includes(storeFilter) ? storeFilter : "all";
  const filteredProducts = useMemo(
    () => (effectiveStoreFilter === "all" ? products : products.filter((product) => product.type === effectiveStoreFilter)),
    [effectiveStoreFilter, products],
  );
  const visibleProductTypeLabels = useMemo(
    () => availableStoreFilters.filter((filter): filter is Product["type"] => filter !== "all").map((filter) => typeBadgeLabel[filter]),
    [availableStoreFilters],
  );
  const hasFreeProducts = useMemo(() => products.some((product) => product.isFree), [products]);

  useEffect(() => {
    const syncCart = () => {
      setCartItems(readCartItems());
    };

    const timeoutId = window.setTimeout(() => {
      syncCart();
    }, 0);
    window.addEventListener(CART_CHANGE_EVENT, syncCart);
    window.addEventListener("focus", syncCart);
    window.addEventListener("pageshow", syncCart);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(CART_CHANGE_EVENT, syncCart);
      window.removeEventListener("focus", syncCart);
      window.removeEventListener("pageshow", syncCart);
    };
  }, []);

  const addToCart = (productId: string, options?: { checkout?: boolean }) => {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product?.isPurchasable) {
      setCartMessage(product?.statusLabel ?? "Preview only. Checkout is not available yet.");
      return;
    }

    const nextItems = upsertCartItem(readCartItems(), productId, 1);
    writeCartItems(nextItems);
    setCartItems(nextItems);
    setCartMessage(options?.checkout ? "Added. Opening checkout." : "Added to cart.");

    if (options?.checkout) {
      router.push("/checkout");
    }
  };

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

  const resetActivePattern = useCallback(() => {
    setPatterns((currentPatterns) => {
      const nextPatterns = { ...currentPatterns, [activeBank]: [...defaultPatterns[activeBank]] };
      patternsRef.current = nextPatterns;
      return nextPatterns;
    });
  }, [activeBank]);

  const stopAndResetWorkstation = useCallback(() => {
    setIsDrumPlaying(false);
    setIsKeyPlaying(false);
    setCurrentStep(0);
    setCurrentKeyIndex(0);

    setPatterns(() => {
      const nextPatterns = {
        kick: [...defaultPatterns.kick],
        clap: [...defaultPatterns.clap],
        hats: [...defaultPatterns.hats],
        perc: [...defaultPatterns.perc],
      };
      patternsRef.current = nextPatterns;
      return nextPatterns;
    });

    setActiveKeys(["C", "E", "G", "B"]);
  }, []);

  const getAudioEngine = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (!audioEngineRef.current) {
      const context = new AudioContext();
      const inputBus = context.createGain();
      const toneFilter = context.createBiquadFilter();
      const driveInput = context.createGain();
      const driveShaper = context.createWaveShaper();
      const driveOutput = context.createGain();
      const spaceSend = context.createGain();
      const convolver = context.createConvolver();
      const spaceReturn = context.createGain();
      const glueCompressor = context.createDynamicsCompressor();
      const master = context.createGain();
      const drumBus = context.createGain();
      const keyBus = context.createGain();
      const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const noise = noiseBuffer.getChannelData(0);

      for (let index = 0; index < noise.length; index += 1) {
        noise[index] = Math.random() * 2 - 1;
      }

      drumBus.gain.value = 0.72;
      keyBus.gain.value = 0.34;
      inputBus.gain.value = 1;
      toneFilter.type = "lowpass";
      driveInput.gain.value = 1;
      driveShaper.oversample = "4x";
      driveOutput.gain.value = 0.7;
      convolver.buffer = createImpulseResponse(context);
      spaceSend.gain.value = 0;
      spaceReturn.gain.value = 0;
      glueCompressor.knee.value = 14;
      master.gain.value = 0.78;

      drumBus.connect(inputBus);
      keyBus.connect(inputBus);
      inputBus.connect(toneFilter);
      toneFilter.connect(driveInput);
      driveInput.connect(driveShaper);
      driveShaper.connect(driveOutput);
      driveOutput.connect(glueCompressor);
      toneFilter.connect(spaceSend);
      spaceSend.connect(convolver);
      convolver.connect(spaceReturn);
      spaceReturn.connect(glueCompressor);
      glueCompressor.connect(master);
      master.connect(context.destination);

      const engine = {
        context,
        drumBus,
        keyBus,
        toneFilter,
        driveInput,
        driveShaper,
        spaceSend,
        spaceReturn,
        glueCompressor,
        noiseBuffer,
      };

      applyMacroSettings(engine, macroValuesRef.current, context.currentTime);

      audioEngineRef.current = engine;
    }

    return audioEngineRef.current;
  }, []);

  useEffect(() => {
    macroValuesRef.current = macroValues;

    if (audioEngineRef.current) {
      applyMacroSettings(audioEngineRef.current, macroValues, audioEngineRef.current.context.currentTime);
    }
  }, [macroValues]);

  const updateMacro = (id: MacroId, nextValue: number) => {
    setMacroValues((currentValues) => {
      const value = clamp01(nextValue);
      const nextValues = { ...currentValues, [id]: value };
      macroValuesRef.current = nextValues;
      return nextValues;
    });
  };

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

  const toggleDrumPlayback = useCallback(() => {
    const engine = getAudioEngine();

    if (!engine) {
      return;
    }

    if (engine.context.state === "suspended") {
      void engine.context.resume();
    }

    setIsDrumPlaying((currentValue) => !currentValue);
  }, [getAudioEngine]);

  const toggleKeyPlayback = useCallback(() => {
    const engine = getAudioEngine();

    if (!engine || activeMelodyNotes.length === 0) {
      return;
    }

    if (engine.context.state === "suspended") {
      void engine.context.resume();
    }

    setIsKeyPlaying((currentValue) => !currentValue);
  }, [activeMelodyNotes.length, getAudioEngine]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      if (target?.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === " ") {
        event.preventDefault();
        toggleDrumPlayback();
        return;
      }

      if (key === "m") {
        event.preventDefault();
        toggleKeyPlayback();
        return;
      }

      if (key === "x") {
        event.preventDefault();
        stopAndResetWorkstation();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        resetActivePattern();
        return;
      }

      if (key >= "1" && key <= "4") {
        event.preventDefault();
        const nextBank = banks[Number(key) - 1];
        if (nextBank) {
          setActiveBank(nextBank.id);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [resetActivePattern, stopAndResetWorkstation, toggleDrumPlayback, toggleKeyPlayback]);

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
          <Link className="inline-flex min-h-11 items-center [font-family:var(--font-heading)] text-2xl font-bold tracking-normal" href="/">
            808bytes
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-[#4f504d] md:flex">
            <a className="inline-flex min-h-11 items-center px-1 transition hover:text-black" href="#instrument">
              Workstation
            </a>
            <a className="inline-flex min-h-11 items-center px-1 transition hover:text-black" href="#store">
              Store
            </a>
            <Link className="inline-flex min-h-11 items-center px-1 transition hover:text-black" href="/about">
              About
            </Link>
          </div>
          <a
            className="ml-auto inline-flex min-h-11 items-center whitespace-nowrap border border-[#151515] bg-[#151515] px-3 py-2 text-xs font-bold uppercase text-white transition hover:bg-[#2a2a2a] sm:px-4 sm:text-sm"
            data-analytics="nav_shop_sounds"
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
        <div className="mx-auto grid min-h-[92svh] max-w-7xl min-w-0 content-center gap-8 pb-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)] lg:items-center">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b34b44]">Interactive sound shop</p>
            <h1 className="mt-4 text-5xl font-bold leading-[0.9] tracking-normal [font-family:var(--font-heading)] sm:text-7xl lg:text-8xl">
              808bytes
              <span className="block text-[#3b3b38]">workstation</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#595a55] sm:text-lg">
              Browse drops like you are sketching a beat. Tap pads, switch banks, then scroll into a cleaner store built around the current Sauce catalog.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a className="bg-[#151515] px-5 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#30302d]" data-analytics="hero_enter_store" href="#store">
                Enter store
              </a>
              <Link className="border border-[#151515] px-5 py-3 text-sm font-bold uppercase text-[#151515] transition hover:bg-white" data-analytics="hero_open_featured" href={`/products/${selectedProduct.slug}`}>
                Open featured
              </Link>
            </div>
          </div>

          <div className="relative min-w-0 max-w-full">
            <div className="absolute -top-5 right-8 hidden h-10 w-32 border border-[#151515]/20 bg-[#78dcca] lg:block" />
            <div className="relative min-w-0 max-w-full border border-[#151515] bg-[#e4dfd2] p-2 shadow-[6px_6px_0_#151515] sm:p-4 sm:shadow-[12px_12px_0_#151515]">
              <div className="grid min-w-0 gap-3 border border-[#151515] bg-[#d8d1c1] p-3 sm:p-4">
                <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                  <section className="min-w-0 border border-[#151515] bg-[#101113] p-3 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase text-[#8d918c]">808bytes OS</span>
                      <span className="h-2 w-16" style={{ backgroundColor: activeBankData.color }} />
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:gap-5">
                      <div>
                        <p className="text-xs uppercase text-[#9da19b]">{typeLabel[selectedProduct.type]}</p>
                        <h2 className="mt-1 text-3xl font-bold leading-none [font-family:var(--font-heading)]">{selectedProduct.title}</h2>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-[#c9c7be]">{selectedProduct.shortDescription}</p>
                      </div>
                      <div className="grid h-24 w-full place-items-center border border-white/20 bg-[#1e211f] sm:w-24">
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
                    <div className="mt-5 flex h-16 min-w-0 items-end gap-1 overflow-hidden border-t border-white/10 pt-3">
                      {Array.from({ length: 34 }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className="min-w-0 flex-1"
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

                  <section className="grid min-w-0 gap-2 border border-[#151515] bg-[#c9c0ad] p-3">
                    <p className="text-xs font-bold uppercase text-[#55524b]">Banks</p>
                    <div className="grid grid-cols-2 gap-2">
                      {banks.map((bank) => (
                        <button
                          aria-pressed={activeBank === bank.id}
                          className="h-14 border border-[#151515] text-xs font-bold uppercase text-[#151515] transition hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515]"
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
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {macroDefinitions.map((macro) => {
                        const value = macroValues[macro.id];

                        return (
                        <div className="text-center" key={macro.id}>
                          <button
                            aria-label={`${macro.label} macro`}
                            className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#151515] bg-[#eee7d8] shadow-[inset_3px_4px_0_rgba(255,255,255,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515]"
                            onClick={() => updateMacro(macro.id, value + 0.08)}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              updateMacro(macro.id, value - 0.08);
                            }}
                            onWheel={(event) => {
                              event.preventDefault();
                              updateMacro(macro.id, value + (event.deltaY > 0 ? -0.03 : 0.03));
                            }}
                            title="Click to increase, right-click to decrease, scroll to fine tune"
                            type="button"
                          >
                            <span
                              className="block h-5 w-[3px] origin-bottom bg-[#151515]"
                              style={{ transform: `rotate(${-128 + value * 256}deg)` }}
                            />
                          </button>
                          <p className="mt-1 text-[0.62rem] font-bold uppercase text-[#5d5a52]">{macro.label}</p>
                          <p className="text-[0.58rem] font-bold uppercase text-[#7b766a]">{Math.round(value * 100)}%</p>
                          <div className="mx-auto mt-1 grid w-24 max-w-full grid-cols-2 gap-1">
                            <button
                              aria-label={`Decrease ${macro.label} macro`}
                              className="min-h-11 border border-[#151515] bg-[#eee7d8] text-xs font-bold text-[#151515] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
                              onClick={() => updateMacro(macro.id, value - 0.08)}
                              type="button"
                            >
                              -
                            </button>
                            <button
                              aria-label={`Increase ${macro.label} macro`}
                              className="min-h-11 border border-[#151515] bg-[#eee7d8] text-xs font-bold text-[#151515] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
                              onClick={() => updateMacro(macro.id, value + 0.08)}
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                <section className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="min-w-0 border border-[#151515] bg-[#beb5a4] p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 flex-1 text-xs font-bold uppercase text-[#55524b]">Step pads (1-4 banks, Space drums, M melody, R reset, X stop)</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase text-[#55524b]">{activeStepCount}/16 active</p>
                        <button
                          className="min-h-11 border border-[#151515] bg-[#eee7d8] px-3 py-2 text-[0.62rem] font-bold uppercase text-[#151515] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#151515]"
                          onClick={resetActivePattern}
                          type="button"
                        >
                          Reset bank
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-16">
                      {Array.from({ length: 16 }).map((_, index) => {
                        const isActive = activeSteps.includes(index);

                        return (
                          <button
                            aria-label={`Toggle step ${index + 1}`}
                            aria-pressed={isActive}
                            className="aspect-square min-h-12 border border-[#151515] transition hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515] lg:min-h-10"
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

                  <div className="grid min-w-0 grid-cols-2 gap-2 border border-[#151515] bg-[#beb5a4] p-3 sm:grid-cols-4 md:grid-cols-2">
                    {transportLabels.map((label, index) => (
                      <button
                        className="h-12 border border-[#151515] bg-[#eee7d8] text-xs font-bold uppercase text-[#151515] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
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

                          if (label === "Stop") {
                            stopAndResetWorkstation();
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
                              : label === "Stop"
                                ? { backgroundColor: "#151515", color: "#fff9ea" }
                              : undefined
                        }
                        type="button"
                      >
                        {label === "Drums" && isDrumPlaying ? "Stop beat" : label === "Melody" && isKeyPlaying ? "Stop keys" : label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="min-w-0 border border-[#151515] bg-[#beb5a4] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase text-[#55524b]">Mini keys</p>
                    <button
                      className="min-h-11 border border-[#151515] bg-[#eee7d8] px-3 py-2 text-[0.62rem] font-bold uppercase text-[#151515] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
                      onClick={toggleKeyPlayback}
                      type="button"
                    >
                      {isKeyPlaying ? "Stop keys" : `${activeMelodyNotes.length} key loop`}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:hidden">
                    {orderedNotes.map((note, index) => {
                      const isActive = activeKeys.includes(note);

                      return (
                        <button
                          aria-label={`Toggle key ${note}`}
                          aria-pressed={isActive}
                          className="min-h-12 border border-[#151515] text-xs font-bold uppercase transition hover:bg-white focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
                          key={`mobile-${note}`}
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
                            boxShadow: isActive ? "inset 0 -6px 0 rgba(21,21,21,0.18)" : "inset 0 -4px 0 rgba(21,21,21,0.08)",
                          }}
                          type="button"
                        >
                          {note}
                        </button>
                      );
                    })}
                  </div>
                  <div className="hidden max-w-full sm:block">
                    <div className="relative h-28 w-full border border-[#151515] bg-[#151515] p-1">
                    <div className="flex h-full gap-1">
                      {whiteKeys.map((note, index) => {
                        const isActive = activeKeys.includes(note);

                        return (
                          <button
                            aria-label={`Toggle key ${note}`}
                            aria-pressed={isActive}
                            className="relative flex min-w-0 flex-1 items-end justify-center border border-[#151515] pb-2 text-[0.62rem] font-bold uppercase transition hover:bg-white focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
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
                          aria-pressed={isActive}
                          className="absolute top-1 z-10 h-16 w-[7.4%] border border-[#151515] text-[0] shadow-[0_4px_0_rgba(0,0,0,0.24)] transition hover:translate-y-0.5 focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#151515]"
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
          {visibleProductTypeLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
          <span className="text-[#78dcca]">{hasFreeProducts ? "Free downloads included" : "Digital downloads ready"}</span>
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

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="flex flex-wrap items-center gap-2 lg:hidden">
                {availableStoreFilters.map((filter) => (
                  <button
                    className={`min-h-11 border px-4 py-3 text-sm font-bold uppercase transition ${
                      effectiveStoreFilter === filter ? "border-[#151515] bg-[#151515] text-white" : "border-[#d2cabb] bg-white text-[#34342f] hover:border-[#151515]"
                    }`}
                    aria-pressed={effectiveStoreFilter === filter}
                    data-analytics="store_filter"
                    data-analytics-label={filter}
                    key={filter}
                    onClick={() => setStoreFilter(filter)}
                    type="button"
                  >
                    {filter === "all" ? "All" : typeLabel[filter]}
                  </button>
                ))}
              </div>
              <Link
                aria-label={`Open checkout with ${cartCount} items`}
                className="relative inline-flex h-11 w-11 items-center justify-center border border-[#151515] bg-white text-[#151515] transition hover:bg-[#f5f0e7]"
                data-analytics="store_cart_open"
                href="/checkout"
              >
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                  <path d="M3 4h2l2.3 10.2a1.2 1.2 0 0 0 1.18.95h8.68a1.2 1.2 0 0 0 1.17-.93L20 7H7.2" />
                </svg>
                <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#151515] px-1.5 py-0.5 text-center text-[0.62rem] font-bold leading-none text-white">
                  {cartCount}
                </span>
              </Link>
            </div>
            {cartMessage ? <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-[#b34b44] lg:text-right">{cartMessage}</p> : null}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="grid auto-rows-max content-start items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const category = categories.find((item) => item.id === product.categoryId);

                return (
                  <article className="group self-start border border-[#d8d0c0] bg-white p-4 shadow-[0_12px_34px_rgba(21,21,21,0.06)] transition hover:-translate-y-1 hover:border-[#151515]" key={product.id}>
                    <button className="block w-full text-left" onClick={() => setSelectedProduct(product)} type="button">
                      <ProductCover categoryName={category?.name ?? "Catalog"} className="aspect-[1.15]" product={product} />
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-[#8a8376]">{typeLabel[product.type]}</p>
                          <h3 className="mt-1 text-2xl font-bold leading-none [font-family:var(--font-heading)]">{product.title}</h3>
                        </div>
                        <span className="border border-[#151515] px-2 py-1 text-xs font-bold uppercase">{formatPrice(product)}</span>
                      </div>
                      <p className="mt-3 min-h-12 text-sm leading-6 text-[#64645f]">{product.shortDescription}</p>
                    </button>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        className="min-h-11 bg-[#151515] px-3 py-3 text-center text-sm font-bold uppercase text-white transition hover:bg-[#30302d] disabled:cursor-not-allowed disabled:opacity-50"
                        data-analytics="product_buy"
                        data-analytics-label={product.title}
                        disabled={!product.isPurchasable}
                        onClick={() => addToCart(product.id, { checkout: true })}
                        type="button"
                      >
                        {!product.isPurchasable ? "Preview only" : product.isFree ? "Get free" : "Buy now"}
                      </button>
                      <button
                        className="min-h-11 border border-[#151515] px-3 py-3 text-sm font-bold uppercase transition hover:bg-[#f2efe7]"
                        data-analytics="product_preview"
                        data-analytics-label={product.title}
                        onClick={() => setSelectedProduct(product)}
                        type="button"
                      >
                        Preview
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="h-fit border border-[#151515] bg-[#e9e2d4] p-3 shadow-[8px_8px_0_#151515] lg:sticky lg:top-24">
              <div className="mb-3 hidden border border-[#151515] bg-white p-3 lg:block">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#6f6a5e]">Filter catalog</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableStoreFilters.map((filter) => (
                    <button
                    className={`min-h-11 border px-3 py-3 text-xs font-bold uppercase transition ${
                      effectiveStoreFilter === filter ? "border-[#151515] bg-[#151515] text-white" : "border-[#d2cabb] bg-white text-[#34342f] hover:border-[#151515]"
                    }`}
                    aria-pressed={effectiveStoreFilter === filter}
                    data-analytics="store_filter"
                    data-analytics-label={filter}
                    key={filter}
                      onClick={() => setStoreFilter(filter)}
                      type="button"
                    >
                      {filter === "all" ? "All" : typeLabel[filter]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border border-[#151515] bg-white p-3">
                <ProductCover categoryName={selectedCategory?.name ?? "Catalog"} className="mb-3 aspect-[1.85]" compact product={selectedProduct} />
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b34b44]">Selected drop</p>
                <h3 className="mt-1 text-3xl font-bold leading-none [font-family:var(--font-heading)]">{selectedProduct.title}</h3>
                <p className="mt-2 text-sm leading-5 text-[#60615b]">{selectedProduct.longDescription}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-2">
                    <p className="text-[0.65rem] font-bold uppercase text-[#8a8376]">Price</p>
                    <p className="mt-1 font-bold">{formatPrice(selectedProduct)}</p>
                  </div>
                  <div className="border border-[#d8d0c0] bg-[#fbfaf6] p-2">
                    <p className="text-[0.65rem] font-bold uppercase text-[#8a8376]">Category</p>
                    <p className="mt-1 font-bold">{selectedCategory?.name ?? "Catalog"}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {!selectedProduct.isPurchasable ? (
                    <span className="border border-[#151515] bg-[#151515] px-2 py-1 text-xs font-bold uppercase text-white">
                      {selectedProduct.statusLabel ?? "Preview only"}
                    </span>
                  ) : null}
                  {selectedProduct.compatibility.map((item) => (
                    <span className="border border-[#d8d0c0] bg-[#fbfaf6] px-2 py-1 text-xs font-bold uppercase text-[#55554f]" key={item}>
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className="min-h-11 bg-[#151515] px-3 py-3 text-center text-sm font-bold uppercase text-white transition hover:bg-[#30302d] disabled:cursor-not-allowed disabled:opacity-50"
                    data-analytics="product_buy"
                    data-analytics-label={selectedProduct.title}
                    disabled={!selectedProduct.isPurchasable}
                    onClick={() => addToCart(selectedProduct.id, { checkout: true })}
                    type="button"
                  >
                    {!selectedProduct.isPurchasable ? "Preview only" : selectedProduct.isFree ? "Get free" : "Buy now"}
                  </button>
                  <Link className="min-h-11 border border-[#151515] px-3 py-3 text-center text-sm font-bold uppercase text-[#151515] transition hover:bg-[#f5f0e7]" data-analytics="product_detail" data-analytics-label={selectedProduct.title} href={`/products/${selectedProduct.slug}`}>
                    View detail
                  </Link>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </section>
      <footer className="border-t border-[#151515] bg-[#151515] px-4 py-8 text-white sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 text-xs font-bold uppercase tracking-[0.14em]">
          <Link className="inline-flex min-h-11 items-center text-[#78dcca]" href="/">808bytes</Link>
          <Link className="inline-flex min-h-11 items-center text-[#d9d4c8] transition hover:text-white" href="/about">About</Link>
          {policyLinks.map((link) => (
            <Link className="inline-flex min-h-11 items-center text-[#d9d4c8] transition hover:text-white" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <a className="inline-flex min-h-11 items-center text-[#d9d4c8] underline decoration-[#78dcca] underline-offset-4 transition hover:text-white" data-analytics="support_email" href="mailto:help@808bytes.com">
            help@808bytes.com
          </a>
        </div>
      </footer>
    </main>
  );
}
