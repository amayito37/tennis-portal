import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet } from "../services/api";
import { Link } from "react-router-dom";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    async function load() {
      const [gs, meResp] = await Promise.all([
        apiGet("/groups"),
        apiGet("/profile/me").catch(() => null),
      ]);
      setGroups(gs || []);
      setMe(meResp || null);
    }
    load();
  }, []);

  const myGroupId = me?.group_id;
  const ordered = [...groups].sort((a, b) => {
    if (a.id === myGroupId) return -1;
    if (b.id === myGroupId) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex flex-col flex-1 p-6">
      <Header />
      <h1 className="text-2xl font-bold mb-6">Grupos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ordered.map((g) => (
          <Link key={g.id} to={`/groups/${g.id}`} className="block">
            <div
              className={`p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition
              ${g.id === myGroupId ? "ring-2 ring-blue-500" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-blue-600">{g.name}</h2>
                {g.id === myGroupId && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    Mi grupo
                  </span>
                )}
              </div>

              {/* Players list */}
              {g.members && g.members.length > 0 ? (
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  {g.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex justify-between text-sm text-gray-800"
                    >
                      <span className="font-medium">{m.full_name}</span>
                      <span className="text-gray-500">{m.points} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic mt-2">
                  No hay jugadores aún
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
