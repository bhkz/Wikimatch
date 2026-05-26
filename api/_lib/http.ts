export type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

export type ApiRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

export function setPublicCache(response: ApiResponse, seconds = 60) {
  response.setHeader(
    "Cache-Control",
    `public, max-age=${seconds}, s-maxage=${seconds * 5}, stale-while-revalidate=${seconds * 5}`,
  );
}

export function sendMethodNotAllowed(response: ApiResponse) {
  response.setHeader("Allow", "GET");
  response.status(405).json({
    error: {
      code: "method_not_allowed",
      message: "Only GET is allowed.",
    },
  });
}

export function sendNotFound(response: ApiResponse) {
  response.status(404).json({
    error: {
      code: "not_found",
      message: "Resource not found.",
    },
  });
}

export function sendServerError(response: ApiResponse) {
  response.status(500).json({
    error: {
      code: "server_error",
      message: "Public API unavailable.",
    },
  });
}

export function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
