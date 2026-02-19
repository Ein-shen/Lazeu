import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";

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

  const sendMessage = async (e) => {
    e.preventDefault();

    const question = message.trim();
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

  return (
    <section
      aria-label="Lazeu study assistant"
      className="flex aspect-square w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-lg"
    >
      <div className="bg-emerald-700 px-4 py-3 text-white">
        <h2 className="font-bold">Lazeu AI</h2>
        <p className="text-xs text-emerald-100">Your Study Assistant</p>
      </div>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 p-3 text-left"
        aria-live="polite"
      >
        {messages.map((item, index) => (
          <div
            key={index}
            className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${
              item.role === "user"
                ? "self-end bg-emerald-700 text-white"
                : "self-start border border-gray-200 bg-white text-gray-800"
            }`}
          >
            {item.text}
          </div>
        ))}

        {loading && (
          <p className="self-start text-sm text-gray-500">Thinking...</p>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-gray-200 bg-white p-3"
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a study question..."
          aria-label="Your message"
          maxLength={2000}
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
};

export default StudyChat;