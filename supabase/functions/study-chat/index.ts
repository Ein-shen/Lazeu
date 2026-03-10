// @ts-nocheck
const MODEL = "gemini-3.8-flash";
const TIMEOUT_MS = 50000;
const MAX_TURNS = 20;

const LAZE_INFO = `
ABOUT LAZEU
Lazeu is a study app where quizzing and hanging out with friends are in one place. It was built by a student as a CS50 final project. You can build quiz decks, quiz yourself, share decks with others, add friends, and chat with them live.

FEATURES
- Accounts: Sign up or log in. After logging in you land on the Dashboard, which shows your decks, friends, and quick access to studying.
- Decks and cards: Create a deck, then add multiple-choice questions. Every question has four options and one correct answer. Lazeu uses multiple choice only.
- Studying: Open a deck and go through it one question at a time. Your score is shown at the end.
- Sharing: Make a deck public so others can study from it, or keep it private. Your profile has Public, Private, and Stats tabs.
- Friends: Send a friend request. It becomes a friendship once the other person accepts it. Requests show up in Notifications.
- Chat: Once you are friends, you can message them. Messages appear instantly.
- Search: Use the search bar at the top to find users and public decks.
- Profile: Shows your photo, name, and username. You can upload a new photo.
- Lazeu AI: This study assistant. It can explain topics, quiz you, and make study plans.
`;

const SYSTEM_PROMPT = `You are Lazeu AI, a friendly study assistant inside the Lazeu app.
Explain things clearly and simply, quiz students when asked, and build study plans.
Keep answers under 150 words.

Use the information below to answer questions about Lazeu.
Only describe features listed there. If you are not sure, say so.
Never invent prices, plans, or features.

${LAZE_INFO}`;

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
          generationConfig: { maxOutputTokens: 800 },
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