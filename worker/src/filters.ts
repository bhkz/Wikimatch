import type { WikimediaRecentChange } from "./types";

const IP_V4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const IP_V6 = /^[0-9a-f:]+:[0-9a-f:]+$/i;
const TEMP_ACCOUNT = /^~/;

export interface FilterResult {
  kept: boolean;
  reason?: string;
}

export function preFilter(data: WikimediaRecentChange): FilterResult {
  if (data.meta?.domain === "canary") return { kept: false, reason: "canary" };
  if (data.type !== "edit" && data.type !== "new") return { kept: false, reason: "type" };
  if (data.namespace !== 0) return { kept: false, reason: "namespace" };
  if (data.bot) return { kept: false, reason: "bot" };
  if (!data.wiki || !data.wiki.endsWith("wiki")) {
    return { kept: false, reason: "not-wikipedia" };
  }
  if (!data.title) return { kept: false, reason: "no-title" };
  return { kept: true };
}

export function safeUserIsAnon(user: string | undefined): boolean {
  if (!user) return true;
  return IP_V4.test(user) || IP_V6.test(user) || TEMP_ACCOUNT.test(user);
}

export function bytesDiff(data: WikimediaRecentChange): number | null {
  const oldLen = data.length?.old ?? null;
  const newLen = data.length?.new ?? null;
  if (oldLen === null || newLen === null) return null;
  return newLen - oldLen;
}

export function buildIndexKey(wiki: string, title: string): string {
  return `${wiki}::${title}`;
}

export function sanitizeComment(comment: string | null | undefined): string | null {
  if (!comment) return null;
  return comment.replace(/\s+/g, " ").trim().slice(0, 500) || null;
}

