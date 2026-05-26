import { useCallback, useEffect, useState } from "react";
import api, { apiGet } from "../services/api";
import GroupRoundView from "../components/GroupRoundView";
import Header from "../components/Header";

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sept",
  "Oct",
  "Nov",
  "Dic",
];

function formatRoundLabel(round) {
  const start = new Date(round.start_date);
  const end = new Date(round.end_date);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return round.name;
  }

  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const period =
    startYear === endYear
      ? `${startMonth}-${endMonth} ${endYear}`
      : `${startMonth} ${startYear}-${endMonth} ${endYear}`;

  return `${round.name} (${period})`;
}

export default function AdminGroupRounds() {
  const [groups, setGroups] = useState([]);
  const [rounds, setRounds] = useState([]);

  const [groupId, setGroupId] = useState("");
  const [roundId, setRoundId] = useState("");

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  const [data, setData] = useState({
    group: null,
    players: [],
    standings: [],
    fixtures: [],
    matches: [],
  });

  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      setError(null);
      try {
        // Groups: authenticated
        const gs = await apiGet("/groups");

        // Rounds: admin-only (your rounds.py enforces admin)
        const rs = (await api.get("/rounds")).data;

        const normalizedGroups = (gs || []).map((g) => ({
          id: g.id,
          name: g.name,
        }));

        setGroups(normalizedGroups);
        setRounds(rs);

        // Default selections
        if (normalizedGroups.length > 0) setGroupId(String(normalizedGroups[0].id));
        if (rs.length > 0) setRoundId(String(rs[0].id));
      } catch {
        setError("No se pudieron cargar grupos y rondas (¿tienes permisos de admin?).");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const canLoad = Boolean(groupId && roundId);

  const load = useCallback(async () => {
    if (!canLoad) return;

    setLoadingData(true);
    setError(null);

    try {
      const [g, p, st, m, f] = await Promise.all([
        apiGet(`/groups/${groupId}`),

        // ✅ require the new backend endpoints:
        apiGet(`/groups/${groupId}/round/${roundId}/players`),
        apiGet(`/groups/${groupId}/round/${roundId}/table`),
        apiGet(`/groups/${groupId}/round/${roundId}/matches`),
        apiGet(`/groups/${groupId}/round/${roundId}/fixtures`),
      ]);

      setData({
        group: g,
        players: p,
        standings: st,
        matches: m,
        fixtures: f,
      });
    } catch {
      setError("No se pudo cargar la información para ese grupo/ronda.");
    } finally {
      setLoadingData(false);
    }
  }, [canLoad, groupId, roundId]);

  // Auto-load whenever both dropdowns have values (feels nicer)
  useEffect(() => {
    if (!loadingMeta && canLoad) {
      load();
    }
  }, [canLoad, load, loadingMeta]);

  return (
    <div className="flex flex-col flex-1 p-6 min-h-screen bg-gray-50">
      <Header />

      {/* Selector toolbar (admin look) */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        {loadingMeta ? (
          <div className="text-gray-600">Cargando grupos y rondas...</div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Grupo</label>
              <select
                className="border rounded px-3 py-2 min-w-[240px]"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Ronda</label>
              <select
                className="border rounded px-3 py-2 min-w-[240px]"
                value={roundId}
                onChange={(e) => setRoundId(e.target.value)}
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatRoundLabel(r)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={!canLoad || loadingData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingData ? "Cargando..." : "Recargar"}
              </button>

              {loadingData && (
                <span className="text-sm text-gray-600">Actualizando…</span>
              )}
            </div>
          </div>
        )}

        {error && <div className="text-red-600 mt-3">{error}</div>}
      </div>

      {/* Content */}
      {data.group ? (
        <GroupRoundView
          group={data.group}
          players={data.players}
          standings={data.standings}
          fixtures={data.fixtures}
          matches={data.matches}
          showHeader={false}
          onReportMatch={null} // read-only inspector for now
        />
      ) : (
        !loadingMeta && (
          <div className="text-gray-600">
            Selecciona un grupo y una ronda para ver datos.
          </div>
        )
      )}
    </div>
  );
}
