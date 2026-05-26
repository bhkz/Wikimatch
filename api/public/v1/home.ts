import { sendSnapshot } from "../../_lib/snapshots.js";
import type { ApiRequest, ApiResponse } from "../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  await sendSnapshot(request, response, "home", 60);
}
