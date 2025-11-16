import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";
import ReportResultModal from "../components/ReportResultModal";

export default function Matches() {
  const [results, setResults] = useState([]);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const fetchResults = async () => {
    try {
      const [data, meResp] = await Promise.all([
        apiGet("/matches/results"),
        apiGet("/profile/me").catch(() => null),
      ]);
      setResults(data);
      setMe(meResp);
    } catch (err) {
      console.error(err);
      setError("Error obteniendo resultados.");
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Resultados recientes</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {results.length === 0 ? (
        <p className="text-gray-500">No hay resultados disponibles.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Jugador 1</th>
                <th className="px-4 py-3 text-left">Jugador 2</th>
                <th className="px-4 py-3 text-left">Resultado</th>
                <th className="px-4 py-3 text-left">Ganador</th>
                {me?.is_admin && <th className="px-4 py-3 text-left">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {results.map((m) => (
                <tr
                  key={m.id}
                  className="border-t hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-4 py-2 text-gray-800">
                    {m.player1?.full_name || "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-800">
                    {m.player2?.full_name || "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 font-medium">
                    {m.score || "-"}
                  </td>
                  <td className="px-4 py-2 font-semibold text-blue-700">
                    {m.winner?.full_name || "-"}
                  </td>

                  {me?.is_admin && (
                    <td className="px-4 py-2 text-left">
                      <button
                        onClick={() => setSelectedMatch(m)}
                        className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded text-sm"
                      >
                        ✎ Editar Resultado
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedMatch && (
        <ReportResultModal
          match={selectedMatch}
          me={me}
          onClose={() => setSelectedMatch(null)}
          onSuccess={fetchResults}
          isEditMode={true}
        />
      )}
    </div>
  );
}
