import { useEffect, useMemo, useState } from "react";
import { Card } from "./Card.jsx";
import { MEAL_FIELDS, WEIGHT_TIMINGS } from "../data/users.js";
import { api } from "../services/api.js";

const emptyMeals = Object.fromEntries(MEAL_FIELDS.map((field) => [field.key, ""]));

const makeEmptyLog = (user, date) => ({
  id: `${date}-${user}`,
  user,
  date,
  weight: "",
  weightTiming: "beforeDinner",
  meals: emptyMeals,
  exercises: [],
  memo: "",
});

function mergeExercises(masters, saved = []) {
  const savedMap = new Map(saved.map((item) => [item.exerciseId, item]));
  return masters.map((exercise) => {
    const current = savedMap.get(exercise.id);
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      duration: exercise.duration,
      unit: exercise.unit,
      done: Boolean(current?.done),
    };
  });
}

export function TodayLogView({ user, date }) {
  const [log, setLog] = useState(makeEmptyLog(user, date));
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    Promise.all([api.getDailyLog(user, date), api.listExercises(user)])
      .then(([savedLog, exercises]) => {
        if (!alive) return;
        const base = savedLog || makeEmptyLog(user, date);
        setMasters(exercises);
        setLog({
          ...base,
          meals: { ...emptyMeals, ...base.meals },
          exercises: mergeExercises(exercises, base.exercises),
        });
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, date]);

  const doneCount = useMemo(
    () => log.exercises.filter((exercise) => exercise.done).length,
    [log.exercises],
  );

  const updateMeal = (key, value) => {
    setLog((current) => ({ ...current, meals: { ...current.meals, [key]: value } }));
  };

  const toggleExercise = (exerciseId) => {
    setLog((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, done: !exercise.done } : exercise,
      ),
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const saved = await api.saveDailyLog({ ...log, user, date });
      setLog({ ...saved, exercises: mergeExercises(masters, saved.exercises) });
      setMessage("今日も記録できた！");
      window.setTimeout(() => setMessage(""), 2600);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="person-log stack" onSubmit={save}>
      <div className="person-heading">
        <p className="eyebrow">{user}</p>
        <h2>{date}</h2>
      </div>
      {loading && <p className="soft-message">読み込み中...</p>}
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <Card title="体重">
        <label className="field">
          <span>体重 kg</span>
          <input
            inputMode="decimal"
            min="0"
            step="0.1"
            type="number"
            value={log.weight}
            onChange={(event) => setLog({ ...log, weight: event.target.value })}
            placeholder="52.4"
          />
        </label>
        <div className="chip-row">
          {WEIGHT_TIMINGS.map((timing) => (
            <button
              className={log.weightTiming === timing.value ? "chip selected" : "chip"}
              key={timing.value}
              type="button"
              onClick={() => setLog({ ...log, weightTiming: timing.value })}
            >
              {timing.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="食事">
        <div className="meal-grid">
          {MEAL_FIELDS.map((field) => (
            <label className="field" key={field.key}>
              <span>{field.label}</span>
              <textarea
                value={log.meals[field.key] || ""}
                onChange={(event) => updateMeal(field.key, event.target.value)}
                placeholder="食べたものを軽くメモ"
              />
            </label>
          ))}
        </div>
      </Card>

      <Card title={`運動 ${doneCount}/${log.exercises.length}`}>
        {log.exercises.length === 0 && <p className="empty-text">運動項目を追加するとここに出ます。</p>}
        <div className="exercise-list">
          {log.exercises.map((exercise) => (
            <button
              className={exercise.done ? "exercise-toggle done" : "exercise-toggle"}
              key={exercise.exerciseId}
              type="button"
              onClick={() => toggleExercise(exercise.exerciseId)}
            >
              <span>{exercise.done ? "done" : "off"}</span>
              <strong>{exercise.name}</strong>
              <small>
                {exercise.duration}
                {exercise.unit}
              </small>
            </button>
          ))}
        </div>
      </Card>

      <Card title="メモ">
        <textarea
          className="memo-box"
          value={log.memo}
          onChange={(event) => setLog({ ...log, memo: event.target.value })}
          placeholder="体調、気分、残しておきたいこと"
        />
      </Card>

      <button className="primary-action" type="submit">
        {user} を保存
      </button>
    </form>
  );
}
