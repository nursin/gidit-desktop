import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import {
  Music,
  Play,
  Square,
  Shuffle,
  Heart,
  Download,
  Trash2,
  Edit,
  Loader2,
  Speaker,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Slider } from "../ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type SoundSpec = {
  type: string;
  params: any;
  masterGain: number;
  abruptStart: boolean;
  duration?: number;
};

type Favorite = {
  id: string;
  name: string;
  label: string;
  spec: SoundSpec;
  createdAt: number;
};

type Recipe = {
  start: (when: number) => void;
  stop: () => void;
  nodes: AudioNode[];
  label: string;
  spec: SoundSpec;
};

const initialSoundParams = {
  masterGain: 0.25,
  color: "pink",
  amEnabled: true,
  amWave: "sine",
  amFreq: 16,
  amDepth: 0.5,
  filterType: "lp",
  filterCenter: 800,
  filterQ: 1.0,
  filterLfoOn: true,
  filterLfoFreq: 0.2,
  filterLfoDepth: 400,
};

const presets: { name: string; spec: SoundSpec }[] = [
  {
    name: "Gentle Rain",
    spec: {
      type: "noise",
      params: {
        color: "pink",
        amEnabled: false,
        filterType: "lp",
        filterCenter: 1200,
        filterQ: 0.8,
        filterLfoOn: true,
        filterLfoFreq: 0.1,
        filterLfoDepth: 400,
      },
      masterGain: 0.3,
      abruptStart: false,
    },
  },
  {
    name: "Howling Wind",
    spec: {
      type: "noise",
      params: {
        color: "white",
        amEnabled: false,
        filterType: "bp",
        filterCenter: 800,
        filterQ: 2.5,
        filterLfoOn: true,
        filterLfoFreq: 0.15,
        filterLfoDepth: 600,
      },
      masterGain: 0.2,
      abruptStart: false,
    },
  },
  {
    name: "Thunderstorm Rumble",
    spec: {
      type: "noise",
      params: {
        color: "brown",
        amEnabled: true,
        amWave: "square",
        amFreq: 1.5,
        amDepth: 0.8,
        filterType: "lp",
        filterCenter: 400,
        filterQ: 1.2,
        filterLfoOn: false,
      },
      masterGain: 0.4,
      abruptStart: true,
    },
  },
  {
    name: "Deep Meditation",
    spec: {
      type: "binaural",
      params: { carrier: 136.1, beat: 8, toneWave: "sine", noiseBedGain: 0.2 },
      masterGain: 0.25,
      abruptStart: false,
    },
  },
  {
    name: "Eerie Drone",
    spec: {
      type: "binaural",
      params: {
        carrier: 110,
        beat: 2,
        toneWave: "sine",
        vibOn: true,
        vibRate: 3,
        vibDepth: 4,
        noiseBedGain: 0.05,
      },
      masterGain: 0.3,
      abruptStart: false,
    },
  },
];

export function SoundscapeGenerator({ name = "Soundscape Generator" }: { name?: string }) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const currentNodesRef = useRef<AudioNode[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  const [status, setStatus] = useState("idle");
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const [lastSpec, setLastSpec] = useState<SoundSpec | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [abruptStart, setAbruptStart] = useState(false);
  const [tactileMode, setTactileMode] = useState(false);
  const [soundParams, setSoundParams] = useState(initialSoundParams);
  const [activeTab, setActiveTab] = useState("player");

  const { toast } = useToast();

  const FADE_SEC = 0.75;
  const ABRUPT_FADE_SEC = 0.01;
  const START_GAIN = 0.0;
  const SAMPLE_RATE = 44100;
  const DEFAULT_DOWNLOAD_SEC = 120;
  const LS_KEY = "adhd_random_favorites_v2";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  const persistFavorites = (next: Favorite[]) => {
    setFavorites(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {}
  };

  const ensureContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = START_GAIN;
      master.connect(ctx.destination);
      masterGainRef.current = master;
    }
    return audioCtxRef.current;
  }, []);

  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const choice = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const connectLFO = useCallback(
    (
      ctx: BaseAudioContext,
      {
        type = "sine",
        freq = 0.2,
        depth = 1.0,
        targetParam,
        offset = 0,
      }: { type?: OscillatorType; freq?: number; depth?: number; targetParam: AudioParam; offset?: number }
    ) => {
      const isOffline = ctx && ctx.constructor && (ctx.constructor as any).name === "OfflineAudioContext";
      const lfo = ctx.createOscillator();
      lfo.type = type;
      lfo.frequency.value = freq;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = depth;
      if (offset !== 0) {
        const dc = ctx.createConstantSource();
        dc.offset.value = offset;
        dc.connect(targetParam);
        dc.start();
        if (!isOffline) currentNodesRef.current.push(dc);
      }
      lfo.connect(lfoGain);
      lfoGain.connect(targetParam);
      lfo.start();
      if (!isOffline) currentNodesRef.current.push(lfo, lfoGain);
      return { lfo, lfoGain };
    },
    []
  );

  const makeNoiseBuffer = useCallback((ctx: BaseAudioContext, seconds = 2) => {
    const len = Math.max(1, Math.floor(seconds * ctx.sampleRate));
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    }
    return buf;
  }, []);

  const colorize = useCallback((node: AudioNode, ctx: BaseAudioContext, color: string) => {
    if (color === "pink") {
      const shelf = ctx.createBiquadFilter();
      shelf.type = "lowshelf";
      shelf.frequency.value = 1000;
      shelf.gain.value = 6;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 8000;
      lp.Q.value = 0.3;
      node.connect(shelf);
      shelf.connect(lp);
      return lp;
    }
    if (color === "brown") {
      const lp1 = ctx.createBiquadFilter();
      lp1.type = "lowpass";
      lp1.frequency.value = 1200;
      lp1.Q.value = 0.5;
      const lp2 = ctx.createBiquadFilter();
      lp2.type = "lowpass";
      lp2.frequency.value = 600;
      lp2.Q.value = 0.7;
      node.connect(lp1);
      lp1.connect(lp2);
      return lp2;
    }
    if (color === "blue") {
      const hs = ctx.createBiquadFilter();
      hs.type = "highshelf";
      hs.frequency.value = 3000;
      hs.gain.value = 6;
      node.connect(hs);
      return hs;
    }
    return node;
  }, []);

  const stereoPanner = useCallback((ctx: BaseAudioContext, panValue: number) => {
    if ((ctx as any).createStereoPanner) {
      const p = (ctx as any).createStereoPanner();
      p.pan.value = panValue;
      return p as AudioNode;
    }
    const g = ctx.createGain();
    return g;
  }, []);

  const hardStopAll = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    try {
      masterGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
      masterGainRef.current.gain.setValueAtTime(0.0001, ctx.currentTime);
    } catch {}
    currentNodesRef.current.forEach((n) => {
      try {
        // @ts-ignore
        if ("stop" in n && typeof (n as any).stop === "function") (n as any).stop();
        if ("disconnect" in n && typeof (n as any).disconnect === "function") (n as any).disconnect();
      } catch {}
    });
    currentNodesRef.current = [];
    setStatus("idle");
  }, []);

  const buildFromSpec = useCallback(
    (ctx: BaseAudioContext, spec: SoundSpec, destGainOverride: GainNode | null = null): Recipe => {
      const dest = destGainOverride || masterGainRef.current!;
      const p = spec?.params || {};
      const type = spec?.type || "noise";

      if (type === "tactile") {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 250;
        lp.Q.value = 0.2;
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 0;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.25;
        lp.connect(limiter).connect(dest);
        const noise = ctx.createBufferSource();
        noise.buffer = makeNoiseBuffer(ctx, 2);
        noise.loop = true;
        const noiseColored = colorize(noise, ctx, "pink") as AudioNode;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.06;
        noise.connect(noiseColored).connect(noiseGain).connect(lp);
        let nodes: AudioNode[] = [lp, limiter, noise, noiseColored, noiseGain];
        let label = `Tactile ${p.pattern}`;

        if (p.pattern === "steady") {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = p.base;
          const gain = ctx.createGain();
          gain.gain.value = 0.9;
          osc.connect(gain).connect(lp);
          nodes.push(osc, gain);
          label += ` @ ${p.base.toFixed(0)} Hz`;
          return {
            start: (w) => {
              osc.start(w);
              noise.start(w);
            },
            stop: () => {
              try {
                osc.stop();
                noise.stop();
              } catch {}
            },
            nodes,
            label,
            spec,
          };
        }
      }

      if (type === "noise") {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, 2);
        src.loop = true;
        const colored = colorize(src, ctx, p.color || "white");
        const amp = ctx.createGain();
        amp.gain.value = 1.0;
        if (p.amEnabled)
          connectLFO(ctx, {
            type: p.amWave || "sine",
            freq: p.amFreq || 16,
            depth: (p.amDepth || 0.5) * 0.5,
            targetParam: amp.gain,
            offset: 1.0 - (p.amDepth || 0.5) * 0.25,
          });
        (colored as AudioNode).connect(amp);
        let last: AudioNode = amp;
        if (p.filterType && p.filterType !== "none") {
          const biq = ctx.createBiquadFilter();
          biq.type = p.filterType === "bp" ? ("bandpass" as BiquadFilterType) : p.filterType === "lp" ? ("lowpass" as BiquadFilterType) : ("highpass" as BiquadFilterType);
          biq.frequency.value = p.filterCenter || 800;
          biq.Q.value = p.filterQ || 1.0;
          last.connect(biq);
          last = biq;
          if (p.filterLfoOn)
            connectLFO(ctx, {
              type: "sine",
              freq: p.filterLfoFreq || 0.2,
              depth: p.filterLfoDepth || 400,
              targetParam: biq.frequency,
              offset: p.filterCenter || 800,
            });
        }
        const pan = stereoPanner(ctx, 0);
        last.connect(pan);
        pan.connect(dest);
        const label = `${(p.color || "white").toUpperCase()} noise${p.amEnabled ? ` + ${(p.amWave || "sine")}-AM @ ${(p.amFreq || 16).toFixed(1)} Hz` : ""}${p.filterType && p.filterType !== "none" ? ` + ${(p.filterType).toUpperCase()} sweep` : ""}`;
        return {
          start: (w) => src.start(w),
          stop: () => {
            try {
              src.stop();
            } catch {}
          },
          nodes: [src, colored !== src ? (colored as AudioNode) : null, amp, last !== amp ? last : null, pan].filter(Boolean) as AudioNode[],
          label,
          spec,
        };
      }

      if (type === "binaural") {
        const { carrier = 400, beat = 18, toneWave = "sine", vibOn, vibRate, vibDepth, noiseBedGain = 0.2 } = p;
        const leftOsc = ctx.createOscillator();
        (leftOsc as OscillatorNode).type = toneWave as OscillatorType;
        (leftOsc as OscillatorNode).frequency.value = carrier;
        const rightOsc = ctx.createOscillator();
        (rightOsc as OscillatorNode).type = toneWave as OscillatorType;
        (rightOsc as OscillatorNode).frequency.value = carrier + beat;
        const leftPan = stereoPanner(ctx, -0.6);
        const rightPan = stereoPanner(ctx, 0.6);
        const toneGain = ctx.createGain();
        toneGain.gain.value = 0.45;
        if (vibOn) {
          connectLFO(ctx, { type: "sine", freq: vibRate, depth: vibDepth, targetParam: (leftOsc as OscillatorNode).frequency, offset: carrier });
          connectLFO(ctx, { type: "sine", freq: vibRate, depth: vibDepth, targetParam: (rightOsc as OscillatorNode).frequency, offset: carrier + beat });
        }
        leftOsc.connect(leftPan).connect(toneGain);
        rightOsc.connect(rightPan).connect(toneGain);
        toneGain.connect(dest);
        const noise = ctx.createBufferSource();
        noise.buffer = makeNoiseBuffer(ctx, 2);
        noise.loop = true;
        const noiseColored = colorize(noise, ctx, "pink");
        const noiseGainNode = ctx.createGain();
        noiseGainNode.gain.value = noiseBedGain;
        noise.connect(noiseColored).connect(noiseGainNode).connect(dest);
        const label = `Binaural ~${beat.toFixed(1)} Hz + pink bed`;
        return {
          start: (w) => {
            leftOsc.start(w);
            rightOsc.start(w);
            noise.start(w);
          },
          stop: () => {
            try {
              leftOsc.stop();
              rightOsc.stop();
              noise.stop();
            } catch {}
          },
          nodes: [leftOsc, rightOsc, leftPan, rightPan, toneGain, noise, noiseColored as AudioNode, noiseGainNode],
          label,
          spec,
        };
      }

      return { start: () => {}, stop: () => {}, nodes: [], label: "Unknown", spec: { type: "unknown", params: {}, masterGain: 0, abruptStart: false } };
    },
    [colorize, makeNoiseBuffer, connectLFO, stereoPanner]
  );

  const playWithSpec = useCallback(
    async (spec: SoundSpec) => {
      const ctx = ensureContext();
      await ctx!.resume();
      hardStopAll();

      const recipe = buildFromSpec(ctx as BaseAudioContext, spec);
      currentNodesRef.current.push(...recipe.nodes);

      const now = ctx!.currentTime;
      let targetGain = spec?.masterGain || 0.25;
      const abrupt = spec?.abruptStart ?? abruptStart;
      if ((spec?.type || "") === "tactile" || tactileMode) targetGain = Math.min(targetGain, 0.25);

      masterGainRef.current!.gain.cancelScheduledValues(now);
      masterGainRef.current!.gain.setValueAtTime(masterGainRef.current!.gain.value || START_GAIN, now);
      masterGainRef.current!.gain.linearRampToValueAtTime(targetGain, now + (abrupt ? ABRUPT_FADE_SEC : FADE_SEC));

      recipe.start(now + 0.01);
      setLastLabel(recipe.label);
      setLastSpec({ ...spec, type: recipe.spec.type, params: recipe.spec.params, masterGain: targetGain, abruptStart: abrupt });
      setStatus("playing");
    },
    [ensureContext, hardStopAll, buildFromSpec, abruptStart, tactileMode]
  );

  const buildRandomRecipe = useCallback(
    (ctx: AudioContext): Recipe => {
      if (tactileMode) {
        const pattern = choice(["steady", "pulse", "sweep", "beat"]);
        const base = rand(60, 180);
        const p = { pattern, base, pulseRate: rand(4, 10), sweepSpan: rand(40, 120), beatDelta: rand(1, 5) };
        return buildFromSpec(ctx, { type: "tactile", params: p, masterGain: 0.25, abruptStart: abruptStart });
      }

      const color = choice(["white", "pink", "brown", "blue"]);
      const amEnabled = Math.random() < 0.75;
      const amWave = choice(["sine", "triangle", "square"]);
      const amFreq = rand(6, 40);
      const amDepth = rand(0.2, 0.9);
      const filterType = choice(["none", "bp", "lp", "hp", "bp"]);
      const filterLfoOn = Math.random() < 0.6;
      const filterCenter = rand(200, 4000);
      const filterQ = rand(0.3, 2.0);
      const filterLfoFreq = rand(0.05, 0.35);
      const filterLfoDepth = rand(200, 1200);
      const spec: SoundSpec = {
        type: "noise",
        params: { color, amEnabled, amWave, amFreq, amDepth, filterType, filterCenter, filterQ, filterLfoOn, filterLfoFreq, filterLfoDepth },
        masterGain: rand(0.18, 0.34),
        abruptStart: abruptStart,
      };
      return buildFromSpec(ctx, spec);
    },
    [tactileMode, abruptStart, buildFromSpec]
  );

  const playRandom = useCallback(async () => {
    const ctx = ensureContext();
    await ctx!.resume();
    hardStopAll();
    const recipe = buildRandomRecipe(ctx as AudioContext);
    playWithSpec(recipe.spec);
  }, [ensureContext, hardStopAll, buildRandomRecipe, playWithSpec]);

  const playFromControls = useCallback(async () => {
    const spec: SoundSpec = {
      type: "noise",
      params: soundParams,
      masterGain: soundParams.masterGain,
      abruptStart: abruptStart,
    };
    playWithSpec(spec);
  }, [soundParams, abruptStart, playWithSpec]);

  const stopAll = useCallback((fade = FADE_SEC) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const now = ctx.currentTime;
    masterGainRef.current.gain.cancelScheduledValues(now);
    masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
    masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + Math.max(0.05, fade));
    stopTimerRef.current = window.setTimeout(() => {
      hardStopAll();
    }, (Math.max(0.05, fade) + 0.05) * 1000);
  }, [hardStopAll]);

  useEffect(() => {
    if (status === "playing" && activeTab === "studio") {
      playFromControls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundParams, status, activeTab]);

  const saveFavorite = () => {
    if (!lastSpec || !lastLabel) return;
    const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : String(Date.now());
    const name = window.prompt("Name this favorite:", lastLabel) || lastLabel;
    const item: Favorite = { id, name, label: lastLabel, spec: lastSpec, createdAt: Date.now() };
    persistFavorites([item, ...favorites].slice(0, 50));
    toast({ title: "Favorite saved!", description: name });
  };

  const renameFavorite = (id: string) => {
    const fav = favorites.find((f) => f.id === id);
    if (!fav) return;
    const name = window.prompt("Rename favorite:", fav.name || fav.label);
    if (!name) return;
    const next = favorites.map((f) => (f.id === id ? { ...f, name } : f));
    persistFavorites(next);
  };

  const deleteFavorite = (id: string) => {
    persistFavorites(favorites.filter((f) => f.id !== id));
  };

  const downloadSpecAsWav = useCallback(
    async (spec: SoundSpec, filenameBase = "ADHD_Sound") => {
      try {
        setIsRendering(true);
        const duration = Math.max(2, Math.min(600, Math.round(spec?.duration || DEFAULT_DOWNLOAD_SEC)));
        const frames = duration * SAMPLE_RATE;
        const ctx = new OfflineAudioContext(2, frames, SAMPLE_RATE);
        const master = ctx.createGain();
        master.gain.setValueAtTime(0.0001, 0);
        master.connect(ctx.destination);
        const recipe = buildFromSpec(ctx as unknown as BaseAudioContext, spec, master);
        const target = spec?.masterGain || 0.25;
        const fadeIn = spec?.abruptStart ? ABRUPT_FADE_SEC : 0.05;
        master.gain.linearRampToValueAtTime(target, fadeIn);
        master.gain.setValueAtTime(target, Math.max(fadeIn, duration - 0.1));
        master.gain.linearRampToValueAtTime(0.0001, duration);
        recipe.start(0.0);
        const buffer = await ctx.startRendering();

        const numCh = buffer.numberOfChannels,
          sampleRate = buffer.sampleRate,
          numFrames = buffer.length,
          bytesPerSample = 2,
          blockAlign = numCh * bytesPerSample,
          byteRate = sampleRate * blockAlign,
          dataSize = numFrames * blockAlign,
          headerSize = 44,
          totalSize = headerSize + dataSize;
        const ab = new ArrayBuffer(totalSize);
        const dv = new DataView(ab);
        const writeString = (off: number, s: string) => {
          for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
        };
        writeString(0, "RIFF");
        dv.setUint32(4, totalSize - 8, true);
        writeString(8, "WAVE");
        writeString(12, "fmt ");
        dv.setUint32(16, 16, true);
        dv.setUint16(20, 1, true);
        dv.setUint16(22, numCh, true);
        dv.setUint32(24, sampleRate, true);
        dv.setUint32(28, byteRate, true);
        dv.setUint16(32, blockAlign, true);
        dv.setUint16(34, 16, true);
        writeString(36, "data");
        dv.setUint32(40, dataSize, true);
        const chData: Float32Array[] = [];
        for (let ch = 0; ch < numCh; ch++) chData[ch] = buffer.getChannelData(ch);
        let offset = 44;
        for (let i = 0; i < numFrames; i++) {
          for (let ch = 0; ch < numCh; ch++) {
            let s = Math.max(-1, Math.min(1, chData[ch][i]));
            dv.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
            offset += 2;
          }
        }
        const blob = new Blob([ab], { type: "audio/wav" });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filenameBase.replace(/[^a-z0-9\-_]+/gi, "_")}.wav`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        toast({ title: "Download complete!", description: `${filenameBase}.wav` });
      } catch (e) {
        // keep console for debugging renderer issues
        // eslint-disable-next-line no-console
        console.error(e);
        toast({ variant: "destructive", title: "Download failed", description: "Could not render audio. Please try again." });
      } finally {
        setIsRendering(false);
      }
    },
    [buildFromSpec, toast]
  );

  const handlePresetSelect = (presetSpec: SoundSpec) => {
    playWithSpec(presetSpec);
    setSoundParams({ ...initialSoundParams, ...presetSpec.params, masterGain: presetSpec.masterGain });
    setActiveTab("studio");
  };

  return (
    <Card className="flex flex-col h-full bg-transparent border-0 shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-primary" />
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription>Generative audio for focus and stimulation.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow min-h-0 gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="player">Player</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
            <TabsTrigger value="favorites">Favorites ({favorites.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="player" className="flex flex-col flex-grow justify-center items-center gap-4 pt-4">
            <div className="flex items-center justify-center gap-4">
              <Button onClick={playRandom} size="lg" className="w-24 h-16">
                <Shuffle className="w-8 h-8" />
              </Button>
              <Button onClick={() => stopAll()} size="lg" variant="destructive" className="w-24 h-16" disabled={status !== "playing"}>
                <Square className="w-8 h-8" />
              </Button>
            </div>
            <div className="space-y-3 w-full max-w-sm pt-4">
              <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                <Label htmlFor="abrupt-start" className="flex items-center gap-2 text-sm font-normal">
                  Abrupt Start
                </Label>
                <Switch id="abrupt-start" checked={abruptStart} onCheckedChange={setAbruptStart} />
              </div>
              <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                <Label htmlFor="tactile-mode" className="flex items-center gap-2 text-sm font-normal">
                  <Speaker className="w-4 h-4" /> Tactile Resonance
                </Label>
                <Switch id="tactile-mode" checked={tactileMode} onCheckedChange={setTactileMode} />
              </div>
            </div>
            <div className="text-center p-2 rounded-lg mt-4 w-full min-h-[60px] bg-secondary">
              <p className="text-xs text-muted-foreground">Now Playing</p>
              <p className="text-sm font-semibold truncate">{lastLabel || "—"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={saveFavorite} disabled={!lastSpec || status !== "playing"}>
                <Heart className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => lastSpec && downloadSpecAsWav(lastSpec, lastLabel || "sound")} disabled={!lastSpec || isRendering}>
                {isRendering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="presets" className="flex-grow min-h-0 pt-2">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="grid grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <Button key={preset.name} variant="outline" className="h-16 text-base" onClick={() => handlePresetSelect(preset.spec)}>
                    {preset.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="studio" className="flex-grow min-h-0 pt-2">
            <div className="flex justify-center gap-2 mb-2">
              <Button onClick={playFromControls} disabled={status === "playing"}>
                <Play className="w-4 h-4 mr-2" /> Play
              </Button>
              <Button onClick={() => stopAll()} variant="destructive" disabled={status !== "playing"}>
                <Square className="w-4 h-4 mr-2" /> Stop
              </Button>
            </div>
            <ScrollArea className="h-[calc(100%-40px)] pr-4 -mr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Master Gain: {soundParams.masterGain.toFixed(2)}</Label>
                  <Slider value={[soundParams.masterGain]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, masterGain: v }))} min={0} max={0.5} step={0.01} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Noise Color</Label>
                    <Select value={soundParams.color} onValueChange={(v) => setSoundParams((p) => ({ ...p, color: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                        <SelectItem value="brown">Brown</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>AM Wave</Label>
                    <Select value={soundParams.amWave} onValueChange={(v) => setSoundParams((p) => ({ ...p, amWave: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sine">Sine</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="triangle">Triangle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>AM Freq: {soundParams.amFreq.toFixed(1)} Hz</Label>
                  <Slider value={[soundParams.amFreq]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, amFreq: v }))} min={1} max={50} step={0.5} />
                </div>
                <div className="space-y-2">
                  <Label>AM Depth: {soundParams.amDepth.toFixed(2)}</Label>
                  <Slider value={[soundParams.amDepth]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, amDepth: v }))} min={0} max={1} step={0.05} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filter Type</Label>
                    <Select value={soundParams.filterType} onValueChange={(v) => setSoundParams((p) => ({ ...p, filterType: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="lp">Lowpass</SelectItem>
                        <SelectItem value="hp">Highpass</SelectItem>
                        <SelectItem value="bp">Bandpass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filter Q: {soundParams.filterQ.toFixed(2)}</Label>
                    <Slider value={[soundParams.filterQ]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, filterQ: v }))} min={0.1} max={5} step={0.1} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Filter Center: {soundParams.filterCenter.toFixed(0)} Hz</Label>
                  <Slider value={[soundParams.filterCenter]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, filterCenter: v }))} min={100} max={8000} step={10} />
                </div>
                <div className="space-y-2">
                  <Label>Filter LFO Freq: {soundParams.filterLfoFreq.toFixed(2)} Hz</Label>
                  <Slider value={[soundParams.filterLfoFreq]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, filterLfoFreq: v }))} min={0.05} max={1} step={0.05} />
                </div>
                <div className="space-y-2">
                  <Label>Filter LFO Depth: {soundParams.filterLfoDepth.toFixed(0)} Hz</Label>
                  <Slider value={[soundParams.filterLfoDepth]} onValueChange={([v]) => setSoundParams((p) => ({ ...p, filterLfoDepth: v }))} min={0} max={2000} step={10} />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="favorites" className="flex-grow min-h-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              {favorites.length === 0 ? (
                <p className="text-center text-muted-foreground pt-10">No favorites yet.</p>
              ) : (
                <div className="space-y-2">
                  {favorites.map((fav) => (
                    <div key={fav.id} className="p-3 bg-secondary rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{fav.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{fav.label}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => renameFavorite(fav.id)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteFavorite(fav.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" className="flex-1" onClick={() => playWithSpec(fav.spec)}>
                          <Play className="w-4 h-4 mr-2" /> Play
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => downloadSpecAsWav(fav.spec, fav.name)} disabled={isRendering}>
                          {isRendering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                          WAV
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
