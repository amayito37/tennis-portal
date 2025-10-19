export default function RankingsTable({ players }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <th className="text-sm text-gray-500 pb-2 border-b">Rank</th>
          <th className="text-sm text-gray-500 pb-2 border-b">Player</th>
          <th className="text-sm text-gray-500 pb-2 border-b">Matches</th>
          <th className="text-sm text-gray-500 pb-2 border-b">Points</th>
        </tr>
      </thead>
      <tbody>
        {players.map(p => (
          <tr
            key={p.rank}
            className="hover:bg-blue-50 transition-colors border-b text-gray-700"
          >
            <td className="py-2">{p.rank}</td>
            <td>{p.name}</td>
            <td>{p.matches}</td>
            <td>{p.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
