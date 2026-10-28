function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stripFences(s) {
  return String(s || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.AI) {
    return json({ error: "AI binding not configured. Add an AI binding named 'AI' to this project." }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  const model = "@cf/meta/llama-3.1-8b-instruct";
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const max_tokens = Math.min(payload.max_tokens || 200, 300);
  const temperature = typeof payload.temperature === "number" ? payload.temperature : 0.9;

  try {
    const ai = await env.AI.run(model, { messages, max_tokens, temperature });
    const content = stripFences(ai.response);
    return json({ choices: [{ message: { content } }] });
  } catch (e) {
    return json({ error: "Workers AI call failed", detail: String(e) }, 500);
  }
}
