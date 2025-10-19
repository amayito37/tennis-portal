import React, { useState } from 'react';
import { Menu, User } from 'lucide-react';
import './styles.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-title">Tennis</div>
      <div className="sidebar-nav">
        <button><Menu size={18} /> Dashboard</button>
        <button className="active"><Menu size={18} /> Matches</button>
        <button><Menu size={18} /> Rankings</button>
        <button><Menu size={18} /> Fixtures</button>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="header">
      <nav>
        <a href="#">Home</a>
        <a href="#">Rankings</a>
        <a href="#">Fixtures</a>
      </nav>
      <div className="flex items-center gap-2 text-gray-700 font-medium">
        <User size={20} className="text-blue-600" /> John Doe
      </div>
    </header>
  );
}

function RankingsTable({ players }) {
  return (
    <table className="player-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Player</th>
          <th>Matches</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p) => (
          <tr key={p.rank}>
            <td>{p.rank}</td>
            <td>{p.name}</td>
            <td>{p.matches}</td>
            <td>{p.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function App() {
  const [players] = useState([
    { rank: 1, name: 'John Doe', matches: 10, points: 560 },
    { rank: 2, name: 'Jane Smith', matches: 8, points: 490 },
    { rank: 3, name: 'Alex Johnson', matches: 19, points: 450 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 }
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="main">
        <Header />
        <section>
          <h1 className="text-2xl font-bold mb-4">Player Rankings</h1>
          <div className="flex gap-4 mb-4">
            <input type="text" placeholder="Search players..." className="input-field" />
            <button className="button-primary">Add Match</button>
          </div>
          <RankingsTable players={players} />
        </section>
      </main>
    </div>
  );
}
