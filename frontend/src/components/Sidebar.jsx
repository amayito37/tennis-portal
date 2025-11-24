import { useState, useEffect } from "react";
import { Menu, Users, Trophy, Calendar, User, Medal, NotebookTabs } from "lucide-react";
import { NavLink } from "react-router-dom";
import { apiGet } from "../services/api";

export default function Sidebar({ open, setOpen }) {
  const [me, setMe] = useState(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiGet("/profile/me");
        setMe(res);
      } catch {
        setMe(null);
      }
    }
    loadMe();
  }, []);

  function closeOnMobile() {
    if (window.innerWidth < 768) {
      setOpen(false);
    }
  }

  function MobileNavItem(props) {
    const { to, icon, children } = props;
    const Icon = icon;

    return (
      <NavLink
        to={to}
        onClick={closeOnMobile}
        className={({ isActive }) =>
          `flex items-center gap-3 p-2 rounded-md transition ${
            isActive
              ? "bg-blue-100 text-blue-600 font-semibold"
              : "hover:bg-gray-100"
          }`
        }
      >
        <Icon size={18} />
        {children}
      </NavLink>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 transform bg-white shadow-md z-50 w-64 
        transition-transform duration-300 ease-in-out flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:static md:shadow-none`}
    >
      {/* Sidebar header */}
      <div className="p-5 flex items-center justify-between border-b md:justify-center">
        <h2 className="text-2xl font-bold text-blue-600">
          Challenge Tennis Academy
        </h2>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col p-4 space-y-2">
        <MobileNavItem to="/" icon={Menu}>Inicio</MobileNavItem>
        <MobileNavItem to="/matches" icon={Trophy}>Resultados</MobileNavItem>
        <MobileNavItem to="/groups" icon={Users}>Grupos</MobileNavItem>
        <MobileNavItem to="/rankings" icon={Medal}>Ranking</MobileNavItem>
        <MobileNavItem to="/fixtures" icon={Calendar}>Partidos</MobileNavItem>
        <MobileNavItem to="/profile" icon={User}>Perfil</MobileNavItem>

        {me?.is_admin && (
          <NavLink
            to="/admin/rounds"
            onClick={closeOnMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 p-2 rounded-md transition ${
                isActive
                  ? "bg-purple-100 text-purple-700 font-semibold"
                  : "hover:bg-gray-100 text-purple-700"
              }`
            }
          >
            <NotebookTabs size={18} /> Administrar Rondas
          </NavLink>
        )}
      </nav>

      <div className="mt-auto flex items-center justify-center p-6">
        <img
          src="/logocta.png"
          alt="Challenge Tennis Academy"
          className="max-w-full max-h-40 object-contain"
        />
      </div>
    </aside>
  );
}
