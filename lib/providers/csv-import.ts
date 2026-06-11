/**
 * CsvImportProvider — plan C (spec §3.3.3). Format documenté : docs/csv-format.md.
 * Colonnes : provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,
 *            score_home,score_away,duration,pens_home,pens_away
 */

import type { MatchStatus, NormalizedMatch, ResultProvider, Stage } from "./types";

const STAGES: readonly Stage[] = ["GROUP", "R32", "R16", "QF", "SF", "THIRD", "FINAL"];
const STATUSES: readonly MatchStatus[] = [
  "SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "FINISHED", "POSTPONED", "SUSPENDED", "CANCELLED",
];
const DURATIONS = ["REGULAR", "EXTRA_TIME", "PENALTY_SHOOTOUT"] as const;

const EXPECTED_HEADER =
  "provider_id,stage,group,home_fifa,away_fifa,kickoff_utc,status,score_home,score_away,duration,pens_home,pens_away";

function parseIntOrNull(value: string, field: string, line: number): number | null {
  if (value === "" || value === "null") return null;
  const n = Number(value);
  if (!Number.isInteger(n)) throw new Error(`CSV ligne ${line} : ${field}="${value}" n'est pas un entier.`);
  return n;
}

/** Parse pur (testable offline). Échoue fort sur tout champ invalide — jamais deviner. */
export function parseCsv(csv: string): NormalizedMatch[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length === 0) throw new Error("CSV vide.");
  if (lines[0] !== EXPECTED_HEADER) {
    throw new Error(`CSV : en-tête invalide.\nAttendu : ${EXPECTED_HEADER}\nReçu    : ${lines[0]}`);
  }

  return lines.slice(1).map((line, i) => {
    const n = i + 2;
    const cols = line.split(",");
    if (cols.length !== 12) throw new Error(`CSV ligne ${n} : 12 colonnes attendues, ${cols.length} reçues.`);
    const [providerId, stage, group, homeFifa, awayFifa, kickoffUtc, status, scoreHome, scoreAway, duration, pensHome, pensAway] = cols;

    if (!STAGES.includes(stage as Stage)) throw new Error(`CSV ligne ${n} : stage "${stage}" invalide.`);
    if (!STATUSES.includes(status as MatchStatus)) throw new Error(`CSV ligne ${n} : status "${status}" invalide.`);
    if (duration !== "" && duration !== "null" && !DURATIONS.includes(duration as (typeof DURATIONS)[number])) {
      throw new Error(`CSV ligne ${n} : duration "${duration}" invalide.`);
    }
    if (!/^[A-Z]{3}$/.test(homeFifa) || !/^[A-Z]{3}$/.test(awayFifa)) {
      throw new Error(`CSV ligne ${n} : codes FIFA invalides "${homeFifa}"/"${awayFifa}".`);
    }
    if (Number.isNaN(Date.parse(kickoffUtc))) throw new Error(`CSV ligne ${n} : kickoff_utc "${kickoffUtc}" invalide.`);

    return {
      providerId,
      stage: stage as Stage,
      group: group === "" || group === "null" ? null : group,
      homeFifa,
      awayFifa,
      kickoffUtc,
      status: status as MatchStatus,
      scoreHome: parseIntOrNull(scoreHome, "score_home", n),
      scoreAway: parseIntOrNull(scoreAway, "score_away", n),
      duration: duration === "" || duration === "null" ? null : (duration as (typeof DURATIONS)[number]),
      pensHome: parseIntOrNull(pensHome, "pens_home", n),
      pensAway: parseIntOrNull(pensAway, "pens_away", n),
    };
  });
}

export class CsvImportProvider implements ResultProvider {
  readonly name = "csv-import";
  private readonly matches: NormalizedMatch[];

  constructor(csv: string) {
    this.matches = parseCsv(csv);
  }

  async fetchSchedule(): Promise<NormalizedMatch[]> {
    return this.matches;
  }

  async fetchWindow(fromIso: string, toIso: string): Promise<NormalizedMatch[]> {
    return this.matches.filter((m) => m.kickoffUtc >= fromIso && m.kickoffUtc <= toIso);
  }
}
