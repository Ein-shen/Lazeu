import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

const SUGGESTIONS = [
  "Quiz me on a topic",
  "Explain something simply",
  "Make a study plan",
];

const StudyChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your Lazeu Study Assistant. What would you like help studying today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // keep the newest message in view
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const question = text.trim();
    if (!question || loading) return;

    setMessages((previous) => [...previous, { role: "user", text: question }]);
    setMessage("");
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) throw new Error("Please sign in to use the study assistant.");

      const { data, error } = await supabase.functions.invoke("study-chat", {
        body: { message: question },
      });

      if (error) throw error;
      if (!data?.reply) {
        throw new Error(data?.error || "No response received.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", text: data.reply },
      ]);
    } catch (error) {
      console.error("Study chatbot error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: error.message || "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(message);
  };

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <section
      aria-label="Lazeu study assistant"
      className="flex aspect-square w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/50 text-dark-theme shadow-[0_10px_40px_rgba(58,68,81,0.12)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4">
        <span className="nav-theme flex h-9 w-9 items-center justify-center rounded-full text-base text-white">
          ✦
        </span>
        <div className="leading-tight">
          <h2 className="font-semibold">Lazeu AI</h2>
          <p className="text-xs opacity-60">Your study assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 text-left"
        aria-live="polite"
      >
        {messages.map((item, index) => (
          <div
            key={index}
            className={`max-w-[85%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed ${
              item.role === "user"
                ? "nav-theme text-light-theme self-end rounded-2xl rounded-br-md"
                : "self-start rounded-2xl rounded-bl-md bg-white/80 text-dark-theme"
            }`}
          >
            {item.text}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-white/80 px-4 py-3">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
          </div>
        )}

        {showSuggestions && (
          <div className="mt-1 flex flex-wrap gap-2">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => send(text)}
                className="card-hover-theme rounded-full border border-black/10 bg-white/60 px-3 py-1.5 text-xs transition"
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/80 py-1.5 pl-5 pr-1.5 focus-within:border-black/40">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a study question..."
            aria-label="Your message"
            maxLength={2000}
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent text-sm text-dark-theme outline-none placeholder:text-gray-400"
          />

          <button
            type="submit"
            disabled={loading || !message.trim()}
            aria-label="Send message"
            className="nav-theme flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>
    </section>
  );
};

export default StudyChat;