import { useEffect, useState } from "react";
import { WEIGHT_TIMINGS } from "../data/users.js";
import { api } from "../services/api.js";
import { formatDateJa } from "../utils/date.js";

const timingLabel = (value) => WEIGHT_TIMINGS.find((item) => item.value === value)?.label || "";

function UserHistory({ user, onEdit }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api.listLogs(user.id).then(setLogs).catch((err) => setError(err.message));
  };

  useEffect(load, [user.id]);

  const remove = async (date) => {
    if (!window.confirm(`${user.label} / ${date} の記録を削除しますか？`)) return;
    await api.deleteLog(user.id, date);
    load();
  };

  return (
    <section className="person-panel stack" style={{ "--accent": user.color }}>
      <div className="person-heading">
        <p className="eyebrow">{user.label}</p>
        <h2>History</h2>
      </div>
      {error && <p className="error-message">{error}</p>}
      {logs.length === 0 && <p className="soft-message">まだ記録がありません。</p>}
      <div className="history-list">
        {logs.map((log) => {
          const done = log.exercises?.filter((exercise) => exercise.done).length || 0;
          const total = log.exercises?.length || 0;
          return (
            <article className="history-item" key={log.id}>
              <div>
                <h2>{formatDateJa(log.date)}</h2>
                <p>
                  {log.weight || "-"}kg / {timingLabel(log.weightTiming)} / 運動 {done}/{total}
                </p>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => onEdit(log.date)}>
                  編集
                </button>
                <button className="ghost-danger" type="button" onClick={() => remove(log.date)}>
                  削除
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HistoryView({ users, onEdit }) {
  return (
    <section className="page-pad stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">nami / kaz</p>
          <h1>History</h1>
        </div>
      </div>
      <div className="two-person-grid">
        {users.map((user) => (
          <UserHistory key={user.id} user={user} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}
