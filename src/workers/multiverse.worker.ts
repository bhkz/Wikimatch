/**
 * Web Worker du Multivers (vision P2.A) : la même simulation Monte-Carlo que
 * le worker Render, mais dans le navigateur — les "et si" ne coûtent rien au
 * serveur et répondent en ~100 ms. Déterministe : seed dérivée du scénario.
 */

import { simulateGroupStage, type ForcedOutcome, type SimMatch, type SimNation, type SimResult } from "../../lib/sim/simulate";

export type MultiverseRequest = {
  requestId: number;
  nations: SimNation[];
  matches: SimMatch[];
  iterations: number;
  forced: ForcedOutcome[];
};

export type MultiverseResponse = {
  requestId: number;
  result: SimResult;
};

self.onmessage = (event: MessageEvent<MultiverseRequest>) => {
  const { requestId, nations, matches, iterations, forced } = event.data;
  const scenarioKey = forced
    .map((f) => `${f.matchId}:${f.outcome[0]}`)
    .sort()
    .join(",");
  const seed = `multiverse:${scenarioKey || "baseline"}`;
  const result = simulateGroupStage(nations, matches, iterations, seed, undefined, forced);
  const response: MultiverseResponse = { requestId, result };
  self.postMessage(response);
};
