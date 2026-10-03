interface Env {
  KV: KVNamespace;
  ASSETS: Fetcher;
  ADMIN_PASSWORD: string;
}

const KEY = "inventory-edits-v1";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/edits" && request.method === "GET") {
      const edits = (await env.KV.get(KEY, "json")) || {};
      return json({ edits });
    }

    if (url.pathname === "/api/edits" && request.method === "PUT") {
      try {
        const body = await request.json() as { password?: string; edits?: Record<string, unknown> };
        if (!env.ADMIN_PASSWORD) return json({ error: "ADMIN_PASSWORD is not configured." }, 500);
        if (body.password !== env.ADMIN_PASSWORD) return json({ error: "Incorrect admin password." }, 401);
        if (!body.edits || typeof body.edits !== "object") return json({ error: "Invalid edits." }, 400);

        await env.KV.put(KEY, JSON.stringify(body.edits));
        return json({ ok: true });
      } catch {
        return json({ error: "Invalid request." }, 400);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
