/**
 * /admin (spec §12) — P0 : tableau de bord lecture seule (job_log, état des
 * résolutions, liens outils). Les écritures (overrides) passent par l'API
 * serverless protégée par ADMIN_TOKEN (P0.6) ou, en secours, par SQL direct.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import SectionLabel from "../../components/SectionLabel";
import { atlas } from "../../lib/supabase";
import { useAtlasData } from "../../lib/atlas";

type JobRow = { id: number; job: string; ok: boolean; detail: Record<string, unknown> | null; created_at: string };

export default function AdminHome() {
  const { data } = useAtlasData();
  const [jobs, setJobs] = useState<JobRow[] | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);

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
            <div className="font-display text-5xl">{data?.resolutions.length ?? "—"}</div>
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

        <section>
          <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">Journal du worker</h2>
          {jobsError && <p className="font-mono text-xs text-red-signal uppercase tracking-widest">{jobsError}</p>}
          {!jobs && !jobsError && <p className="font-light text-navy/70">Chargement…</p>}
          {jobs && jobs.length === 0 && (
            <p className="font-light text-navy/70">
              Aucune entrée — le worker n'a pas encore tourné (npm run worker:start).
            </p>
          )}
          {jobs && jobs.length > 0 && (
            <ul className="divide-y divide-navy/10 border-y border-navy/10 font-mono text-xs">
              {jobs.map((j) => (
                <li key={j.id} className="py-2 px-2 flex items-baseline gap-4">
                  <span className={j.ok ? "text-blue-electric" : "text-red-signal"}>{j.ok ? "OK" : "KO"}</span>
                  <span className="uppercase tracking-widest">{j.job}</span>
                  <span className="text-navy/40">
                    {new Date(j.created_at).toLocaleTimeString("fr-FR")}
                  </span>
                  <span className="text-navy/60 truncate flex-1">{j.detail ? JSON.stringify(j.detail) : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-12 font-light text-sm text-navy/60 max-w-2xl leading-relaxed">
          Score manuel (secours) : insérer une ligne dans <span className="font-mono">atlas.match_overrides</span> via
          le SQL editor — elle prime sur l'API et est résolue au tick suivant du worker. Vérification d'intégrité :{" "}
          <span className="font-mono">npm run map:rebuild-check</span>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
