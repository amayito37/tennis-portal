import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Rankings from './pages/Rankings';
import Fixtures from './pages/Fixtures';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 bg-light overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/fixtures" element={<Fixtures />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
