import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Rankings from "./pages/Rankings";
import Matches from "./pages/Matches";
import Fixtures from "./pages/Fixtures";
import { useState } from "react";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar (visible on mobile) */}
          <div className="md:hidden flex items-center justify-between p-4 border-b bg-white shadow-sm">
            <h1 className="text-xl font-semibold text-blue-600">Tennis</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md border text-blue-600"
            >
              ☰
            </button>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rankings" element={<Rankings />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/fixtures" element={<Fixtures />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
