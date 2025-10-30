import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiGet, apiPost } from "../services/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await apiGet("/profile/me");
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    try {
      await apiPost("/profile/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setMessage("✅ Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update password. Check your old password.");
    }
  }

  if (!profile) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex flex-col flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <Header />

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- Profile Info --- */}
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-blue-600 mb-4">
            Account Details
          </h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{profile.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{profile.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Points:</span>
              <span className="font-semibold text-blue-700">{profile.points}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Role:</span>
              <span>{profile.is_admin ? "Admin" : "Player"}</span>
            </div>
          </div>
        </div>

        {/* --- Change Password --- */}
        <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-blue-600 mb-4">
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition"
            >
              Update Password
            </button>
          </form>

          {message && (
            <p
              className={`mt-3 text-sm font-medium ${
                message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
