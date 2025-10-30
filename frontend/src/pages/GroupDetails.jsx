import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import { apiGet } from "../services/api";

export default function GroupDetails() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [table, setTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    async function load() {
      const [g, p, t, m, f] = await Promise.all([
        apiGet(`/groups/${id}`),
        apiGet(`/groups/${id}/players`),
        apiGet(`/groups/${id}/table`),
        apiGet(`/groups/${id}/matches`),
        apiGet(`/groups/${id}/fixtures`),
      ]);
      setGroup(g);
      setPlayers(p);
      setTable(t);
      setMatches(m);
      setFixtures(f);
    }
    load();
  }, [id]);

  return (
    <div className="flex flex-col flex-1 p-6">
      <Header />
      <div className="flex items-center gap-3 mb-4">
        <Link to="/groups" className="text-blue-600 hover:underline">← Back to groups</Link>
        {group && <h1 className="text-2xl font-bold">{group.name}</h1>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Players</h2>
          <ul className="divide-y divide-gray-100">
            {players.map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{p.full_name}</span>
                <span className="text-sm text-gray-600">{p.points} ELO</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Group table */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Standings (W/L)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Player</th>
                  <th className="px-3 py-2">W</th>
                  <th className="px-3 py-2">L</th>
                  <th className="px-3 py-2">P</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.player_id} className="border-t">
                    <td className="px-3 py-2">{r.rank}</td>
                    <td className="px-3 py-2">{r.player_name}</td>
                    <td className="px-3 py-2 text-center">{r.wins}</td>
                    <td className="px-3 py-2 text-center">{r.losses}</td>
                    <td className="px-3 py-2 text-center">{r.played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Fixtures */}
        {fixtures.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2">
            <h2 className="text-lg font-semibold text-blue-600 mb-3">Upcoming Fixtures</h2>
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                <tr>
                    <th className="px-3 py-2 text-left">Player 1</th>
                    <th className="px-3 py-2 text-left">Player 2</th>
                    <th className="px-3 py-2 text-left">Date</th>
                </tr>
                </thead>
                <tbody>
                {fixtures.map((f) => (
                    <tr key={f.id} className="border-t">
                    <td className="px-3 py-2">{f.player1_name}</td>
                    <td className="px-3 py-2">{f.player2_name}</td>
                    <td className="px-3 py-2 text-gray-500">
                        {f.scheduled_date ? new Date(f.scheduled_date).toLocaleDateString() : "-"}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        )}

        {/* Matches */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Recent Matches</h2>
          {matches.length === 0 ? (
            <p className="text-gray-500">No matches yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Player 1</th>
                    <th className="px-3 py-2 text-left">Player 2</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Winner</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">{m.player1_name || "-"}</td>
                      <td className="px-3 py-2">{m.player2_name || "-"}</td>
                      <td className="px-3 py-2 text-center">{m.score || "-"}</td>
                      <td className="px-3 py-2 text-center">{m.winner_name || "-"}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {m.date ? new Date(m.date).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
