import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";

const blankGoal = (user) => ({
  user,
  targetWeight: "",
  goalMemo: "",
});

export function GoalPanel({ user }) {
  const [goal, setGoal] = useState(blankGoal(user.id));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    let alive = true;
    setError("");
    setDirty(false);
    setMessage("");
    api
      .getGoal(user.id)
      .then((saved) => {
        if (!alive) return;
        setGoal(saved || blankGoal(user.id));
        setDirty(false);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [user.id]);

  useEffect(() => {
    if (!dirty) return undefined;

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      setError("");
      try {
        const saved = await api.saveGoal({ ...goal, user: user.id });
        setGoal(saved);
        setDirty(false);
        setMessage("");
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }, 900);

    return () => window.clearTimeout(saveTimer.current);
  }, [dirty, goal, user.id]);

  const updateGoal = (patch) => {
    setDirty(true);
    setGoal((current) => ({ ...current, ...patch }));
  };

  return (
    <section className="person-panel stack" style={{ "--accent": user.color }}>
      <div className="person-heading">
        <p className="eyebrow">{user.label}</p>
        {(saving || dirty) && (
          <span className="save-state">{saving ? "保存中..." : "未保存"}</span>
        )}
      </div>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <div className="card exercise-form">
        <label className="field">
          <span>目標体重</span>
          <input
            inputMode="decimal"
            min="0"
            step="0.1"
            type="number"
            value={goal.targetWeight}
            onChange={(event) => updateGoal({ targetWeight: event.target.value })}
            placeholder="50.0 kg"
          />
        </label>
        <label className="field">
          <span>目標メモ</span>
          <textarea
            value={goal.goalMemo}
            onChange={(event) => updateGoal({ goalMemo: event.target.value })}
            placeholder="無理なく続ける、週3回歩く、など"
          />
        </label>
      </div>
    </section>
  );
}

export function GoalSettings({ users }) {
  return (
    <div className="two-person-grid">
      {users.map((user) => (
        <GoalPanel key={user.id} user={user} />
      ))}
    </div>
  );
}
