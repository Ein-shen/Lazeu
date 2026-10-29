// @ts-nocheck
const MODEL = "gemini-3.8-flash";
const TIMEOUT_MS = 50000;
const MAX_TURNS = 20;

const SYSTEM_PROMPT =
  "You are Lazeu AI, a friendly study assistant. Explain things clearly and simply, " +
  "quiz the student when asked, and build practical study plans. Keep answers concise.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: corsHeaders });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Use POST to send a chat message." }, 405);
  }

  const apiKey = Deno.env.get("LAZE_API_KEY")?.trim();
  if (!apiKey) {
    return json({ error: "LAZE_API_KEY is missing from Supabase secrets." }, 500);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  let contents = (body?.messages || [])
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || m.text || "").slice(0, 4000) }],
    }))
    .filter((c) => c.parts[0].text.trim());

  // Gemini expects the conversation to start with a user turn
  while (contents.length && contents[0].role === "model") contents.shift();
  contents = contents.slice(-MAX_TURNS);
  while (contents.length && contents[0].role === "model") contents.shift();

  if (!contents.length) {
    return json({ error: "Please send at least one message." }, 400);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log("Calling Gemini:", MODEL, "turns:", contents.length);
    const t0 = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
        }),
      }
    );

    const raw = await response.text();
    console.log("Gemini status:", response.status, "in", Date.now() - t0, "ms");
    console.log("Gemini body:", raw.slice(0, 500));

    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {}

    if (!response.ok) {
      return json(
        { error: data?.error?.message ?? `Gemini returned HTTP ${response.status}.` },
        502
      );
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ||
      (data?.promptFeedback?.blockReason
        ? "That request was blocked by Gemini's safety filters. Try rephrasing."
        : "No response generated.");

    return json({ reply });
  } catch (error) {
    console.error("Fetch catch error:", error);
    const timedOut = error?.name === "AbortError";
    return json(
      {
        error: timedOut
          ? "Gemini took too long to respond. Please try again."
          : error?.message || "Could not reach Gemini.",
      },
      timedOut ? 504 : 502
    );
  } finally {
    clearTimeout(timer);
  }
});