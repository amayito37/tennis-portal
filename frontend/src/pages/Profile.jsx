import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet, apiPost } from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ old_password: "", new_password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await apiGet("/profile/me");
        setUser(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load user data.");
      }
    }
    fetchUser();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await apiPost("/profile/change-password", form);
      setMessage(res.message || "Password changed successfully!");
      setForm({ old_password: "", new_password: "" });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to change password.");
    }
  }

  if (!user && !error) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto">
      <Header />
      <h1 className="text-2xl font-bold mb-6 text-blue-700">My Profile</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {user && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p><span className="font-semibold">Name:</span> {user.full_name}</p>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <p><span className="font-semibold">Points:</span> {user.points}</p>
          <p><span className="font-semibold">Role:</span> {user.is_admin ? "Admin" : "Player"}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
        <h2 className="text-lg font-semibold text-blue-600 mb-3">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              value={form.old_password}
              onChange={(e) => setForm({ ...form, old_password: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700"
          >
            Update Password
          </button>
        </form>

        {message && <p className="text-green-600 mt-4">{message}</p>}
      </div>
    </div>
  );
}
