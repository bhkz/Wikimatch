import {
  sendMethodNotAllowed,
  sendNotFound,
  sendServerError,
  setPublicCache,
  type ApiRequest,
  type ApiResponse,
} from "./http";
import { readPublishedSnapshot } from "./supabase";

export async function sendSnapshot(
  request: ApiRequest,
  response: ApiResponse,
  pageKey: string,
  cacheSeconds = 60,
) {
  if (request.method && request.method !== "GET") {
    sendMethodNotAllowed(response);
    return;
  }

  try {
    const payload = await readPublishedSnapshot(pageKey);
    if (!payload) {
      sendNotFound(response);
      return;
    }

    setPublicCache(response, cacheSeconds);
    response.status(200).json(payload);
  } catch (error) {
    console.error("public snapshot read failed", {
      pageKey,
      message: error instanceof Error ? error.message : String(error),
    });
    sendServerError(response);
  }
}
