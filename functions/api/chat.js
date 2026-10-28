const ALLOWED = new Set(["mistral-small-latest", "ministral-8b-latest", "open-mistral-nemo"]);

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.MISTRAL_API_KEY) {
    return new Response(JSON.stringify({ error: "MISTRAL_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), { status: 400 });
  }

  if (!ALLOWED.has(payload.model)) payload.model = "mistral-small-latest";
  if (!payload.max_tokens || payload.max_tokens > 200) payload.max_tokens = 200;

  const upstream = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
