import http from "node:http";

let snapshot: Record<string, unknown> = {
  ok: true,
  service: "wikimatch-worker",
};

export function updateHealthSnapshot(next: Record<string, unknown>): void {
  snapshot = {
    ok: true,
    service: "wikimatch-worker",
    updated_at: new Date().toISOString(),
    ...next,
  };
}

export function startHealthServer(): void {
  const port = process.env.PORT;
  if (!port) return;

  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(snapshot));
      return;
    }

    res.writeHead(200, { "content-type": "text/plain" });
    res.end("WikiMatch worker is running\n");
  });

  server.listen(Number(port), "0.0.0.0", () => {
    console.log(`[health] listening on :${port}`);
  });
}

