import { Menu, Trophy, Calendar, Home } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white'
        : 'text-gray-700 hover:bg-blue-50 hover:text-primary'
    }`;

  return (
    <aside className="w-64 h-screen border-r border-gray-200 bg-white p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-primary mb-8">Tennis</h1>
      <nav className="flex flex-col gap-1">
        <NavLink to="/" className={linkClass}>
          <Home size={18} /> Dashboard
        </NavLink>
        <NavLink to="/matches" className={linkClass}>
          <Menu size={18} /> Matches
        </NavLink>
        <NavLink to="/rankings" className={linkClass}>
          <Trophy size={18} /> Rankings
        </NavLink>
        <NavLink to="/fixtures" className={linkClass}>
          <Calendar size={18} /> Fixtures
        </NavLink>
      </nav>
    </aside>
  );
}
