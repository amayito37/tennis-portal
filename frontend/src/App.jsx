import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { getToken, clearToken } from "./services/api";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Rankings from "./pages/Rankings";
import Matches from "./pages/Matches";
import Fixtures from "./pages/Fixtures";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

export default function App() {
  const [token, setToken] = useState(getToken());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    clearToken();
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={() => setToken(getToken())} />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onLogout={handleLogout} />

        {/* Mobile Header */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="md:hidden flex items-center justify-between p-4 border-b bg-white shadow-sm">
            <h1 className="text-xl font-semibold text-blue-600">Tennis</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md border text-blue-600"
            >
              ☰
            </button>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
