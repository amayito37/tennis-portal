import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";

export default function Dashboard() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [p, m] = await Promise.all([
          apiGet("/players/ranking"),
          apiGet("/matches/results"),
        ]);

        // Keep top 3 players and 5 most recent matches
        setPlayers(p.slice(0, 3));
        setMatches(
          m
            .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
            .slice(0, 5)
        );
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Overview</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🏆 Top Players */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">
            Top Players
          </h2>
          {players.length === 0 ? (
            <p className="text-gray-500 text-sm">No players available yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {players.map((p) => (
                <li key={p.id} className="py-2 flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-semibold text-blue-700">
                    {p.points} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🎾 Recent Matches */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">
            Recent Matches
          </h2>
          {matches.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent matches yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className="py-2 flex justify-between text-sm items-center"
                >
                  <span className="text-gray-800">
                    {m.player1?.full_name || "-"} vs{" "}
                    {m.player2?.full_name || "-"}
                  </span>
                  <div className="text-right">
                    <span className="font-medium text-gray-700 block">
                      {m.score || "-"}
                    </span>
                    <span className="text-blue-600 text-xs">
                      Winner: {m.winner?.full_name || "-"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
