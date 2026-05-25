import { useEffect, useState } from "react";
import { MEAL_FIELDS, SNACK_FIELDS, WEIGHT_TIMINGS } from "../data/users.js";
import { api } from "../services/api.js";
import { formatDateJa } from "../utils/date.js";

const timingLabel = (value) => WEIGHT_TIMINGS.find((item) => item.value === value)?.label || "";

const filledItems = (fields, values = {}) =>
  fields
    .map((field) => ({ ...field, value: values[field.key] || "" }))
    .filter((field) => field.value.trim());

const photoItems = (fields, values = {}) =>
  fields
    .map((field) => ({ ...field, value: values[field.key] || "" }))
    .filter((field) => field.value);

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
          const meals = filledItems(MEAL_FIELDS, log.meals);
          const snacks = filledItems(SNACK_FIELDS, log.meals);
          const photos = photoItems([...MEAL_FIELDS, ...SNACK_FIELDS], log.foodPhotos);
          return (
            <article className="history-item" key={log.id}>
              <div className="history-main">
                <h2>{formatDateJa(log.date)}</h2>
                <p>
                  {log.weight || "-"}kg / {timingLabel(log.weightTiming)} / 運動 {done}/{total}
                </p>
                {(meals.length > 0 || snacks.length > 0 || photos.length > 0) && (
                  <div className="history-food">
                    {meals.length > 0 && (
                      <div>
                        <strong>食事</strong>
                        <ul>
                          {meals.map((meal) => (
                            <li key={meal.key}>
                              <span>{meal.label}</span>
                              {meal.value}
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
                              <span>{snack.label}</span>
                              {snack.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {photos.length > 0 && (
                      <div className="history-photo-strip">
                        {photos.map((photo) => (
                          <img alt={`${photo.label}の写真`} key={photo.key} src={photo.value} />
                        ))}
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
          <p className="eyebrow">nami / kaz</p>
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
