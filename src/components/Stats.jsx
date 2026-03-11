 
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const Stats = () => {
  const [stats, setStats] = useState({
    total: 0,
    publicDecks: 0,
    privateDecks: 0,
    friends: 0,
    pending: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: decks, error: deckError } = await supabase
          .from("decks")
          .select("id, is_public")
          .eq("user_id", user.id);

        if (deckError) throw deckError;

        const { data: links, error: friendError } = await supabase
          .from("friends")
          .select("requester_id, receiver_id, status")
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

        if (friendError) throw friendError;

        const publicDecks = decks.filter((d) => d.is_public).length;

        setStats({
          total: decks.length,
          publicDecks,
          privateDecks: decks.length - publicDecks,
          friends: links.filter((l) => l.status === "accepted").length,
          pending: links.filter(
            (l) => l.status === "pending" && l.receiver_id === user.id
          ).length,
        });
      } catch (err) {
        console.error("Stats error:", err);
        setError("Couldn't load your stats.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = [
    { label: "Total decks", value: stats.total },
    { label: "Public decks", value: stats.publicDecks },
    { label: "Private decks", value: stats.privateDecks },
    { label: "Friends", value: stats.friends },
  ];

  return (
    <div className="w-full rounded-3xl border border-white/40 bg-div-theme p-4 text-dark-theme shadow-[0_8px_30px_rgba(58,68,81,0.10)] sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-bold sm:text-xl">
          Your Progress
        </h2>
        <p className="mt-1 text-sm opacity-70">
          Keep track of your decks and friends
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="card-theme card-hover-theme flex min-w-0 flex-col justify-center rounded-2xl border border-white/30 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5"
          >
            <p className="text-xs font-medium opacity-75 sm:text-sm">
              {card.label}
            </p>

            <p className="mt-2 text-2xl font-bold sm:text-3xl">
              {loading ? "…" : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 rounded-xl bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

     
    </div>
  );
};

export default Stats;
 