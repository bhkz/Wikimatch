type VercelResponse = {
  setHeader: (name: string, value: string) => void;
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

export default function handler(_request: unknown, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    ok: true,
    service: "wikimatch-public-api",
    version: "v1",
  });
}
