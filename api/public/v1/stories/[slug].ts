import { createServerSupabaseClient } from "../../../_lib/supabase.js";
import { firstQueryValue, sendNotFound, sendServerError, setPublicCache, type ApiRequest, type ApiResponse } from "../../../_lib/http.js";
import { storyTypeLabel } from "../../../_lib/labels.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  const slug = firstQueryValue(request.query?.slug);
  if (!slug) {
    sendNotFound(response);
    return;
  }

  try {
    // Strictly disabled for now
    sendNotFound(response);
    return;
  } catch (error) {
    console.error("Story Detail API failed:", error);
    sendServerError(response);
  }
}
