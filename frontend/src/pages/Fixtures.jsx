import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";
import ReportResultModal from "../components/ReportResultModal";

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [me, setMe] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  async function load() {
    const [data, meResp] = await Promise.all([
      apiGet("/matches/fixtures"),
      apiGet("/profile/me").catch(() => null),
    ]);
    setFixtures(data);
    setMe(meResp);
  }

  useEffect(() => {
    load();
  }, []);

  const canReport = (f) =>
    me && (f.player1.id === me.id || f.player2.id === me.id);

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-4 text-gray-800">
        Upcoming Fixtures
      </h1>

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
                {f.player1?.full_name}{" "}
                <span className="text-gray-500">vs</span>{" "}
                {f.player2?.full_name}
              </div>
              <div className="flex items-center gap-3 text-gray-500 text-sm">
                <span>
                  {f.scheduled_date
                    ? new Date(f.scheduled_date).toLocaleDateString()
                    : "No date"}
                </span>
                {canReport(f) && (
                  <button
                    onClick={() => setSelectedMatch(f)}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Report
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
