export default function RankingsTable({ players }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
      <table className="min-w-full text-left border-collapse">
        <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Jugador</th>
            <th className="px-4 py-3">Partidos</th>
            <th className="px-4 py-3">ELO</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr
              key={p.id}
              className="border-t hover:bg-blue-50 transition"
            >
              <td className="px-4 py-2">{p.rank}</td>
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">{p.matches}</td>
              <td className="px-4 py-2 font-semibold text-blue-700">{p.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
