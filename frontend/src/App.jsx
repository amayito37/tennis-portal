import React, { useState } from 'react';
import { Menu, User } from 'lucide-react';
import './styles.css';
import { Home, Trophy, BarChart2, Calendar } from "lucide-react";

function Sidebar() {
 const [active, setActive] = useState("Matches"); // Matches por defecto

  const buttons = [
    { label: "Dashboard", icon: <Home size={18} /> },
    { label: "Matches", icon: <Trophy size={18} /> },
    { label: "Rankings", icon: <BarChart2 size={18} /> },
    { label: "Fixtures", icon: <Calendar size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-nav">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            className={active === btn.label ? "active" : ""}
            onClick={() => setActive(btn.label)}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="logo">Tennis</div>
      <nav>
        <a href="#">Home</a>
        <a href="#">Rankings</a>
        <a href="#">Fixtures</a>
      </nav>
      <div className="user">
        <User size={28} className="icon" />
        <span>John Doe</span>
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
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 },
    { rank: 4, name: 'Samuel Williams', matches: 12, points: 430 }
    
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="main">
        <Header />
        <section>
          <h1 className="text-2xl font-bold mb-a">Player Rankings</h1>
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
