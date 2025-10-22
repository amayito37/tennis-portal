import { clearToken } from "../services/api";

export default function Header() {
  function handleLogout() {
    clearToken();
    window.location.reload();
  }

  return (
    <header className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold text-gray-700">Tennis Portal</h2>
      <button
        onClick={handleLogout}
        className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-sm"
      >
        Logout
      </button>
    </header>
  );
}
