import { firstQueryValue, sendNotFound } from "../../../_lib/http";
import type { ApiRequest, ApiResponse } from "../../../_lib/http";
import { sendSnapshot } from "../../../_lib/snapshots";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  const slug = firstQueryValue(request.query?.slug);
  if (!slug) {
    sendNotFound(response);
    return;
  }

  await sendSnapshot(request, response, `match:${slug}`, 60);
}
