import { useEffect, useState } from "react";
import api from "../services/api";
import ReportResultModal from "./ReportResultModal";

export default function ReviewUnplayedModal({ roundId, onClose }) {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [roundId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/rounds/${roundId}/unplayed`);
      const list = res?.data ?? res;
      setMatches(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load unplayed matches.");
    } finally {
      setLoading(false);
    }
  }

  async function restoreMatch(matchId) {
    try {
      await api.patch(`/matches/${matchId}/status`, { status: "SCHEDULED" });
      await load();
    } catch (err) {
      alert(err.response?.data?.detail || err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl relative">
        <h2 className="text-lg font-semibold mb-4">
          Partidos Pendientes – Ronda {roundId}
        </h2>

        {loading && <p>Cargando...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && matches.length === 0 && (
          <p className="text-gray-500">No hay partidos pendientes.</p>
        )}

        {!loading && matches.length > 0 && (
          <div className="overflow-y-auto max-h-80 border rounded">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-sm text-gray-600 uppercase">
                <tr>
                  <th className="px-4 py-2">Jugador 1</th>
                  <th className="px-4 py-2">Jugador 2</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{m.player1.full_name}</td>
                    <td className="px-4 py-2">{m.player2.full_name}</td>
                    <td className="px-4 py-2 text-gray-500">
                      {m.scheduled_date
                        ? new Date(m.scheduled_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          m.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {m.status === "CANCELLED" ? "Cancelado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {m.status === "CANCELLED" && (
                          <button
                            onClick={() => restoreMatch(m.id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                          >
                            Restaurar
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMatch(m)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm"
                        >
                          Añadir resultado
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>

        {selectedMatch && (
          <ReportResultModal
            match={selectedMatch}
            me={{ is_admin: true }}
            onClose={() => setSelectedMatch(null)}
            onSuccess={() => {
              load();
              setSelectedMatch(null);
            }}
            isEditMode={false}
          />
        )}
      </div>
    </div>
  );
}
