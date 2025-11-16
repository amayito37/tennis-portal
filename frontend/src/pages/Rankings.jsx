import { useState, useEffect } from "react";
import Header from "../components/Header";
import RankingsTable from "../components/RankingsTable";
import { fetchRanking } from "../util/api"; // <-- Make sure this exists (from the earlier step)

export default function Rankings() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadRanking() {
      try {
        const data = await fetchRanking();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching ranking:", err);
        setError("Error obteniendo el ranking.");
      } finally {
        setLoading(false);
      }
    }
    loadRanking();
  }, []);

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 p-10 overflow-auto">
      <Header />
      <h1 className="text-2xl font-bold mb-4">Ranking</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar jugadores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 w-full max-w-md outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {loading && <p className="text-gray-500">Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <RankingsTable players={filteredPlayers} />}
    </div>
  );
}
