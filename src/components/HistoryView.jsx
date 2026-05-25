import { useEffect, useState } from "react";
import { MEAL_FIELDS, SNACK_FIELDS, WEIGHT_TIMINGS } from "../data/users.js";
import { api } from "../services/api.js";
import { formatDateJa } from "../utils/date.js";

const timingLabel = (value) => WEIGHT_TIMINGS.find((item) => item.value === value)?.label || "";

const visibleFoodItems = (fields, meals = {}, photos = {}) =>
  fields
    .map((field) => ({
      ...field,
      meal: meals[field.key] || "",
      photo: photos[field.key] || "",
    }))
    .filter((field) => field.meal.trim() || field.photo);

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
    <section className="person-panel stack" id={`history-${user.id}`} style={{ "--accent": user.color }}>
      <div className="person-heading">
        <p className="eyebrow">{user.label}</p>
      </div>
      {error && <p className="error-message">{error}</p>}
      {logs.length === 0 && <p className="soft-message">まだ記録がありません。</p>}
      <div className="history-list">
        {logs.map((log) => {
          const done = log.exercises?.filter((exercise) => exercise.done).length || 0;
          const total = log.exercises?.length || 0;
          const meals = visibleFoodItems(MEAL_FIELDS, log.meals, log.foodPhotos);
          const snacks = visibleFoodItems(SNACK_FIELDS, log.meals, log.foodPhotos);
          return (
            <article className="history-item" key={log.id}>
              <div className="history-main">
                <h2>{formatDateJa(log.date)}</h2>
                <div className="history-summary">
                  <span>{log.weight || "-"}kg({timingLabel(log.weightTiming)})</span>
                  <span>運動 {done} / {total}</span>
                </div>
                {(meals.length > 0 || snacks.length > 0 || photos.length > 0) && (
                  <div className="history-food">
                    {meals.length > 0 && (
                      <div>
                        <strong>食事</strong>
                        <ul>
                          {meals.map((meal) => (
                            <li key={meal.key}>
                              <div>
                                <span>{meal.label}</span>
                                {meal.meal && <p>{meal.meal}</p>}
                              </div>
                              {meal.photo && (
                                <img alt={`食事 ${meal.label}の写真`} src={meal.photo} />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {snacks.length > 0 && (
                      <div>
                        <strong>間食</strong>
                        <ul>
                          {snacks.map((snack) => (
                            <li key={snack.key}>
                              <div>
                                <span>{snack.label}</span>
                                {snack.meal && <p>{snack.meal}</p>}
                              </div>
                              {snack.photo && (
                                <img alt={`間食 ${snack.label}の写真`} src={snack.photo} />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
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
          <h1>履歴</h1>
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
