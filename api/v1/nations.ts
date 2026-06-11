import type { VercelRequest, VercelResponse } from "@vercel/node";
import { acceptGet, atlasClient, sendJson } from "../_lib/atlas-api";
import { sendServerError } from "../_lib/http";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!acceptGet(req, res)) return;

  try {
    const atlas = atlasClient();
    const [{ data: nations, error: nErr }, { data: hexes, error: hErr }, { data: sim, error: sErr }] =
      await Promise.all([
        atlas.from("nations").select("code, name_fr, flag, color, fifa_rank, fifa_points, group_letter, status, eliminated_at, eliminated_by_match").order("code"),
        atlas.from("hexes").select("owner, state").eq("state", "owned").limit(2000),
        atlas.from("sim_runs").select("id, run_at, iterations, probs").order("id", { ascending: false }).limit(1).maybeSingle(),
      ]);
    if (nErr) throw nErr;
    if (hErr) throw hErr;
    if (sErr) throw sErr;

    const territory = new Map<string, number>();
    for (const h of hexes ?? []) {
      if (h.owner) territory.set(h.owner as string, (territory.get(h.owner as string) ?? 0) + 1);
    }
    const probs = (sim?.probs ?? {}) as Record<string, unknown>;
    sendJson(
      res,
      {
        sim,
        nations: (nations ?? []).map((n) => ({
          ...n,
          territory: territory.get(n.code as string) ?? 0,
          probs: probs[n.code as string] ?? null,
        })),
      },
      60,
    );
  } catch {
    sendServerError(res);
  }
}
