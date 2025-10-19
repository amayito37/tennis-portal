const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchRanking() {
  const response = await fetch(`${API_URL}/players/ranking`);
  if (!response.ok) throw new Error("Failed to fetch ranking");
  return response.json();
}
