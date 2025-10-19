import { Menu, Users, Trophy, Calendar } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ open, setOpen }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 transform bg-white shadow-md z-50 w-64 transition-transform duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:shadow-none`}
    >
      <div className="p-5 flex items-center justify-between border-b md:justify-center">
        <h2 className="text-2xl font-bold text-blue-600">Challenge Tennis Academy</h2>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <nav className="flex flex-col p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded-md transition ${
              isActive ? "bg-blue-100 text-blue-600 font-semibold" : "hover:bg-gray-100"
            }`
          }
        >
          <Menu size={18} /> Dashboard
        </NavLink>
        <NavLink
          to="/matches"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded-md transition ${
              isActive ? "bg-blue-100 text-blue-600 font-semibold" : "hover:bg-gray-100"
            }`
          }
        >
          <Trophy size={18} /> Matches
        </NavLink>
        <NavLink
          to="/rankings"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded-md transition ${
              isActive ? "bg-blue-100 text-blue-600 font-semibold" : "hover:bg-gray-100"
            }`
          }
        >
          <Users size={18} /> Rankings
        </NavLink>
        <NavLink
          to="/fixtures"
          className={({ isActive }) =>
            `flex items-center gap-3 p-2 rounded-md transition ${
              isActive ? "bg-blue-100 text-blue-600 font-semibold" : "hover:bg-gray-100"
            }`
          }
        >
          <Calendar size={18} /> Fixtures
        </NavLink>
      </nav>
    </aside>
  );
}
