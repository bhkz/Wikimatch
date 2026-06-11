/**
 * Finalisation de la phase de groupes (spec §16.5, §20 P2.11).
 * Module pur : calcule les 32 qualifiés, les 16 éliminés, puis produit les
 * events de Grande Fracture sans écrire en base.
 */

import { computeStandings, rankThirds, type StandingRow } from "./standings";
import { eliminateNation } from "./engine/resolve";
import type { EngineState, GameConfig, HexEventDraft } from "./engine/types";
import type { NationLabel } from "./engine/narrative";

export type GroupStageNation = {
  code: string;
  group: string;
  label: NationLabel;
};

export type GroupStageMatch = {
  group: string;
  home: string;
  away: string;
  scoreHome: number;
  scoreAway: number;
};

export type GroupStanding = StandingRow & { group: string };

export type GroupStageFinalization = {
  qualified: string[];
  eliminated: string[];
  standings: Record<string, GroupStanding[]>;
  thirds: GroupStanding[];
  events: HexEventDraft[];
  nationUpdates: Array<{ code: string; status: "eliminated"; eliminated_by_match: null }>;
  warnings: Array<{ code: string; detail: Record<string, unknown> }>;
};

function fractureNarrative(label: NationLabel): string {
  return `${label.flag} ${label.name} quitte le tournoi : sa capitale devient un memorial.`;
}

export function finalizeGroupStagePlan(
  state: EngineState,
  nations: GroupStageNation[],
  matches: GroupStageMatch[],
  cfg: GameConfig,
): GroupStageFinalization {
  const groups = [...new Set(nations.map((n) => n.group))].sort();
  const standings: Record<string, GroupStanding[]> = {};
  const qualified = new Set<string>();
  const thirds: GroupStanding[] = [];
  const warnings: GroupStageFinalization["warnings"] = [];

  for (const group of groups) {
    const codes = nations.filter((n) => n.group === group).map((n) => n.code).sort();
    const groupMatches = matches.filter((m) => m.group === group);
    if (codes.length !== 4) {
      warnings.push({ code: "group_size_unexpected", detail: { group, count: codes.length } });
    }
    if (groupMatches.length !== 6) {
      warnings.push({ code: "group_matches_unexpected", detail: { group, count: groupMatches.length } });
    }

    const rows = computeStandings(codes, groupMatches).map((row) => ({ ...row, group }));
    standings[group] = rows;
    if (rows.length >= 3) {
      qualified.add(rows[0].code);
      qualified.add(rows[1].code);
      thirds.push(rows[2]);
    }
    if (rows.some((r) => r.unresolvedTie)) {
      warnings.push({ code: "unresolved_tie", detail: { group, teams: rows.filter((r) => r.unresolvedTie).map((r) => r.code) } });
    }
  }

  const rankedThirds = rankThirds(thirds).map((row) => row as GroupStanding);
  for (const row of rankedThirds.slice(0, 8)) qualified.add(row.code);

  const eliminated = nations
    .map((n) => n.code)
    .filter((code) => !qualified.has(code))
    .sort((a, b) => {
      const ga = nations.find((n) => n.code === a)?.group ?? "";
      const gb = nations.find((n) => n.code === b)?.group ?? "";
      return ga.localeCompare(gb) || a.localeCompare(b);
    });

  const labelByCode = new Map(nations.map((n) => [n.code, n.label]));
  const events: HexEventDraft[] = [];
  const nationUpdates: GroupStageFinalization["nationUpdates"] = [];

  for (const code of eliminated) {
    if (state.nationStatus.get(code) === "eliminated") continue;
    const label = labelByCode.get(code) ?? { flag: "", name: code };
    eliminateNation(state, events, code, null, null, cfg, fractureNarrative(label));
    nationUpdates.push({ code, status: "eliminated", eliminated_by_match: null });
  }

  return {
    qualified: [...qualified].sort(),
    eliminated,
    standings,
    thirds: rankedThirds,
    events,
    nationUpdates,
    warnings,
  };
}
