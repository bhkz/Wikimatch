/**
 * Touchline Commander (labo) — simulateur d'entraîneur à la voix.
 * Le match se joue tout seul (moteur lib/touchline/engine) ; le joueur ne
 * contrôle personne : il PARLE. Web Speech API (fr-FR) + repli texte.
 * Rendu canvas style broadcast : caméra TV, vue tactique, bord de terrain,
 * mode analyse (lignes, zones chaudes, intentions).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FIELD, applyOrder, avgFatigue, avgMorale, clockLabel, createMatch,
  lineOf, possessionPct, step,
  type Feedback, type Match, type Player,
} from "../lib/touchline/engine";
import { EXAMPLES, parseOrder } from "../lib/touchline/parser";

type CamMode = "tv" | "tactique" | "banc";
const CAM_LABEL: Record<CamMode, string> = { tv: "Caméra TV", tactique: "Vue tactique", banc: "Bord terrain" };

/* ----------------------- reconnaissance vocale (types) ---------------------- */
type RecEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type Rec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: RecEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};
function makeRecognition(): Rec | null {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "fr-FR";
  r.continuous = true;
  r.interimResults = true;
  return r;
}

/* --------------------------------- audio ----------------------------------- */
type Crowd = { ctx: AudioContext; gain: GainNode; setLevel: (v: number) => void; goal: () => void; stop: () => void };
function makeCrowd(): Crowd | null {
  try {
    const ctx = new AudioContext();
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // bruit brun ≈ rumeur de stade
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    return {
      ctx, gain,
      setLevel: (v) => gain.gain.setTargetAtTime(0.028 + v * 0.0009, ctx.currentTime, 0.4),
      goal: () => {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(0.22, ctx.currentTime, 0.05);
        gain.gain.setTargetAtTime(0.04, ctx.currentTime + 1.6, 0.8);
      },
      stop: () => { void ctx.close(); },
    };
  } catch {
    return null;
  }
}

/* --------------------------------- page ------------------------------------ */

type Toast = { id: number; level: Feedback["level"]; text: string };

export default function Touchline() {
  const matchRef = useRef<Match>(createMatch());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const camPos = useRef({ x: FIELD.w / 2, y: FIELD.h / 2 });
  const trail = useRef<Array<{ x: number; y: number }>>([]);
  const heat = useRef<number[]>(new Array(14 * 9).fill(0));
  const eventCount = useRef(0);
  const crowdRef = useRef<Crowd | null>(null);
  const recRef = useRef<Rec | null>(null);

  const [, setTick] = useState(0); // refresh HUD 4 Hz
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [cam, setCam] = useState<CamMode>("tv");
  const [analysis, setAnalysis] = useState(false);
  const [speed, setSpeed] = useState(8);
  const [micOn, setMicOn] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [orders, setOrders] = useState<Array<{ raw: string; fb: Feedback }>>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [textCmd, setTextCmd] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  const roster = useMemo(
    () => matchRef.current.players.filter((p) => p.side === "home").map((p) => ({ num: p.num, name: p.name })),
    [],
  );

  const pushToast = useCallback((fb: Feedback) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts.slice(-2), { id, level: fb.level, text: fb.text }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3800);
  }, []);

  const handleCommand = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const parsed = parseOrder(text, roster);
      const fb = applyOrder(matchRef.current, parsed);
      setOrders((o) => [{ raw: text, fb }, ...o].slice(0, 6));
      pushToast(fb);
    },
    [roster, pushToast],
  );

  /* ------------------------------ micro ------------------------------ */
  useEffect(() => {
    if (!micOn) {
      recRef.current?.stop();
      recRef.current = null;
      setInterim("");
      return;
    }
    const rec = makeRecognition();
    if (!rec) {
      setMicSupported(false);
      setMicOn(false);
      return;
    }
    recRef.current = rec;
    let alive = true;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          setInterim("");
          handleCommand(r[0].transcript);
        } else setInterim(r[0].transcript);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        setMicSupported(false);
        setMicOn(false);
      }
    };
    rec.onend = () => {
      if (alive && recRef.current === rec) {
        try { rec.start(); } catch { /* déjà relancé */ }
      }
    };
    try { rec.start(); } catch { /* double start bénin */ }
    return () => {
      alive = false;
      rec.onend = null;
      try { rec.stop(); } catch { /* déjà stoppé */ }
    };
  }, [micOn, handleCommand]);

  /* --------------------------- boucle de rendu --------------------------- */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;

    function frame(now: number) {
      const m = matchRef.current;
      const dtReal = Math.min((now - last) / 1000, 0.1);
      last = now;
      // Simulation en sous-pas pour rester stable aux grandes vitesses.
      const simDt = dtReal * speed;
      const steps = Math.max(1, Math.ceil(simDt / 0.06));
      for (let i = 0; i < steps; i++) step(m, simDt / steps);

      // Sons & événements nouveaux.
      if (m.events.length > eventCount.current) {
        for (const ev of m.events.slice(eventCount.current)) {
          if (ev.kind === "but" && crowdRef.current && soundOn) crowdRef.current.goal();
        }
        eventCount.current = m.events.length;
      }
      crowdRef.current?.setLevel(soundOn ? m.danger : -40);

      // Traînée + zones chaudes.
      trail.current.push({ ...m.ball.pos });
      if (trail.current.length > 14) trail.current.shift();
      const cellIdx = Math.min(13, Math.floor((m.ball.pos.x / FIELD.w) * 14)) + Math.min(8, Math.floor((m.ball.pos.y / FIELD.h) * 9)) * 14;
      heat.current[cellIdx] = Math.min(heat.current[cellIdx] + dtReal * 0.5, 8);

      render(m);
      renderMini(m);
      if (now - hudAt > 250) { hudAt = now; setTick((v) => v + 1); }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, cam, analysis, soundOn, selected]);

  /* ------------------------------- rendu -------------------------------- */
  function render(m: Match): void {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr) { canvas.width = cw * dpr; canvas.height = ch * dpr; }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Caméra.
    let scale: number, squash = 1;
    if (cam === "tactique") scale = Math.min(cw / (FIELD.w + 8), ch / (FIELD.h + 8));
    else if (cam === "tv") { scale = cw / 56; squash = 0.92; }
    else { scale = cw / 46; squash = 0.6; }
    const follow = cam !== "tactique";
    const targetX = follow ? m.ball.pos.x : FIELD.w / 2;
    const targetY = follow ? m.ball.pos.y : FIELD.h / 2;
    camPos.current.x += (targetX - camPos.current.x) * 0.05;
    camPos.current.y += (targetY - camPos.current.y) * 0.05;
    const viewW = cw / scale, viewH = ch / (scale * squash);
    const cx = follow ? Math.max(viewW / 2 - 6, Math.min(FIELD.w - viewW / 2 + 6, camPos.current.x)) : FIELD.w / 2;
    const cy = follow ? Math.max(viewH / 2 - 6, Math.min(FIELD.h - viewH / 2 + 6, camPos.current.y)) : FIELD.h / 2;
    const W = (x: number) => (x - cx) * scale + cw / 2;
    const Hs = (y: number) => (y - cy) * scale * squash + ch / 2;

    // Ciel/stade.
    const bg = ctx.createLinearGradient(0, 0, 0, ch);
    bg.addColorStop(0, "#04060d");
    bg.addColorStop(1, "#070b16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

    // Pelouse + bandes de tonte.
    const gx0 = W(-3), gy0 = Hs(-3), gx1 = W(FIELD.w + 3), gy1 = Hs(FIELD.h + 3);
    const grass = ctx.createLinearGradient(0, gy0, 0, gy1);
    grass.addColorStop(0, "#0c2f1d");
    grass.addColorStop(0.5, "#11402a");
    grass.addColorStop(1, "#0a2818");
    ctx.fillStyle = grass;
    ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
    for (let i = 0; i < 14; i++) {
      if (i % 2) continue;
      ctx.fillStyle = "rgba(255,255,255,0.022)";
      ctx.fillRect(W((i * FIELD.w) / 14), gy0, (FIELD.w / 14) * scale, gy1 - gy0);
    }

    // Lignes.
    ctx.strokeStyle = "rgba(235,245,255,0.32)";
    ctx.lineWidth = Math.max(1, 0.18 * scale);
    ctx.strokeRect(W(0), Hs(0), FIELD.w * scale, FIELD.h * scale * squash);
    ctx.beginPath(); ctx.moveTo(W(FIELD.w / 2), Hs(0)); ctx.lineTo(W(FIELD.w / 2), Hs(FIELD.h)); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W(FIELD.w / 2), Hs(FIELD.h / 2), 9.15 * scale, 9.15 * scale * squash, 0, 0, Math.PI * 2); ctx.stroke();
    for (const gx of [0, FIELD.w]) {
      const dir = gx === 0 ? 1 : -1;
      ctx.strokeRect(W(gx === 0 ? 0 : FIELD.w - 16.5), Hs(34 - 20.16), 16.5 * scale, 40.32 * scale * squash);
      ctx.strokeRect(W(gx === 0 ? 0 : FIELD.w - 5.5), Hs(34 - 9.16), 5.5 * scale, 18.32 * scale * squash);
      // Buts lumineux.
      ctx.save();
      ctx.strokeStyle = "rgba(140,210,255,0.75)";
      ctx.shadowColor = "rgba(120,200,255,0.8)";
      ctx.shadowBlur = 10;
      ctx.lineWidth = Math.max(2, 0.3 * scale);
      ctx.beginPath();
      ctx.moveTo(W(gx), Hs(34 - 3.66));
      ctx.lineTo(W(gx - dir * 1.6), Hs(34 - 3.66));
      ctx.lineTo(W(gx - dir * 1.6), Hs(34 + 3.66));
      ctx.lineTo(W(gx), Hs(34 + 3.66));
      ctx.stroke();
      ctx.restore();
    }

    // Mode analyse : zones chaudes + lignes d'équipe.
    if (analysis) {
      for (let i = 0; i < 14; i++) for (let j = 0; j < 9; j++) {
        const v = heat.current[i + j * 14];
        if (v <= 0.3) continue;
        ctx.fillStyle = `rgba(255,120,60,${Math.min(v / 22, 0.32)})`;
        ctx.fillRect(W((i * FIELD.w) / 14), Hs((j * FIELD.h) / 9), (FIELD.w / 14) * scale, (FIELD.h / 9) * scale * squash);
      }
      for (const side of ["home", "away"] as const) {
        const color = side === "home" ? "rgba(34,211,238,0.55)" : "rgba(251,113,133,0.4)";
        for (const ln of ["DEF", "MID"] as const) {
          const pts = m.players.filter((p) => p.side === side && lineOf(p.role) === ln).sort((a, b) => a.pos.y - b.pos.y);
          if (pts.length < 2) continue;
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          pts.forEach((p, i) => (i === 0 ? ctx.moveTo(W(p.pos.x), Hs(p.pos.y)) : ctx.lineTo(W(p.pos.x), Hs(p.pos.y))));
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // Traînée du ballon.
    trail.current.forEach((p, i) => {
      ctx.fillStyle = `rgba(255,255,255,${(i / trail.current.length) * 0.25})`;
      ctx.beginPath();
      ctx.arc(W(p.x), Hs(p.y), Math.max(1.5, 0.22 * scale), 0, Math.PI * 2);
      ctx.fill();
    });

    // Joueurs.
    const showNames = cam !== "tactique";
    for (const p of m.players) {
      const x = W(p.pos.x), y = Hs(p.pos.y);
      const r = Math.max(5, 1.05 * scale * (cam === "banc" ? 1.25 : 1));
      const team = p.side === "home" ? m.home : m.away;
      // Ombre.
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(x + r * 0.18, y + r * 0.5, r * 0.95, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      // Halo de consigne comprise.
      if (p.intentUntil > m.t && p.intent) {
        ctx.save();
        ctx.strokeStyle = "rgba(204,255,0,0.9)";
        ctx.shadowColor = "rgba(204,255,0,0.9)";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (selected === p.id) {
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Maillot.
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.2, x, y, r);
      grad.addColorStop(0, team.color);
      grad.addColorStop(1, team.dark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = p.role === "GK" ? "#fbbf24" : "rgba(255,255,255,0.55)";
      ctx.lineWidth = p.role === "GK" ? 2 : 1;
      ctx.stroke();
      // Numéro.
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${Math.max(8, r * 0.95)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(p.num), x, y + 0.5);
      // Nom + intention.
      if (showNames) {
        ctx.font = `500 ${Math.max(8, r * 0.62)}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(p.name, x, y - r - 7);
        if (p.intentUntil > m.t && p.intent) {
          ctx.fillStyle = "rgba(204,255,0,0.95)";
          ctx.font = `600 ${Math.max(7, r * 0.55)}px 'JetBrains Mono', monospace`;
          ctx.fillText(`▲ ${p.intent}`, x, y + r + 9);
        }
      }
      // Flèches d'intention en mode analyse.
      if (analysis) {
        for (const e of p.effects) {
          if (e.until < m.t) continue;
          const dir = p.side === "home" ? 1 : -1;
          const tx = x + (e.kind === "push" ? dir * 24 : e.kind === "depth" ? dir * 30 : e.dx * 1.6) ;
          const ty = y + e.dy * 1.6;
          if (tx === x && ty === y) continue;
          ctx.strokeStyle = "rgba(204,255,0,0.7)";
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.beginPath(); ctx.arc(tx, ty, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(204,255,0,0.7)";
          ctx.fill();
        }
      }
    }

    // Ballon.
    {
      const x = W(m.ball.pos.x), y = Hs(m.ball.pos.y);
      ctx.save();
      ctx.shadowColor = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 9;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, 0.42 * scale), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function renderMini(m: Match): void {
    const c = miniRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(8,14,24,0.92)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(180,220,255,0.3)";
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.beginPath(); ctx.moveTo(w / 2, 4); ctx.lineTo(w / 2, h - 4); ctx.stroke();
    const X = (x: number) => 4 + (x / FIELD.w) * (w - 8);
    const Y = (y: number) => 4 + (y / FIELD.h) * (h - 8);
    for (const p of m.players) {
      ctx.fillStyle = p.side === "home" ? m.home.color : m.away.color;
      ctx.beginPath();
      ctx.arc(X(p.pos.x), Y(p.pos.y), p.role === "GK" ? 3 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(X(m.ball.pos.x), Y(m.ball.pos.y), 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ------------------------------ interactions --------------------------- */
  function onCanvasClick(e: React.MouseEvent<HTMLCanvasElement>): void {
    const m = matchRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    let best: Player | null = null;
    let bestD = 26;
    // Inversion approx : re-projeter chaque joueur (réutilise la même caméra au prochain frame, suffisant).
    const cw = rect.width, ch = rect.height;
    let scale: number, squash = 1;
    if (cam === "tactique") scale = Math.min(cw / (FIELD.w + 8), ch / (FIELD.h + 8));
    else if (cam === "tv") { scale = cw / 56; squash = 0.92; }
    else { scale = cw / 46; squash = 0.6; }
    const cx = cam === "tactique" ? FIELD.w / 2 : camPos.current.x;
    const cy = cam === "tactique" ? FIELD.h / 2 : camPos.current.y;
    for (const p of m.players) {
      const x = (p.pos.x - cx) * scale + cw / 2;
      const y = (p.pos.y - cy) * scale * squash + ch / 2;
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) { bestD = d; best = p; }
    }
    setSelected(best ? best.id : null);
  }

  function startMatch(): void {
    setStarted(true);
    matchRef.current.running = true;
    if (soundOn && !crowdRef.current) crowdRef.current = makeCrowd();
  }
  function togglePause(): void {
    const m = matchRef.current;
    if (m.finished) return;
    m.running = !m.running;
    setPaused(!m.running);
  }
  function restart(): void {
    matchRef.current = createMatch();
    eventCount.current = 0;
    heat.current.fill(0);
    setOrders([]);
    setSelected(null);
    setStarted(true);
    matchRef.current.running = true;
  }
  useEffect(() => () => { crowdRef.current?.stop(); }, []);

  /* --------------------------------- HUD --------------------------------- */
  const m = matchRef.current;
  const poss = possessionPct(m);
  const fatigue = avgFatigue(m, "home");
  const morale = avgMorale(m, "home");
  const selPlayer = selected !== null ? m.players[selected] : null;
  const levelColor: Record<Feedback["level"], string> = {
    ok: "text-lime-300", partial: "text-amber-300", confused: "text-rose-400", tired: "text-orange-400", none: "text-slate-400",
  };

  return (
    <div className="fixed inset-0 bg-[#04060d] text-slate-100 font-sans flex flex-col overflow-hidden select-none">
      {/* Barre broadcast */}
      <header className="flex items-center gap-4 px-4 py-2 border-b border-white/10 bg-[#070b16]/90 z-20">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-200">← Atlas</Link>
        <div className="font-['Bebas_Neue'] text-2xl tracking-wider text-cyan-300">TOUCHLINE COMMANDER</div>
        <div className="ml-auto flex items-center gap-3 font-mono text-sm">
          <span className="px-2 py-0.5 rounded-sm" style={{ background: m.home.dark }}>{m.home.short}</span>
          <span className="font-['Bebas_Neue'] text-3xl tabular-nums">{m.score[0]}–{m.score[1]}</span>
          <span className="px-2 py-0.5 rounded-sm" style={{ background: m.away.dark }}>{m.away.short}</span>
          <span className="text-cyan-300 tabular-nums w-14 text-center">{clockLabel(m)}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{m.t < 2700 ? "1re MT" : "2de MT"}</span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Terrain */}
        <div className="relative flex-1 min-w-0">
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" onClick={onCanvasClick} />

          {/* Stats broadcast bas-gauche */}
          <div className="absolute left-3 bottom-3 z-10 bg-[#070b16]/85 border border-white/10 rounded-sm px-3 py-2.5 font-mono text-[10px] space-y-1.5 w-52 backdrop-blur">
            <div className="flex justify-between"><span className="text-slate-400">POSSESSION</span><span>{poss}% – {100 - poss}%</span></div>
            <div className="h-1 bg-white/10"><div className="h-1" style={{ width: `${poss}%`, background: m.home.color }} /></div>
            <div className="flex justify-between"><span className="text-slate-400">TIRS (CADRÉS)</span><span>{m.stats.shots[0]} ({m.stats.sot[0]}) – {m.stats.shots[1]} ({m.stats.sot[1]})</span></div>
            <div className="flex justify-between"><span className="text-slate-400">xG</span><span>{m.stats.xg[0].toFixed(2)} – {m.stats.xg[1].toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">FATIGUE / MORAL</span><span>{fatigue} / {morale}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">COHÉSION</span><span className={m.home.cohesion < 50 ? "text-rose-400" : ""}>{Math.round(m.home.cohesion)}</span></div>
            <div>
              <div className="flex justify-between"><span className="text-slate-400">DANGER ADVERSE</span><span className={m.danger > 60 ? "text-rose-400" : "text-slate-300"}>{Math.round(m.danger)}</span></div>
              <div className="h-1 bg-white/10 mt-1"><div className="h-1 transition-all" style={{ width: `${m.danger}%`, background: `linear-gradient(90deg,#22d3ee,#f59e0b,#f43f5e)` }} /></div>
            </div>
          </div>

          {/* Mini-carte bas-droite */}
          <canvas ref={miniRef} width={185} height={122} className="absolute right-3 bottom-3 z-10 rounded-sm border border-white/10 hidden lg:block" />

          {/* Toasts de feedback */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 space-y-2 w-[26rem] max-w-[90%]">
            {toasts.map((t) => (
              <div key={t.id} className={`bg-[#070b16]/90 border border-white/10 backdrop-blur px-4 py-2 rounded-sm font-mono text-xs text-center ${levelColor[t.level]}`}>
                {t.level === "ok" ? "✔ " : t.level === "partial" ? "≈ " : t.level === "tired" ? "🥵 " : "✖ "}{t.text}
              </div>
            ))}
          </div>

          {/* Pause tactique */}
          {paused && started && !m.finished && (
            <div className="absolute inset-0 z-10 bg-black/45 backdrop-blur-[2px] flex items-center justify-center">
              <div className="text-center">
                <div className="font-['Bebas_Neue'] text-6xl text-cyan-300 tracking-widest">PAUSE TACTIQUE</div>
                <div className="font-mono text-xs text-slate-300 mt-2">Le chrono est gelé. Donnez vos consignes, puis reprenez.</div>
              </div>
            </div>
          )}

          {/* Fin de match */}
          {m.finished && (
            <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="font-['Bebas_Neue'] text-7xl tracking-wider">{m.home.short} {m.score[0]}–{m.score[1]} {m.away.short}</div>
                <div className="font-mono text-sm text-slate-300">xG {m.stats.xg[0].toFixed(2)} – {m.stats.xg[1].toFixed(2)} · possession {poss}%</div>
                <button onClick={restart} className="font-mono text-xs uppercase tracking-widest px-6 py-3 bg-cyan-400 text-black hover:bg-cyan-300">Rejouer un match</button>
              </div>
            </div>
          )}

          {/* Tutoriel */}
          {!started && (
            <div className="absolute inset-0 z-30 bg-[#04060d]/95 flex items-center justify-center p-6">
              <div className="max-w-xl space-y-5">
                <div className="font-['Bebas_Neue'] text-6xl tracking-wider text-cyan-300">TOUCHLINE COMMANDER</div>
                <p className="font-light text-slate-300 leading-relaxed">
                  Vous n'êtes pas un joueur. Vous êtes <span className="text-white font-medium">l'entraîneur</span>.
                  Le match se joue tout seul — votre seule arme, c'est votre voix.
                </p>
                <ol className="font-mono text-xs text-slate-400 space-y-2 list-decimal list-inside">
                  <li>Activez le micro 🎙 et parlez : <span className="text-lime-300">« Pressez haut »</span>, <span className="text-lime-300">« Numéro 10, décroche »</span>, <span className="text-lime-300">« Lucas, va à gauche »</span>.</li>
                  <li>Les joueurs interprètent : fatigue, intelligence et cohésion font qu'ils n'obéissent pas toujours.</li>
                  <li>Chaque choix a un coût : presser épuise, monter expose la profondeur, trop d'ordres = confusion.</li>
                </ol>
                <div className="flex gap-3">
                  <button onClick={startMatch} className="font-mono text-xs uppercase tracking-widest px-6 py-3 bg-cyan-400 text-black hover:bg-cyan-300">
                    Démarrer le match
                  </button>
                  <button
                    onClick={() => { startMatch(); setMicOn(true); }}
                    className="font-mono text-xs uppercase tracking-widest px-6 py-3 border border-cyan-400/40 text-cyan-300 hover:border-cyan-300"
                  >
                    Démarrer + activer le micro
                  </button>
                </div>
                <p className="font-mono text-[10px] text-slate-600">Micro : Chrome/Edge recommandés. Sans micro, un champ texte fait le même travail.</p>
              </div>
            </div>
          )}
        </div>

        {/* Panneau coach */}
        <aside className="w-80 shrink-0 border-l border-white/10 bg-[#070b16]/95 flex flex-col z-10">
          {/* Contrôles */}
          <div className="p-3 grid grid-cols-2 gap-2 border-b border-white/10">
            <button onClick={togglePause} disabled={!started || m.finished} className="font-mono text-[10px] uppercase tracking-widest px-2 py-2 border border-white/15 hover:border-cyan-300 disabled:opacity-40">
              {paused ? "▶ Reprendre" : "⏸ Pause tactique"}
            </button>
            <button onClick={() => setCam((c) => (c === "tv" ? "tactique" : c === "tactique" ? "banc" : "tv"))} className="font-mono text-[10px] uppercase tracking-widest px-2 py-2 border border-white/15 hover:border-cyan-300">
              🎥 {CAM_LABEL[cam]}
            </button>
            <button onClick={() => setAnalysis((v) => !v)} className={`font-mono text-[10px] uppercase tracking-widest px-2 py-2 border ${analysis ? "border-lime-300 text-lime-300" : "border-white/15 hover:border-cyan-300"}`}>
              📐 Mode analyse
            </button>
            <button onClick={() => setSpeed((s) => (s === 8 ? 16 : 8))} className="font-mono text-[10px] uppercase tracking-widest px-2 py-2 border border-white/15 hover:border-cyan-300">
              ⏩ Vitesse ×{speed === 8 ? 1 : 2}
            </button>
            <button onClick={() => setSoundOn((v) => !v)} className="font-mono text-[10px] uppercase tracking-widest px-2 py-2 border border-white/15 hover:border-cyan-300">
              {soundOn ? "🔊 Stade" : "🔇 Muet"}
            </button>
            <button
              onClick={() => setMicOn((v) => !v)}
              className={`font-mono text-[10px] uppercase tracking-widest px-2 py-2 border ${micOn ? "border-rose-400 text-rose-300" : "border-white/15 hover:border-cyan-300"}`}
            >
              {micOn ? "🎙 Micro ON" : "🎙 Micro OFF"}
            </button>
          </div>

          {/* État micro */}
          <div className="px-3 py-2 border-b border-white/10 font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${micOn ? "bg-rose-400 animate-pulse" : "bg-slate-600"}`} />
              <span className="text-slate-400 uppercase tracking-widest">{micOn ? "À l'écoute…" : micSupported ? "Micro coupé" : "Micro non disponible ici"}</span>
            </div>
            {interim && <div className="text-cyan-300 mt-1 truncate">« {interim} »</div>}
          </div>

          {/* Saisie texte (repli + toujours dispo) */}
          <form
            className="px-3 py-2 border-b border-white/10 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleCommand(textCmd); setTextCmd(""); }}
          >
            <input
              value={textCmd}
              onChange={(e) => setTextCmd(e.target.value)}
              placeholder="Consigne au clavier…"
              className="flex-1 bg-white/5 border border-white/15 px-2 py-1.5 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-300"
            />
            <button type="submit" className="font-mono text-[10px] uppercase px-3 border border-white/15 hover:border-cyan-300">OK</button>
          </form>

          {/* Dernières consignes */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Dernières consignes</div>
            {orders.length === 0 && <div className="font-mono text-[10px] text-slate-600">Le banc attend vos instructions.</div>}
            {orders.map((o, i) => (
              <div key={i} className="border border-white/10 px-2 py-1.5">
                <div className="font-mono text-[11px] text-slate-200 truncate">« {o.raw} »</div>
                <div className={`font-mono text-[10px] ${levelColor[o.fb.level]}`}>{o.fb.text}</div>
              </div>
            ))}

            {/* Joueur sélectionné */}
            {selPlayer && (
              <div className="border border-cyan-400/30 px-2 py-2 mt-3">
                <div className="font-mono text-xs text-cyan-300">#{selPlayer.num} {selPlayer.name} · {selPlayer.role} · {selPlayer.side === "home" ? m.home.short : m.away.short}</div>
                <div className="font-mono text-[10px] text-slate-400 mt-1">
                  Fatigue {Math.round(selPlayer.fatigue)} · Moral {Math.round(selPlayer.morale)}
                  {selPlayer.effects.filter((e) => e.until > m.t).length > 0 && (
                    <> · consigne : {selPlayer.intent ?? "active"}</>
                  )}
                </div>
                <div className="font-mono text-[10px] text-slate-500">
                  Vit {Math.round(selPlayer.attrs.pace * 100)} · Tech {Math.round(selPlayer.attrs.technique * 100)} · QI {Math.round(selPlayer.attrs.intelligence * 100)} · Disc {Math.round(selPlayer.attrs.discipline * 100)}
                </div>
              </div>
            )}

            {/* Journal du match */}
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500 pt-3">Le match</div>
            {[...m.events].slice(-8).reverse().map((ev, i) => (
              <div key={i} className={`font-mono text-[10px] leading-relaxed ${ev.kind === "but" ? "text-lime-300" : ev.kind === "arret" ? "text-cyan-300" : ev.kind === "consigne" ? "text-slate-500" : "text-slate-400"}`}>
                <span className="text-slate-600">{Math.floor(ev.t / 60)}'</span> {ev.text}
              </div>
            ))}
          </div>

          {/* Exemples */}
          <div className="border-t border-white/10 px-3 py-2">
            <button onClick={() => setShowExamples((v) => !v)} className="font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-cyan-300">
              {showExamples ? "▾" : "▸"} Exemples de consignes
            </button>
            {showExamples && (
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {EXAMPLES.map((ex) => (
                  <li key={ex}>
                    <button onClick={() => handleCommand(ex)} className="font-mono text-[10px] text-slate-400 hover:text-lime-300 text-left">
                      « {ex} »
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
