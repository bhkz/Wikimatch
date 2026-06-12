/**
 * Export vidéo verticale de la nuit (1080×1920, ~15-20 s) — 100 % client :
 * canvas + MediaRecorder, aucune dépendance, aucun serveur. Le format
 * TikTok/Reels/Story de la carte qui se redessine pendant que la France dort.
 *
 * Timeline : titre → carte d'avant → chaque conquête (flash + récit) →
 * carte d'après → CTA. Pas d'emoji dans le canvas (rendu non garanti) :
 * noms et couleurs des nations uniquement.
 */

import { axialToPixel, hexCorners } from "../../lib/hex";
import { colors } from "../design/tokens";
import type { MapHex, NationStyle } from "../components/HexMap";
import type { Resolution } from "./atlas";

const W = 1080;
const H = 1920;
const HEX_SIZE = 10;

type Frame = ReadonlyMap<number, { owner: string | null; state: MapHex["state"] }>;

export type NightVideoInput = {
  hexes: MapHex[];
  before: Frame | null;
  after: Frame;
  nations: ReadonlyMap<string, NationStyle>;
  resolutions: Resolution[];
  dateLabel: string;
};

export function videoExportSupported(): boolean {
  return (
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    typeof MediaRecorder !== "undefined"
  );
}

/** Retire emojis/pictogrammes : le canvas ne sait pas les rendre partout. */
function stripEmoji(text: string): string {
  return text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = probe;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export async function exportNightVideo(input: NightVideoInput): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Géométrie : projeter la carte dans un cadre 1000×~620 centré.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const projected = input.hexes.map((h) => {
    const { x, y } = axialToPixel(h, HEX_SIZE);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    return { hex: h, x, y };
  });
  const scale = Math.min(1000 / (maxX - minX + 2 * HEX_SIZE), 760 / (maxY - minY + 2 * HEX_SIZE));
  const offX = (W - (maxX - minX) * scale) / 2 - minX * scale;
  const mapTop = 560;
  const offY = mapTop - minY * scale;

  function fillOf(id: number, base: MapHex, frame: Frame | null): string {
    const f = frame?.get(id);
    const owner = f ? f.owner : base.owner;
    const state = f ? f.state : base.state;
    if (state === "memorial") return colors.mapMemorial;
    if (state === "ruins") return colors.mapRuins;
    if (state === "neutral" || owner === null) return colors.mapNeutral;
    return input.nations.get(owner)?.color ?? colors.mapNeutral;
  }

  function drawMap(frame: Frame | null, highlight: ReadonlySet<number> | null, flash: number): void {
    for (const { hex, x, y } of projected) {
      const px = x * scale + offX;
      const py = y * scale + offY;
      const corners = hexCorners(px, py, HEX_SIZE * scale * 0.96);
      ctx.beginPath();
      corners.forEach((c, i) => (i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y)));
      ctx.closePath();
      ctx.fillStyle = fillOf(hex.id, hex, frame);
      ctx.fill();
      if (highlight?.has(hex.id)) {
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.45 * Math.sin(flash * Math.PI * 4);
        ctx.strokeStyle = colors.greenAcid;
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function header(kicker: string, title: string): void {
    ctx.fillStyle = colors.blueElectric;
    ctx.font = "600 34px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(kicker.toUpperCase(), W / 2, 200);
    ctx.fillStyle = colors.cream;
    ctx.font = "120px 'Bebas Neue', sans-serif";
    const lines = wrapText(ctx, title.toUpperCase(), 960);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 340 + i * 124));
  }

  function caption(text: string, sub?: string): void {
    ctx.textAlign = "center";
    ctx.fillStyle = colors.cream;
    ctx.font = "300 44px 'Inter', sans-serif";
    const lines = wrapText(ctx, text, 920);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 1480 + i * 60));
    if (sub) {
      ctx.fillStyle = "rgba(249,248,246,0.45)";
      ctx.font = "500 30px 'JetBrains Mono', monospace";
      ctx.fillText(sub.toUpperCase(), W / 2, 1480 + lines.length * 60 + 56);
    }
  }

  // Scènes : [durée s, rendu(progress 0..1)]
  const shown = input.resolutions.slice(0, 5);
  const scenes: Array<[number, (p: number) => void]> = [
    [2.2, () => {
      header("L'Atlas du Mondial", `La nuit du ${input.dateLabel}`);
      ctx.fillStyle = "rgba(249,248,246,0.6)";
      ctx.font = "300 46px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Pendant que tu dormais,", W / 2, 950);
      ctx.fillText("la carte a bougé.", W / 2, 1020);
    }],
    ...(input.before
      ? [[2.2, () => {
          header("Hier soir", "Le monde s'endort");
          drawMap(input.before, null, 0);
        }] as [number, (p: number) => void]]
      : []),
    ...shown.map((r, idx): [number, (p: number) => void] => [2.6, (p) => {
      const taken = new Set([...r.hexes_taken, ...r.inherited_hexes]);
      header(`Conquête ${idx + 1}/${shown.length}`, "");
      drawMap(input.after, taken, p);
      caption(stripEmoji(r.narrative), r.is_draw ? "match nul" : `+${r.final_gain} territoires`);
    }]),
    [2.4, () => {
      header("Ce matin", "Le monde au réveil");
      drawMap(input.after, null, 0);
    }],
    [2.4, () => {
      header("Chaque matin, 07h30", "atlas-mondial.vercel.app");
      ctx.fillStyle = "rgba(249,248,246,0.6)";
      ctx.font = "300 44px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("La Coupe du Monde, racontée par une carte.", W / 2, 980);
    }],
  ];
  const total = scenes.reduce((s, [d]) => s + d, 0);

  // Enregistrement : mp4 si possible (Safari), sinon webm.
  const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });
  recorder.start(250);

  const start = performance.now();
  await new Promise<void>((resolve) => {
    function tick(now: number): void {
      const t = (now - start) / 1000;
      if (t >= total) return resolve();
      ctx.fillStyle = colors.navy;
      ctx.fillRect(0, 0, W, H);
      let acc = 0;
      for (const [dur, draw] of scenes) {
        if (t < acc + dur) {
          draw((t - acc) / dur);
          break;
        }
        acc += dur;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  recorder.stop();
  const blob = await done;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `atlas-nuit-${input.dateLabel.replace(/\s+/g, "-")}.${mime.startsWith("video/mp4") ? "mp4" : "webm"}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}
