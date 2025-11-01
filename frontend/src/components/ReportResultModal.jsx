import { useState, useEffect } from "react";
import api from "../services/api";

const OUTCOMES = ["COMPLETED", "RETIREMENT", "WALKOVER", "ADMIN_DECISION"];

export default function ReportResultModal({ match, me, onClose, onSuccess, isEditMode = false }) {
  const [winnerId, setWinnerId] = useState(null);
  const [outcome, setOutcome] = useState("COMPLETED");
  const [sets, setSets] = useState([{ p1_games: 6, p2_games: 3, super_tiebreak: false }]);
  const [loading, setLoading] = useState(false);

  // ✅ Pre-fill existing result when editing
  useEffect(() => {
    if (isEditMode && match.result) {
      setWinnerId(match.result.winner_id);
      setOutcome(match.result.outcome || "COMPLETED");
      setSets(
        match.result.sets?.length
          ? match.result.sets.map((s) => ({
              p1_games: s.p1_games,
              p2_games: s.p2_games,
              p1_tiebreak: s.p1_tiebreak,
              p2_tiebreak: s.p2_tiebreak,
              super_tiebreak: s.super_tiebreak,
            }))
          : [{ p1_games: 6, p2_games: 3, super_tiebreak: false }]
      );
    }
  }, [isEditMode, match.result]);

  const addSet = () => setSets([...sets, { p1_games: 6, p2_games: 3, super_tiebreak: false }]);
  const removeSet = (i) => setSets(sets.filter((_, idx) => idx !== i));
  const updateSet = (i, key, val) =>
    setSets(sets.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));

  const handleSubmit = async () => {
    if (!winnerId) return;
    setLoading(true);

    const loserId = match.player1.id === winnerId ? match.player2.id : match.player1.id;

    const body = {
      winner_id: winnerId,
      loser_id: loserId,
      outcome,
      sets:
        outcome === "COMPLETED"
          ? sets.map((s) => ({
              p1_games: Number(s.p1_games),
              p2_games: Number(s.p2_games),
              p1_tiebreak: s.p1_tiebreak ? Number(s.p1_tiebreak) : null,
              p2_tiebreak: s.p2_tiebreak ? Number(s.p2_tiebreak) : null,
              super_tiebreak: Boolean(s.super_tiebreak),
            }))
          : [],
    };

    try {
      const endpoint = isEditMode
        ? `/matches/${match.id}/result/update`
        : `/matches/${match.id}/result`;

      await api.put(endpoint, body);
      await onSuccess?.();
      onClose();
    } catch (err) {
      alert("Error submitting result: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Admins can always edit; players only if involved
  const canSubmit =
    me &&
    (me.is_admin || me.id === match.player1.id || me.id === match.player2.id);

  if (!canSubmit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">
          {isEditMode ? "Edit Result" : "Report Result"}:{" "}
          {match.player1.full_name} vs {match.player2.full_name}
        </h2>

        <label className="block mb-2 text-sm font-medium text-gray-700">Winner</label>
        <select
          value={winnerId || ""}
          onChange={(e) => setWinnerId(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        >
          <option value="">Select winner</option>
          <option value={match.player1.id}>{match.player1.full_name}</option>
          <option value={match.player2.id}>{match.player2.full_name}</option>
        </select>

        <label className="block mb-2 text-sm font-medium text-gray-700">Outcome</label>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        >
          {OUTCOMES.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>

        {outcome === "COMPLETED" && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Sets</h3>
              <button
                onClick={addSet}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
              >
                + Add
              </button>
            </div>

            {sets.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
                <input
                  type="number"
                  className="col-span-2 border rounded p-2"
                  value={s.p1_games}
                  onChange={(e) => updateSet(i, "p1_games", e.target.value)}
                />
                <span className="col-span-1 text-center">-</span>
                <input
                  type="number"
                  className="col-span-2 border rounded p-2"
                  value={s.p2_games}
                  onChange={(e) => updateSet(i, "p2_games", e.target.value)}
                />
                <label className="col-span-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={s.super_tiebreak}
                    onChange={(e) => updateSet(i, "super_tiebreak", e.target.checked)}
                  />
                  Super TB
                </label>
                <button
                  onClick={() => removeSet(i)}
                  className="col-span-2 text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            disabled={!winnerId || loading}
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "Saving..." : isEditMode ? "Save Changes" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
