import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";

export default function Dashboard() {
  const [round, setRound] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [me, setMe] = useState(null);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [meResp, groupsResp, roundResp, rankingResp, matchesResp] =
          await Promise.all([
            apiGet("/profile/me").catch(() => null),
            apiGet("/groups"),
            apiGet("/rounds/current").catch(() => null),
            apiGet("/players/ranking"),
            apiGet("/matches/results"),
          ]);

        setMe(meResp);
        setGroups(groupsResp || []);
        setRound(roundResp || null);

        // Top 3 ranking
        setPlayers((rankingResp || []).slice(0, 3));

        // 5 most recent matches
        setMatches(
          (matchesResp || [])
            .sort(
              (a, b) =>
                new Date(b.scheduled_date) - new Date(a.scheduled_date)
            )
            .slice(0, 5)
        );
      } catch (err) {
        console.error(err);
        setError("Error cargando datos.");
      }
    }

    load();
  }, []);

  const myGroupId = me?.group_id;
  const myGroup = groups.find((g) => g.id === myGroupId);

  return (
    <div className="flex flex-col flex-1 p-6 bg-gray-50 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-6">General</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🕒 Current Round */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">Ronda actual</h2>

          {!round ? (
            <p className="text-gray-500 text-sm">No hay ronda activa.</p>
          ) : (
            <div className="text-sm text-gray-700">
              <p><strong>Ronda:</strong> {round.name}</p>
              <p>
                <strong>Fechas:</strong>{" "}
                {new Date(round.start_date).toLocaleDateString()} –{" "}
                {new Date(round.end_date).toLocaleDateString()}
              </p>
              <p><strong>Estado:</strong> {round.status === "ACTIVE" 
                        ? "Activa" 
                        : round.status === "CLOSED"
                        ? "Cerrada"
                        : round.status === "FINALIZED"
                        ? "Finalizada"
                        : "Borrador" 
                    } </p>
            </div>
          )}
        </div>

        {/* 🏆 Top players */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">Mejores jugadores</h2>
          {players.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay jugadores.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {players.map((p) => (
                <li key={p.id} className="py-2 flex justify-between">
                  <span>{p.name}</span>
                  <span className="font-semibold text-blue-700">{p.points} pts</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 👥 My group preview (only for non-admins) */}
        {!me?.is_admin && myGroup && (
          <div className="bg-white rounded-lg shadow-sm p-4 md:col-span-2">
            <h2 className="text-lg font-semibold mb-3 text-blue-600">
              Tu grupo: {myGroup.name}
            </h2>

            {myGroup.members.length === 0 ? (
              <p className="text-gray-500 text-sm">El grupo está vacío.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {myGroup.members.map((m) => (
                  <li key={m.id} className="py-2 flex justify-between text-sm">
                    <span>{m.full_name}</span>
                    <span className="font-medium text-gray-700">{m.points} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 🎾 Recent matches */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">Partidos recientes</h2>

          {matches.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay partidos.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {matches.map((m) => (
                <li key={m.id} className="py-2 flex justify-between text-sm items-center">
                  <span>{m.player1?.full_name} vs {m.player2?.full_name}</span>
                  <div className="text-right">
                    <span className="font-medium">{m.score || "-"}</span>
                    <span className="text-blue-600 text-xs block">
                      Ganador: {m.winner?.full_name || "-"}
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
