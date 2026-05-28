import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "./Card.jsx";
import { FOOD_FIELDS, MEAL_FIELDS, SNACK_FIELDS, WEIGHT_TIMINGS } from "../data/users.js";
import { api } from "../services/api.js";

const emptyMeals = Object.fromEntries(FOOD_FIELDS.map((field) => [field.key, ""]));
const emptyFoodPhotos = Object.fromEntries(FOOD_FIELDS.map((field) => [field.key, ""]));

const makeEmptyLog = (user, date) => ({
  id: `${date}-${user}`,
  user,
  date,
  weight: "",
  weightTiming: "beforeDinner",
  meals: emptyMeals,
  foodPhotos: emptyFoodPhotos,
  exercises: [],
  memo: "",
});

const previousDate = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function mergeExercises(masters, saved = []) {
  const savedItems = Array.isArray(saved) ? saved : [];
  const savedMap = new Map(savedItems.map((item) => [item.exerciseId, item]));
  const masterExercises = masters.map((exercise) => {
    const current = savedMap.get(exercise.id);
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      duration: current?.duration ?? exercise.duration,
      unit: exercise.unit,
      done: Boolean(current?.done),
      isCustom: false,
    };
  });
  const customExercises = savedItems
    .filter((item) => item.isCustom || !masters.some((exercise) => exercise.id === item.exerciseId))
    .map((item) => ({
      exerciseId: item.exerciseId || `custom-${crypto.randomUUID()}`,
      name: item.name || "追加運動",
      duration: item.duration ?? "",
      unit: item.unit || "分",
      done: item.done !== false,
      isCustom: true,
    }));
  return [...masterExercises, ...customExercises];
}

const imageToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function TodayLogView({ user, date, panelId }) {
  const [log, setLog] = useState(makeEmptyLog(user, date));
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousWeight, setPreviousWeight] = useState("");
  const [customExercise, setCustomExercise] = useState({ name: "", duration: "", unit: "分" });
  const saveTimer = useRef(null);

  useEffect(() => {
    let alive = true;
    setDirty(false);
    setLoading(true);
    setError("");
    setMessage("");
    Promise.all([
      api.getDailyLog(user, date),
      api.listExercises(user),
      api.getDailyLog(user, previousDate(date)),
    ])
      .then(([savedLog, exercises, yesterdayLog]) => {
        if (!alive) return;
        const base = savedLog || makeEmptyLog(user, date);
        setMasters(exercises);
        setPreviousWeight(yesterdayLog?.weight || "");
        setLog({
          ...base,
          meals: { ...emptyMeals, ...base.meals },
          foodPhotos: { ...emptyFoodPhotos, ...base.foodPhotos },
          exercises: mergeExercises(exercises, base.exercises),
        });
        setDirty(false);
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user, date]);

  useEffect(() => {
    if (loading || !dirty) return undefined;

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      setError("");
      try {
        const saved = await api.saveDailyLog({ ...log, user, date });
        setLog({ ...saved, exercises: mergeExercises(masters, saved.exercises) });
        setDirty(false);
        setMessage("");
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }, 2000);

    return () => window.clearTimeout(saveTimer.current);
  }, [date, dirty, loading, log, masters, user]);

  const doneCount = useMemo(
    () => log.exercises.filter((exercise) => exercise.done).length,
    [log.exercises],
  );

  const updateMeal = (key, value) => {
    setDirty(true);
    setLog((current) => ({ ...current, meals: { ...current.meals, [key]: value } }));
  };

  const updateFoodPhoto = async (key, file) => {
    if (!file) return;
    setError("");
    try {
      const photo = await imageToDataUrl(file);
      setDirty(true);
      setLog((current) => ({
        ...current,
        foodPhotos: { ...current.foodPhotos, [key]: photo },
      }));
    } catch {
      setError("写真を読み込めませんでした");
    }
  };

  const removeFoodPhoto = (key) => {
    setDirty(true);
    setLog((current) => ({
      ...current,
      foodPhotos: { ...current.foodPhotos, [key]: "" },
    }));
  };

  const toggleExercise = (exerciseId) => {
    setDirty(true);
    setLog((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, done: !exercise.done } : exercise,
      ),
    }));
  };

  const updateExerciseDuration = (exerciseId, duration) => {
    setDirty(true);
    setLog((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, duration } : exercise,
      ),
    }));
  };

  const addCustomExercise = (event) => {
    event.preventDefault();
    const name = customExercise.name.trim();
    if (!name) return;

    setDirty(true);
    setLog((current) => ({
      ...current,
      exercises: [
        ...current.exercises,
        {
          exerciseId: `custom-${crypto.randomUUID()}`,
          name,
          duration: customExercise.duration,
          unit: customExercise.unit.trim() || "分",
          done: true,
          isCustom: true,
        },
      ],
    }));
    setCustomExercise({ name: "", duration: "", unit: "分" });
  };

  const removeCustomExercise = (exerciseId) => {
    setDirty(true);
    setLog((current) => ({
      ...current,
      exercises: current.exercises.filter((exercise) => exercise.exerciseId !== exerciseId),
    }));
  };

  const updateLog = (patch) => {
    setDirty(true);
    setLog((current) => ({ ...current, ...patch }));
  };

  return (
    <section className="person-log stack" id={panelId}>
      <div className="person-heading">
        <p className="eyebrow">{user}</p>
        {(saving || dirty) && (
          <span className="save-state">{saving ? "保存中..." : "未保存"}</span>
        )}
      </div>
      {loading && <p className="soft-message">読み込み中...</p>}
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <Card title="体重">
        <label className="field">
          <input
            inputMode="decimal"
            min="0"
            step="0.1"
            type="number"
            value={log.weight}
            onChange={(event) => updateLog({ weight: event.target.value })}
            placeholder={previousWeight ? `${previousWeight} kg` : "52.4 kg"}
          />
        </label>
        <div className="chip-row">
          {WEIGHT_TIMINGS.map((timing) => (
            <button
              className={log.weightTiming === timing.value ? "chip selected" : "chip"}
              key={timing.value}
              type="button"
              onClick={() => updateLog({ weightTiming: timing.value })}
            >
              {timing.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="食事">
        <div className="food-columns">
          <div className="food-column">
            <h3>食事</h3>
            {MEAL_FIELDS.map((field) => (
              <div className="field" key={field.key}>
                <span>{field.label}</span>
                <textarea
                  value={log.meals[field.key] || ""}
                  onChange={(event) => updateMeal(field.key, event.target.value)}
                  placeholder="食べたものメモ"
                />
                <div className="photo-control">
                  {log.foodPhotos?.[field.key] && (
                    <img alt={`${field.label}の写真`} src={log.foodPhotos[field.key]} />
                  )}
                  <div className="photo-actions">
                    <label className="photo-button">
                      写真を追加
                      <input
                        accept="image/*"
                        type="file"
                        onChange={(event) => updateFoodPhoto(field.key, event.target.files?.[0])}
                      />
                    </label>
                    {log.foodPhotos?.[field.key] && (
                      <button type="button" onClick={() => removeFoodPhoto(field.key)}>
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="food-column">
            <h3>間食</h3>
            {SNACK_FIELDS.map((field) => (
              <div className="field" key={field.key}>
                <span>{field.label}</span>
                <textarea
                  value={log.meals[field.key] || ""}
                  onChange={(event) => updateMeal(field.key, event.target.value)}
                  placeholder="おやつ、飲みものなど"
                />
                <div className="photo-control">
                  {log.foodPhotos?.[field.key] && (
                    <img alt={`${field.label}の写真`} src={log.foodPhotos[field.key]} />
                  )}
                  <div className="photo-actions">
                    <label className="photo-button">
                      写真を追加
                      <input
                        accept="image/*"
                        type="file"
                        onChange={(event) => updateFoodPhoto(field.key, event.target.files?.[0])}
                      />
                    </label>
                    {log.foodPhotos?.[field.key] && (
                      <button type="button" onClick={() => removeFoodPhoto(field.key)}>
                        削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title={`運動 ${doneCount}/${log.exercises.length}`}>
        {log.exercises.length === 0 && <p className="empty-text">運動項目を追加するとここに出ます。</p>}
        <div className="exercise-list">
          {log.exercises.map((exercise) => (
            <div
              className={[
                "exercise-toggle",
                exercise.done ? "done" : "",
                exercise.isCustom ? "custom" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={exercise.exerciseId}
            >
              <button type="button" onClick={() => toggleExercise(exercise.exerciseId)}>
                {exercise.done ? "done" : "off"}
              </button>
              <strong>{exercise.name}</strong>
              <label className="exercise-duration">
                <input
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  type="number"
                  value={exercise.duration}
                  onChange={(event) =>
                    updateExerciseDuration(exercise.exerciseId, event.target.value)
                  }
                />
                <span>{exercise.unit}</span>
              </label>
              {exercise.isCustom && (
                <button
                  className="exercise-remove"
                  type="button"
                  onClick={() => removeCustomExercise(exercise.exerciseId)}
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
        <form className="custom-exercise-form" onSubmit={addCustomExercise}>
          <input
            value={customExercise.name}
            onChange={(event) =>
              setCustomExercise((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="今日だけの運動"
          />
          <input
            inputMode="decimal"
            min="0"
            step="0.5"
            type="number"
            value={customExercise.duration}
            onChange={(event) =>
              setCustomExercise((current) => ({ ...current, duration: event.target.value }))
            }
            placeholder="10"
          />
          <input
            value={customExercise.unit}
            onChange={(event) =>
              setCustomExercise((current) => ({ ...current, unit: event.target.value }))
            }
            placeholder="分"
          />
          <button type="submit">追加</button>
        </form>
      </Card>

      <Card title="メモ">
        <textarea
          className="memo-box"
          value={log.memo}
          onChange={(event) => updateLog({ memo: event.target.value })}
          placeholder="体調、気分、残しておきたいこと"
        />
      </Card>
    </section>
  );
}
