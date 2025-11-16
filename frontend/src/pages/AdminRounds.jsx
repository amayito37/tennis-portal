import { useEffect, useState } from "react";
import api from "../services/api";
import Header from "../components/Header";
import ReviewUnplayedModal from "../components/ReviewUnplayedModal";

export default function AdminRounds() {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRound, setNewRound] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  // ✅ new: track round being reviewed
  const [reviewRound, setReviewRound] = useState(null);

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/rounds");
      setRounds(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("No se han podido cargar las rondas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const handleCreateRound = async () => {
    if (!newRound.name || !newRound.start_date || !newRound.end_date) {
      alert("Por favor rellena todos los campos");
      return;
    }
    try {
      await api.post("/rounds", newRound);
      setNewRound({ name: "", start_date: "", end_date: "" });
      await fetchRounds();
    } catch (err) {
      alert("Error creando ronda: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAction = async (id, action) => {
    try {
      setLoading(true);
      if (action === "activate") await api.post(`/rounds/${id}/activate`);
      if (action === "fixtures") await api.post(`/rounds/${id}/generate-fixtures`);
      if (action === "close") await api.post(`/rounds/${id}/close`);
      if (action === "finalize") await api.post(`/rounds/${id}/finalize`);
      await fetchRounds();
    } catch (err) {
      alert("No se ha podido completar la acción: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 min-h-screen bg-gray-50">
      <Header />
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🗓️ Configuración de ronda</h1>

      {/* Create new round */}
      <div className="bg-white p-5 rounded-xl shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Crear nueva ronda</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Round Name"
            value={newRound.name}
            onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="datetime-local"
            value={newRound.start_date}
            onChange={(e) => setNewRound({ ...newRound, start_date: e.target.value })}
            className="border rounded p-2"
          />
          <input
            type="datetime-local"
            value={newRound.end_date}
            onChange={(e) => setNewRound({ ...newRound, end_date: e.target.value })}
            className="border rounded p-2"
          />
          <button
            onClick={handleCreateRound}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Crear ronda
          </button>
        </div>
      </div>

      {/* Rounds table */}
      <div className="bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Inicio</th>
              <th className="px-4 py-3 text-left">Final</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rounds.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No hay rondas
                </td>
              </tr>
            )}
            {rounds.map((r) => (
              <tr key={r.id} className="border-t hover:bg-blue-50 transition">
                <td className="px-4 py-2 font-medium text-gray-800">{r.name}</td>
                <td className="px-4 py-2 text-gray-600">
                  {new Date(r.start_date).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {new Date(r.end_date).toLocaleString()}
                </td>
                <td className="px-4 py-2 font-semibold">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      r.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : r.status === "CLOSED"
                        ? "bg-yellow-100 text-yellow-700"
                        : r.status === "FINALIZED"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {r.status === "ACTIVE" 
                        ? "Activa" 
                        : r.status === "CLOSED"
                        ? "Cerrada"
                        : r.status === "FINALIZED"
                        ? "Finalizada"
                        : "Borrador" 
                    }
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {r.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => handleAction(r.id, "activate")}
                          className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm"
                        >
                          Activar
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "fixtures")}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded text-sm"
                        >
                          Generar partidos
                        </button>
                      </>
                    )}
                    {r.status === "ACTIVE" && (
                      <button
                        onClick={() => handleAction(r.id, "close")}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-1 rounded text-sm"
                      >
                        Cerrar ronda
                      </button>
                    )}
                    {r.status === "CLOSED" && (
                      <>
                        <button
                          onClick={() => setReviewRound(r)} // ✅ open modal instead of alert
                          className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded text-sm"
                        >
                          Revisar pendientes
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "finalize")}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm"
                        >
                          Finalizar y actualizar grupos
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/50 text-lg font-semibold">
          Cargando...
        </div>
      )}

      {/* ✅ new modal for reviewing unplayed matches */}
      {reviewRound && (
        <ReviewUnplayedModal
          roundId={reviewRound.id}
          onClose={() => setReviewRound(null)}
        />
      )}
    </div>
  );
}
