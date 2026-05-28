import { useEffect, useMemo, useState } from "react";
import {
  PauseCircle,
  Pencil,
  PlayCircle,
  RotateCcw,
  Save,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import api, { apiGet } from "../services/api";
import Header from "../components/Header";

const STATUS_LABELS = {
  DEACTIVATE_NEXT_ROUND: "Sale próxima ronda",
  REACTIVATE_NEXT_ROUND: "Entra próxima ronda",
};

function statusText(player) {
  return player.is_active ? "Activo" : "Inactivo";
}

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [newPlayer, setNewPlayer] = useState({
    full_name: "",
    email: "",
    password: "",
    group_id: "",
    join_timing: "NOW",
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [playersResp, groupsResp] = await Promise.all([
        api.get("/admin/players"),
        apiGet("/groups"),
      ]);
      setPlayers(playersResp.data || []);
      setGroups((groupsResp || []).map((g) => ({ id: g.id, name: g.name })));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los jugadores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return players.filter((player) => {
      const matchesSearch =
        !term ||
        player.full_name?.toLowerCase().includes(term) ||
        player.email?.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && player.is_active) ||
        (statusFilter === "INACTIVE" && !player.is_active) ||
        player.pending_status === statusFilter;
      const matchesGroup =
        groupFilter === "ALL" || String(player.group_id) === groupFilter;

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [groupFilter, players, search, statusFilter]);

  function startEdit(player) {
    setEditingId(player.id);
    setEditDraft({
      full_name: player.full_name || "",
      email: player.email || "",
      points: player.points,
      group_id: player.group_id || "",
    });
  }

  async function saveEdit(playerId) {
    setSaving(true);
    try {
      await api.patch(`/admin/players/${playerId}`, {
        ...editDraft,
        points: Number(editDraft.points),
        group_id: Number(editDraft.group_id),
      });
      setEditingId(null);
      await load();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function createPlayer() {
    if (
      !newPlayer.full_name ||
      !newPlayer.email ||
      !newPlayer.password ||
      !newPlayer.group_id
    ) {
      alert("Completa todos los campos.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/admin/players", {
        ...newPlayer,
        group_id: Number(newPlayer.group_id),
      });
      setNewPlayer({
        full_name: "",
        email: "",
        password: "",
        group_id: "",
        join_timing: "NOW",
      });
      await load();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function runAction(playerId, action) {
    setSaving(true);
    try {
      await api.post(`/admin/players/${playerId}/${action}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 p-6 min-h-screen bg-gray-50">
      <Header />

      <div className="flex flex-col gap-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Jugadores</h1>
          {saving && <span className="text-sm text-gray-500">Guardando...</span>}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="Nombre"
              value={newPlayer.full_name}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, full_name: e.target.value })
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Usuario"
              value={newPlayer.email}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, email: e.target.value })
              }
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Contraseña temporal"
              type="password"
              value={newPlayer.password}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, password: e.target.value })
              }
            />
            <select
              className="border rounded px-3 py-2"
              value={newPlayer.group_id}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, group_id: e.target.value })
              }
            >
              <option value="">Grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-3 py-2"
              value={newPlayer.join_timing}
              onChange={(e) =>
                setNewPlayer({ ...newPlayer, join_timing: e.target.value })
              }
            >
              <option value="NOW">Entra ahora</option>
              <option value="NEXT_ROUND">Próxima ronda</option>
            </select>
            <button
              onClick={createPlayer}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <UserPlus size={17} />
              Crear
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="border rounded pl-9 pr-3 py-2 w-full"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
              <option value="DEACTIVATE_NEXT_ROUND">Salen próxima ronda</option>
              <option value="REACTIVATE_NEXT_ROUND">Entran próxima ronda</option>
            </select>
            <select
              className="border rounded px-3 py-2"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="ALL">Todos los grupos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Recargar
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
            <tr>
              <th className="px-4 py-3">Jugador</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Grupo</th>
              <th className="px-4 py-3">Puntos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Pendiente</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan="7" className="px-4 py-5 text-gray-500 text-center">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && filteredPlayers.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-5 text-gray-500 text-center">
                  No hay jugadores.
                </td>
              </tr>
            )}

            {!loading &&
              filteredPlayers.map((player) => {
                const editing = editingId === player.id;
                return (
                  <tr key={player.id} className="border-t hover:bg-blue-50">
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          className="border rounded px-2 py-1 w-48"
                          value={editDraft.full_name}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              full_name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="font-medium text-gray-800">
                          {player.full_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          className="border rounded px-2 py-1 w-56"
                          value={editDraft.email}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, email: e.target.value })
                          }
                        />
                      ) : (
                        <span className="text-gray-700">{player.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <select
                          className="border rounded px-2 py-1"
                          value={editDraft.group_id}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              group_id: e.target.value,
                            })
                          }
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{player.group_name || "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {editing ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={editDraft.points}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, points: e.target.value })
                          }
                        />
                      ) : (
                        <span className="font-semibold text-blue-700">
                          {player.points}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          player.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {statusText(player)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {STATUS_LABELS[player.pending_status] || "-"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        {editing ? (
                          <>
                            <button
                              title="Guardar"
                              onClick={() => saveEdit(player.id)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-sm disabled:opacity-50"
                            >
                              <Save size={15} />
                              Guardar
                            </button>
                            <button
                              title="Cancelar"
                              onClick={() => setEditingId(null)}
                              className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
                            >
                              <X size={15} />
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(player)}
                            className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
                          >
                            <Pencil size={15} />
                            Editar
                          </button>
                        )}

                        {player.is_active ? (
                          <>
                            <button
                              onClick={() =>
                                runAction(player.id, "deactivate-now")
                              }
                              disabled={saving}
                              className="inline-flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-sm disabled:opacity-50"
                            >
                              <PauseCircle size={15} />
                              Desactivar
                            </button>
                            <button
                              onClick={() =>
                                runAction(
                                  player.id,
                                  player.pending_status ===
                                    "DEACTIVATE_NEXT_ROUND"
                                    ? "clear-pending"
                                    : "deactivate-next-round"
                                )
                              }
                              disabled={saving}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm disabled:opacity-50 ${
                                player.pending_status ===
                                "DEACTIVATE_NEXT_ROUND"
                                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  : "bg-orange-100 hover:bg-orange-200 text-orange-700"
                              }`}
                            >
                              {player.pending_status ===
                              "DEACTIVATE_NEXT_ROUND" ? (
                                <X size={15} />
                              ) : (
                                <PauseCircle size={15} />
                              )}
                              {player.pending_status ===
                              "DEACTIVATE_NEXT_ROUND"
                                ? "Cancelar próxima"
                                : "Próxima ronda"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                runAction(player.id, "reactivate-now")
                              }
                              disabled={saving}
                              className="inline-flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-sm disabled:opacity-50"
                            >
                              <PlayCircle size={15} />
                              Reactivar
                            </button>
                            <button
                              onClick={() =>
                                runAction(
                                  player.id,
                                  player.pending_status ===
                                    "REACTIVATE_NEXT_ROUND"
                                    ? "clear-pending"
                                    : "reactivate-next-round"
                                )
                              }
                              disabled={saving}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm disabled:opacity-50 ${
                                player.pending_status ===
                                "REACTIVATE_NEXT_ROUND"
                                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                              }`}
                            >
                              {player.pending_status ===
                              "REACTIVATE_NEXT_ROUND" ? (
                                <X size={15} />
                              ) : (
                                <PlayCircle size={15} />
                              )}
                              {player.pending_status ===
                              "REACTIVATE_NEXT_ROUND"
                                ? "Cancelar próxima"
                                : "Próxima ronda"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
