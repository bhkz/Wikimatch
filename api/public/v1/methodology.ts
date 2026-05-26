import { createServerSupabaseClient } from "../../_lib/supabase.js";
import { setPublicCache, sendNotFound, sendServerError, type ApiRequest, type ApiResponse } from "../../_lib/http.js";

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
) {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("methodology_versions")
      .select("content_payload")
      .eq("publication_status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      sendNotFound(response);
      return;
    }

    setPublicCache(response, 600);
    response.status(200).json(data.content_payload);
  } catch (error) {
    console.error("Methodology API failed:", error);
    sendServerError(response);
  }
}
