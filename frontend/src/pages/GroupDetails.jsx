import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import { apiGet } from "../services/api";
import ReportResultModal from "../components/ReportResultModal";

export default function GroupDetails() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [players, setPlayers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [me, setMe] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  async function load() {
    const [g, p, st, m, f, meResp] = await Promise.all([
      apiGet(`/groups/${id}`),
      apiGet(`/groups/${id}/players`),
      apiGet(`/groups/${id}/table`),
      apiGet(`/groups/${id}/matches`),
      apiGet(`/groups/${id}/fixtures`),
      apiGet("/profile/me").catch(() => null),
    ]);
    setGroup(g);
    setPlayers(p);
    setStandings(st);
    setMatches(m);
    setFixtures(f);
    setMe(meResp);
  }

  useEffect(() => {
    load();
  }, [id]);

  const canReport = (f) =>
    me && (f.player1.id === me.id || f.player2.id === me.id || me.is_admin);

  return (
    <div className="flex flex-col flex-1 p-6">
      <Header />

      <div className="flex items-center gap-3 mb-4">
        <Link to="/groups" className="text-blue-600 hover:underline">
          ← Volver a grupos
        </Link>
        {group && <h1 className="text-2xl font-bold">{group.name}</h1>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Players */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Jugadores</h2>
          <ul className="divide-y divide-gray-100">
            {players.map((p) => (
              <li key={p.id} className="py-2 flex justify-between">
                <span>{p.full_name}</span>
                <span className="text-sm text-gray-600">{p.points} ELO</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Standings */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Clasificación</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Jugador</th>
                  <th className="px-3 py-2 text-center">Partidos</th>
                  <th className="px-3 py-2 text-center">Sets</th>
                  <th className="px-3 py-2 text-center">Juegos</th>
                  <th className="px-3 py-2 text-center">ELO</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.rank}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.player_name}</td>
                    <td className="px-3 py-2 text-center">
                      {r.matches_won}-{r.matches_played - r.matches_won}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.sets_won}-{r.sets_played - r.sets_won}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.games_won}-{r.games_played - r.games_won}
                    </td>
                    <td className="px-3 py-2 text-center">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Fixtures */}
        {fixtures.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2">
            <h2 className="text-lg font-semibold text-blue-600 mb-3">
              Partidos pendientes
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Jugador 1</th>
                    <th className="px-3 py-2 text-left">Jugador 2</th>
                    <th className="px-3 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {fixtures.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{f.player1.full_name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{f.player2.full_name}</td>
                      <td className="px-3 py-2 text-center">
                        {canReport(f) && (
                          <button
                            onClick={() => setSelectedMatch(f)}
                            className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Añadir resultado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-blue-600 mb-3">Resultados</h2>

          {matches.length === 0 ? (
            <p className="text-gray-500">Aún no hay resultados disponibles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Jugador 1</th>
                    <th className="px-3 py-2 text-left">Jugador 2</th>
                    <th className="px-3 py-2">Resultado</th>
                    <th className="px-3 py-2">Ganador</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{m.player1.full_name || "-"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{m.player2.full_name || "-"}</td>
                      <td className="px-3 py-2 text-center">
                        {m.result.outcome === "COMPLETED"
                          ? m.score
                          : m.result.outcome === "WALKOVER"
                          ? "No presentado"
                          : m.result.outcome === "RETIREMENT"
                          ? "Retirada"
                          : m.result.outcome === "ADMIN_DECISION"
                          ? "Decisión administrativa"
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m.winner.full_name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedMatch && (
        <ReportResultModal
          match={selectedMatch}
          me={me}
          onClose={() => setSelectedMatch(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
