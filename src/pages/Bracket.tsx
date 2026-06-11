/**
 * /tableau (spec §12) : tableau final R32 → Finale, placeholders TBD tant que
 * les équipes ne sont pas connues.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import SectionLabel from "../components/SectionLabel";
import MatchChip from "../components/MatchChip";
import { FlagEmoji } from "../components/FlagEmoji";
import { nationStyles, useAtlasData, STAGE_LABELS, type Match } from "../lib/atlas";

const KO_STAGES: Match["stage"][] = ["R32", "R16", "QF", "SF", "THIRD", "FINAL"];
const GROUPS = "ABCDEFGHIJKL".split("");

export default function Bracket() {
  const { data, error } = useAtlasData();
  const styles = useMemo(() => (data ? nationStyles(data.nations) : new Map()), [data]);
  const stakesByMatch = useMemo(() => new Map((data?.stakes ?? []).map((s) => [s.match_id, s])), [data]);

  const byStage = useMemo(() => {
    const map = new Map<Match["stage"], Match[]>();
    for (const stage of KO_STAGES) map.set(stage, []);
    for (const m of data?.matches ?? []) {
      if (m.stage !== "GROUP") map.get(m.stage)?.push(m);
    }
    return map;
  }, [data]);

  // Tant que les affiches réelles sont inconnues : têtes probables par groupe
  // (placeholders probabilistes §12 — sans deviner les appariements, §21.5).
  const koTeamsKnown = useMemo(
    () => (byStage.get("R32") ?? []).some((m) => m.home !== null || m.away !== null),
    [byStage],
  );
  const probableSeeds = useMemo(() => {
    const probs = data?.sim?.probs;
    if (!probs) return [];
    return GROUPS.map((letter) => {
      const ranked = (data?.nations ?? [])
        .filter((n) => n.group_letter === letter)
        .map((n) => ({ nation: n, p: probs[n.code]?.p_win_group ?? 0 }))
        .sort((a, b) => b.p - a.p);
      return { letter, top: ranked[0] ?? null };
    });
  }, [data]);

  return (
    <div className="min-h-screen bg-cream text-navy flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-8 pt-24 pb-24">
        <SectionLabel label="Phase finale · du 28 juin au 19 juillet" />
        <h1 className="font-display text-4xl md:text-6xl uppercase leading-none tracking-wide mt-4 mb-12">
          Le tableau
        </h1>
        {error && <div className="font-mono text-xs text-red-signal uppercase tracking-widest mb-6">{error}</div>}
        {!data && <p className="font-light text-navy/70">Chargement…</p>}

        {data && !koTeamsKnown && (
          <section className="mb-12">
            <p className="font-light text-navy/70 max-w-2xl mb-6">
              Le tableau réel se remplit à la fin de la phase de groupes (27 juin).
              En attendant, les vainqueurs de groupe les plus probables selon la{" "}
              <Link to="/methodo" className="underline hover:text-blue-electric">simulation</Link> :
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-navy/10 border border-navy/10">
              {probableSeeds.map(({ letter, top }) => (
                <div key={letter} className="bg-cream p-4">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-navy/40 mb-1">1{letter}</div>
                  {top ? (
                    <Link to={`/n/${top.nation.code}`} className="hover:text-blue-electric">
                      <span className="font-display text-xl uppercase tracking-wide">
                        <FlagEmoji flag={top.nation.flag} /> {top.nation.name_fr}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-navy/50 ml-2">
                        {Math.round(top.p * 100)} %
                      </span>
                    </Link>
                  ) : (
                    <span className="font-mono text-[10px] text-navy/40">—</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {data &&
          KO_STAGES.map((stage) => {
            const matches = byStage.get(stage) ?? [];
            if (matches.length === 0) return null;
            return (
              <section key={stage} className="mb-12">
                <h2 className="font-display text-2xl md:text-4xl uppercase tracking-wide mb-4">
                  {STAGE_LABELS[stage]}
                  <span className="font-mono text-[10px] uppercase tracking-widest text-navy/40 ml-4 align-middle">
                    {matches.length} match{matches.length > 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-navy/10 border border-navy/10">
                  {matches.map((m) => (
                    <MatchChip key={m.id} match={m} styles={styles} stake={stakesByMatch.get(m.id)} />
                  ))}
                </div>
              </section>
            );
          })}
        {koTeamsKnown && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-navy/40">
            Les affiches suivantes s'affichent dès que les qualifications réelles sont connues.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
