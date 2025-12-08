import { useState, useEffect } from "react";
import api from "../services/api";

const OUTCOMES = ["COMPLETED", "RETIREMENT", "WALKOVER", "ADMIN_DECISION"];

const OUTCOME_LABELS = {
  COMPLETED: "Completado",
  RETIREMENT: "Retirada",
  WALKOVER: "No Presentado",
  ADMIN_DECISION: "Decisión administrativa",
};

export default function ReportResultModal({
  match,
  me,
  onClose,
  onSuccess,
  isEditMode = false,
}) {
  const [winnerId, setWinnerId] = useState(null);
  const [outcome, setOutcome] = useState("COMPLETED");
  const [sets, setSets] = useState([
    { p1_games: 6, p2_games: 3, super_tiebreak: false },
  ]);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // Load edit mode (keep sets in backend format: p1 = player1, p2 = player2)
  // ----------------------------
  useEffect(() => {
    if (isEditMode && match.result) {
      setWinnerId(match.result.winner_id);
      setOutcome(match.result.outcome || "COMPLETED");

      const existingSets = match.result.sets?.length
        ? match.result.sets.map((s) => ({
            p1_games: s.p1_games,
            p2_games: s.p2_games,
            p1_tiebreak: s.p1_tiebreak,
            p2_tiebreak: s.p2_tiebreak,
            super_tiebreak: s.super_tiebreak,
          }))
        : [{ p1_games: 6, p2_games: 3, super_tiebreak: false }];

      setSets(existingSets);
    }
  }, [isEditMode, match.result]);

  const addSet = () =>
    setSets((prev) => [
      ...prev,
      { p1_games: 6, p2_games: 3, super_tiebreak: false },
    ]);

  const removeSet = (i) =>
    setSets((prev) => prev.filter((_, idx) => idx !== i));

  const updateSet = (i, key, val) =>
    setSets((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s))
    );

  // ----------------------------
  // Submit (send always in backend perspective: p1 = player1, p2 = player2)
  // ----------------------------
  const handleSubmit = async () => {
    if (!winnerId) return;
    setLoading(true);

    const loserId =
      match.player1.id === winnerId ? match.player2.id : match.player1.id;

    const payloadSets =
      outcome === "COMPLETED"
        ? sets.map((s) => ({
            p1_games: Number(s.p1_games),
            p2_games: Number(s.p2_games),
            p1_tiebreak: s.p1_tiebreak ? Number(s.p1_tiebreak) : null,
            p2_tiebreak: s.p2_tiebreak ? Number(s.p2_tiebreak) : null,
            super_tiebreak: Boolean(s.super_tiebreak),
          }))
        : [];

    const body = {
      winner_id: winnerId,
      loser_id: loserId,
      outcome,
      sets: payloadSets,
    };

    try {
      const endpoint = isEditMode
        ? `/matches/${match.id}/result/update`
        : `/matches/${match.id}/result`;

      await api.put(endpoint, body);
      await onSuccess?.();
      onClose();
    } catch (err) {
      alert(
        "Error submitting result: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Permissions
  // ----------------------------
  const canSubmit =
    me &&
    (me.is_admin ||
      me.id === match.player1.id ||
      me.id === match.player2.id);

  if (!canSubmit) return null;

  // ----------------------------
  // Winner / loser names (for UI)
  // ----------------------------
  const winnerName =
    winnerId === match?.player1?.id
      ? match.player1.full_name
      : winnerId === match?.player2?.id
      ? match.player2.full_name
      : "Ganador";

  const loserName =
    winnerId === match?.player1?.id
      ? match.player2.full_name
      : winnerId === match?.player2?.id
      ? match.player1.full_name
      : "Perdedor";

  // For UI mapping (only affects which column shows which underlying field)
  const winnerIsP1 = winnerId
    ? winnerId === match.player1.id
    : true;

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4">
          {isEditMode ? "Edit Result" : "Report Result"}:{" "}
          {match.player1.full_name} vs {match.player2.full_name}
        </h2>

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Ganador
        </label>
        <select
          value={winnerId || ""}
          onChange={(e) => setWinnerId(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4"
        >
          <option value="">Seleccionar ganador</option>
          <option value={match.player1.id}>{match.player1.full_name}</option>
          <option value={match.player2.id}>{match.player2.full_name}</option>
        </select>

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Resultado
        </label>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="w-full border rounded p-2 mb-4"
        >
          {(me?.is_admin
            ? OUTCOMES
            : OUTCOMES.filter((o) => o !== "ADMIN_DECISION")
          ).map((o) => (
            <option key={o} value={o}>
              {OUTCOME_LABELS[o]}
            </option>
          ))}
        </select>

        {outcome === "COMPLETED" && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Sets</h3>

              {/* Hide add button once 3 sets exist */}
              {sets.length < 3 && (
                <button
                  onClick={addSet}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                >
                  + Añadir
                </button>
              )}
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-12 gap-2 mb-1">
              <div className="col-span-2 text-center text-xs font-semibold text-gray-600">
                {winnerName}
              </div>

              <div className="col-span-1" />

              <div className="col-span-2 text-center text-xs font-semibold text-gray-600">
                {loserName}
              </div>
            </div>

            {sets.map((s, i) => {
              // Map underlying p1/p2 to winner/loser columns for UI
              const winnerGames = winnerIsP1 ? s.p1_games : s.p2_games;
              const loserGames = winnerIsP1 ? s.p2_games : s.p1_games;

              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-center mb-2"
                >
                  {/* Winner column */}
                  <input
                    type="number"
                    min="0"
                    max={s.super_tiebreak ? 10 : 7}
                    className="col-span-2 border rounded p-2"
                    value={winnerGames}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (winnerIsP1) {
                        updateSet(i, "p1_games", val);
                      } else {
                        updateSet(i, "p2_games", val);
                      }
                    }}
                  />

                  <span className="col-span-1 text-center">-</span>

                  {/* Loser column */}
                  <input
                    type="number"
                    min="0"
                    max={s.super_tiebreak ? 10 : 7}
                    className="col-span-2 border rounded p-2"
                    value={loserGames}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (winnerIsP1) {
                        updateSet(i, "p2_games", val);
                      } else {
                        updateSet(i, "p1_games", val);
                      }
                    }}
                  />

                  {i === 2 ? (
                    <label className="col-span-4 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={s.super_tiebreak}
                        onChange={(e) =>
                          updateSet(i, "super_tiebreak", e.target.checked)
                        }
                      />
                      Super TB
                    </label>
                  ) : (
                    <div className="col-span-4" />
                  )}

                  <button
                    onClick={() => removeSet(i)}
                    className="col-span-2 text-red-500"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            disabled={!winnerId || loading}
            onClick={handleSubmit}
            className={`px-3 py-1 rounded text-white ${
              !winnerId || loading
                ? "bg-gray-300 cursor-not-allowed opacity-60"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? "Guardando..."
              : isEditMode
              ? "Guardar cambios"
              : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
