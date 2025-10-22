import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFixtures() {
      try {
        const data = await apiGet("/matches/fixtures");
        setFixtures(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load fixtures.");
      }
    }
    fetchFixtures();
  }, []);

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Upcoming Fixtures</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {fixtures.length === 0 ? (
        <p className="text-gray-500">No upcoming fixtures.</p>
      ) : (
        <div className="space-y-3">
          {fixtures.map((f) => (
            <div
              key={f.id}
              className="flex justify-between items-center bg-white rounded-xl shadow-sm px-5 py-3 hover:shadow-md transition"
            >
              <div className="text-gray-800 font-medium">
                {f.player1?.full_name || "TBD"} <span className="text-gray-500">vs</span>{" "}
                {f.player2?.full_name || "TBD"}
              </div>
              <div className="text-gray-500 text-sm">
                {f.scheduled_date
                  ? new Date(f.scheduled_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "No date"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
