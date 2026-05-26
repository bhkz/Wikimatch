import { sendSnapshot } from "../../_lib/snapshots";
import type { ApiRequest, ApiResponse } from "../../_lib/http";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  await sendSnapshot(request, response, "methodology", 600);
}
