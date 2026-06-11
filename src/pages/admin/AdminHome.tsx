/**
 * /admin (spec §12) : tableau de bord + actions service-role protégées par
 * ADMIN_TOKEN. Aucun compte utilisateur, aucun write côté client Supabase.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SectionLabel from "../../components/SectionLabel";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { useAtlasData } from "../../lib/atlas";
import { atlas } from "../../lib/supabase";

type JobRow = { id: number; job: string; ok: boolean; detail: Record<string, unknown> | null; created_at: string };

type OverrideForm = {
  match_id: string;
  score_home: string;
  score_away: string;
  duration: string;
  pens_home: string;
  pens_away: string;
  note: string;
};

async function postAdmin(path: string, token: string, body: Record<string, unknown> = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.error?.message === "string" ? payload.error.message : "Action admin refusée";
    throw new Error(message);
  }
  return payload;
}

export default function AdminHome() {
  const { data } = useAtlasData();
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("atlas_admin_token") ?? "");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [override, setOverride] = useState<OverrideForm>({
    match_id: "",
    score_home: "",
    score_away: "",
    duration: "REGULAR",
    pens_home: "",
    pens_away: "",
    note: "",
  });

  useEffect(() => {
    if (adminToken) localStorage.setItem("atlas_admin_token", adminToken);
    else localStorage.removeItem("atlas_admin_token");
  }, [adminToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: rows, error } = await atlas
        .from("job_log")
        .select("id, job, ok, detail, created_at")
        .order("id", { ascending: false })
        .limit(30);
      if (cancelled) return;
      if (error) setJobsError(error.message);
      else setJobs(rows as JobRow[]);
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const finished = data?.matches.filter((m) => m.status === "FINISHED") ?? [];
  const resolvedIds = new Set(data?.resolutions.map((r) => r.match_id) ?? []);
  const pending = finished.filter((m) => !resolvedIds.has(m.id));

  async function runAction(label: string, action: () => Promise<unknown>) {
    setActionStatus(`${label}...`);
    try {
      const payload = await action();
      setActionStatus(`${label} OK\n${JSON.stringify(payload, null, 2)}`);
    } catch (err) {
      setActionStatus(`${label} KO\n${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function updateOverride(patch: Partial<OverrideForm>) {
    setOverride((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Admin · Tableau de bord" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-10">
          État du moteur
        </h1>

        <div className="grid md:grid-cols-3 gap-px bg-navy/10 border border-navy/10 mb-12 max-w-3xl">
          <div className="bg-cream p-6">
            <div className="font-display text-5xl">{finished.length}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mt-1">Matchs terminés</div>
          </div>
          <div className="bg-cream p-6">
            <div className="font-display text-5xl">{data?.resolutions.length ?? "n/d"}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mt-1">Résolutions appliquées</div>
          </div>
          <div className={`p-6 ${pending.length > 0 ? "bg-red-signal/10" : "bg-cream"}`}>
            <div className="font-display text-5xl">{pending.length}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-navy/50 mt-1">
              En attente de résolution
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-12 font-mono text-xs uppercase tracking-widest">
          <Link to="/admin/map-preview" className="border border-navy px-4 py-2 hover:bg-navy hover:text-cream transition-colors">
            Audit de la carte →
          </Link>
        </div>

        <section className="mb-12 max-w-5xl">
          <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Actions admin</h2>
          <div className="border border-navy/10 p-5 mb-6">
            <label className="block font-mono text-[10px] uppercase tracking-widest text-navy/50 mb-2">
              ADMIN_TOKEN
            </label>
            <input
              type="password"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
              className="w-full border border-navy/20 bg-cream px-3 py-2 font-mono text-xs outline-none focus:border-blue-electric"
              placeholder="Token admin"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-px bg-navy/10 border border-navy/10">
            <form
              className="bg-cream p-5"
              onSubmit={(e) => {
                e.preventDefault();
                runAction("Override match", () =>
                  postAdmin("/api/admin/match-overrides", adminToken, {
                    match_id: Number(override.match_id),
                    score_home: Number(override.score_home),
                    score_away: Number(override.score_away),
                    duration: override.duration,
                    pens_home: override.pens_home === "" ? null : Number(override.pens_home),
                    pens_away: override.pens_away === "" ? null : Number(override.pens_away),
                    note: override.note,
                  }),
                );
              }}
            >
              <h3 className="font-display text-2xl uppercase tracking-wide mb-4">Score manuel</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <input className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs" placeholder="match id" value={override.match_id} onChange={(e) => updateOverride({ match_id: e.target.value })} />
                <input className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs" placeholder="home" value={override.score_home} onChange={(e) => updateOverride({ score_home: e.target.value })} />
                <input className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs" placeholder="away" value={override.score_away} onChange={(e) => updateOverride({ score_away: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <select className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs" value={override.duration} onChange={(e) => updateOverride({ duration: e.target.value })}>
                  <option value="REGULAR">REGULAR</option>
                  <option value="EXTRA_TIME">EXTRA_TIME</option>
                  <option value="PENALTY_SHOOTOUT">PENALTY_SHOOTOUT</option>
                </select>
                <input className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs" placeholder="pens home" value={override.pens_home} onChange={(e) => updateOverride({ pens_home: e.target.value })} />
                <input className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs" placeholder="pens away" value={override.pens_away} onChange={(e) => updateOverride({ pens_away: e.target.value })} />
              </div>
              <input className="border border-navy/20 bg-cream px-3 py-2 font-mono text-xs w-full mb-4" placeholder="note" value={override.note} onChange={(e) => updateOverride({ note: e.target.value })} />
              <button className="border border-navy px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-navy hover:text-cream transition-colors">
                Enregistrer override
              </button>
            </form>

            <div className="bg-cream p-5">
              <h3 className="font-display text-2xl uppercase tracking-wide mb-4">Jobs</h3>
              <div className="flex flex-wrap gap-3">
                <button className="border border-navy px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-navy hover:text-cream transition-colors" onClick={() => runAction("Résolution forcée", () => postAdmin("/api/admin/resolve", adminToken))}>
                  Forcer resolve
                </button>
                <button className="border border-navy px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-navy hover:text-cream transition-colors" onClick={() => runAction("Simulation forcée", () => postAdmin("/api/admin/simulate", adminToken))}>
                  Re-run simulation
                </button>
                <button className="border border-navy px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-navy hover:text-cream transition-colors" onClick={() => runAction("Dry-run fracture", () => postAdmin("/api/admin/finalize-group-stage", adminToken, { dry_run: true }))}>
                  Dry-run groupes
                </button>
                <button className="border border-red-signal px-4 py-2 font-mono text-xs uppercase tracking-widest text-red-signal hover:bg-red-signal hover:text-cream transition-colors" onClick={() => runAction("Grande Fracture", () => postAdmin("/api/admin/finalize-group-stage", adminToken, { dry_run: false }))}>
                  Appliquer groupes
                </button>
              </div>
            </div>
          </div>
          {actionStatus && (
            <pre className="mt-4 whitespace-pre-wrap border border-navy/10 bg-cream-dark p-4 font-mono text-[10px] uppercase tracking-widest text-navy/70">
              {actionStatus}
            </pre>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Journal du worker</h2>
          {jobsError && <p className="font-mono text-xs text-red-signal uppercase tracking-widest">{jobsError}</p>}
          {!jobs && !jobsError && <p className="font-light text-navy/70">Chargement...</p>}
          {jobs && jobs.length === 0 && (
            <p className="font-light text-navy/70">
              Aucune entrée : le worker n'a pas encore tourné (`npm run worker:start`).
            </p>
          )}
          {jobs && jobs.length > 0 && (
            <ul className="divide-y divide-navy/10 border-y border-navy/10 font-mono text-xs">
              {jobs.map((j) => (
                <li key={j.id} className="py-2 px-2 flex items-baseline gap-4">
                  <span className={j.ok ? "text-blue-electric" : "text-red-signal"}>{j.ok ? "OK" : "KO"}</span>
                  <span className="uppercase tracking-widest">{j.job}</span>
                  <span className="text-navy/40">{new Date(j.created_at).toLocaleTimeString("fr-FR")}</span>
                  <span className="text-navy/60 truncate flex-1">{j.detail ? JSON.stringify(j.detail) : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-12 font-light text-sm text-navy/60 max-w-2xl leading-relaxed">
          Vérification d'intégrité : <span className="font-mono">npm run map:rebuild-check</span>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
