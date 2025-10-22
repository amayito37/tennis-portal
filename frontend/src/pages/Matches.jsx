import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";

export default function Matches() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const data = await apiGet("/matches/results");
        setResults(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load results.");
      }
    }
    fetchResults();
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Recent Results</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {results.length === 0 ? (
        <p className="text-gray-500">No results available yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Player 1</th>
                <th className="px-4 py-3 text-left">Player 2</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Winner</th>
                <th className="px-4 py-3 text-left">Date</th>
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
                  <td className="px-4 py-2 text-gray-500">
                    {m.scheduled_date
                      ? new Date(m.scheduled_date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
