import { USER_AGENT } from "./config";

const COMPARE_TIMEOUT_MS = 8000;
const MAX_TEXT_PER_SIDE = 800;

export interface DiffContent {
  added: string;
  removed: string;
  truncated: boolean;
}

function wikiHost(rawCode: string): string | null {
  if (!rawCode.endsWith("wiki")) return null;
  const lang = rawCode.slice(0, -4);
  return lang ? `${lang}.wikipedia.org` : null;
}

export function revisionUrl(wiki: string, revisionId: number | null | undefined) {
  const host = wikiHost(wiki);
  if (!host || !revisionId) return null;
  return `https://${host}/w/index.php?oldid=${revisionId}`;
}

export function diffUrl(
  wiki: string,
  fromRev: number | null | undefined,
  toRev: number | null | undefined,
) {
  const host = wikiHost(wiki);
  if (!host || !fromRev || !toRev) return null;
  return `https://${host}/w/index.php?diff=${toRev}&oldid=${fromRev}`;
}

export async function fetchDiff(
  wiki: string,
  fromRev: number | null | undefined,
  toRev: number | null | undefined,
): Promise<DiffContent | null> {
  if (!fromRev || !toRev) return null;
  const host = wikiHost(wiki);
  if (!host) return null;

  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set("action", "compare");
  url.searchParams.set("fromrev", String(fromRev));
  url.searchParams.set("torev", String(toRev));
  url.searchParams.set("prop", "diff");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const controller = new AbortController();
  const killTimer = setTimeout(() => controller.abort(), COMPARE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { compare?: { ["*"]?: string } };
    const html = data.compare?.["*"];
    return html ? parseDiffHtml(html) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(killTimer);
  }
}

export function parseDiffHtml(html: string): DiffContent {
  const added: string[] = [];
  const removed: string[] = [];
  const lineRegex =
    /<td[^>]*class="[^"]*\bdiff-(addedline|deletedline)\b[^"]*"[^>]*>([\s\S]*?)<\/td>/g;
  const insRegex = /<ins[^>]*class="[^"]*\bdiffchange\b[^"]*"[^>]*>([\s\S]*?)<\/ins>/g;
  const delRegex = /<del[^>]*class="[^"]*\bdiffchange\b[^"]*"[^>]*>([\s\S]*?)<\/del>/g;

  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(html)) !== null) {
    const kind = match[1];
    const inner = match[2];
    if (!inner) continue;

    const markerRegex = kind === "addedline" ? insRegex : delRegex;
    markerRegex.lastIndex = 0;
    const markers: string[] = [];
    let marker: RegExpExecArray | null;
    while ((marker = markerRegex.exec(inner)) !== null) {
      const text = stripHtml(marker[1] ?? "").trim();
      if (text) markers.push(text);
    }

    const text = markers.length > 0 ? markers.join(" ") : stripHtml(inner).trim();
    if (!text) continue;
    if (kind === "addedline") added.push(text);
    else removed.push(text);
  }

  let addedJoined = added.join("\n");
  let removedJoined = removed.join("\n");
  let truncated = false;
  if (addedJoined.length > MAX_TEXT_PER_SIDE) {
    addedJoined = `${addedJoined.slice(0, MAX_TEXT_PER_SIDE)}...`;
    truncated = true;
  }
  if (removedJoined.length > MAX_TEXT_PER_SIDE) {
    removedJoined = `${removedJoined.slice(0, MAX_TEXT_PER_SIDE)}...`;
    truncated = true;
  }
  return { added: addedJoined, removed: removedJoined, truncated };
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

