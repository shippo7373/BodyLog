import { getStore } from "@netlify/blobs";

const USERS = ["nami", "kaz"];

const defaultExercises = [
  { name: "腹筋", duration: 3, unit: "分", sortOrder: 1 },
  { name: "ヨガ", duration: 10, unit: "分", sortOrder: 2 },
  { name: "ストレッチ", duration: 5, unit: "分", sortOrder: 3 },
];

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

const assertUser = (user) => {
  if (!USERS.includes(user)) {
    throw new Error("Unknown user");
  }
};

const dailyKey = (user, date) => `${user}/${date}.json`;
const exerciseKey = (user, id) => `${user}/${id}.json`;
const goalKey = (user) => `${user}/goal.json`;
const stores = () => ({
  daily: getStore("bodylog-daily-logs"),
  exercises: getStore("bodylog-exercise-master"),
  goals: getStore("bodylog-goals"),
});

const readJsonList = async (store, prefix) => {
  const { blobs } = await store.list({ prefix });
  const items = await Promise.all(
    blobs.map((blob) => store.get(blob.key, { type: "json" })),
  );
  return items.filter(Boolean);
};

const now = () => new Date().toISOString();

const normalizeLog = (log) => {
  assertUser(log.user);
  if (!log.date) {
    throw new Error("Date is required");
  }

  const timestamp = now();
  return {
    id: `${log.date}-${log.user}`,
    user: log.user,
    date: log.date,
    weight: log.weight === "" || log.weight == null ? "" : Number(log.weight),
    weightTiming: log.weightTiming || "beforeDinner",
    meals: log.meals || {},
    foodPhotos: log.foodPhotos || {},
    exercises: Array.isArray(log.exercises) ? log.exercises : [],
    memo: log.memo || "",
    createdAt: log.createdAt || timestamp,
    updatedAt: timestamp,
  };
};

const normalizeExercise = (exercise) => {
  assertUser(exercise.user);
  const timestamp = now();
  return {
    id: exercise.id || crypto.randomUUID(),
    user: exercise.user,
    name: (exercise.name || "").trim(),
    duration: exercise.duration === "" ? "" : Number(exercise.duration),
    unit: (exercise.unit || "分").trim(),
    sortOrder: Number.isFinite(Number(exercise.sortOrder)) ? Number(exercise.sortOrder) : Date.now(),
    isActive: exercise.isActive !== false,
    createdAt: exercise.createdAt || timestamp,
    updatedAt: timestamp,
  };
};

const normalizeGoal = (goal) => {
  assertUser(goal.user);
  const timestamp = now();
  return {
    id: `${goal.user}-goal`,
    user: goal.user,
    targetWeight: goal.targetWeight === "" || goal.targetWeight == null ? "" : Number(goal.targetWeight),
    goalMemo: goal.goalMemo || "",
    createdAt: goal.createdAt || timestamp,
    updatedAt: timestamp,
  };
};

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(request.url);
    const resource = url.searchParams.get("resource");
    const user = url.searchParams.get("user");
    const date = url.searchParams.get("date");
    const id = url.searchParams.get("id");
    const store = stores();

    if (resource === "log" && request.method === "GET") {
      assertUser(user);
      if (!date) return json({ error: "Date is required" }, 400);
      return json({ log: await store.daily.get(dailyKey(user, date), { type: "json" }) });
    }

    if (resource === "logs" && request.method === "GET") {
      assertUser(user);
      const logs = await readJsonList(store.daily, `${user}/`);
      logs.sort((a, b) => b.date.localeCompare(a.date));
      return json({ logs });
    }

    if (resource === "log" && request.method === "POST") {
      const log = normalizeLog(await request.json());
      await store.daily.setJSON(dailyKey(log.user, log.date), log);
      return json({ log });
    }

    if (resource === "log" && request.method === "DELETE") {
      assertUser(user);
      if (!date) return json({ error: "Date is required" }, 400);
      await store.daily.delete(dailyKey(user, date));
      return json({ ok: true });
    }

    if (resource === "exercises" && request.method === "GET") {
      assertUser(user);
      const includeInactive = url.searchParams.get("includeInactive") === "true";
      let exercises = await readJsonList(store.exercises, `${user}/`);
      if (exercises.length === 0) {
        exercises = defaultExercises.map((exercise) =>
          normalizeExercise({ ...exercise, id: crypto.randomUUID(), user }),
        );
        await Promise.all(
          exercises.map((exercise) =>
            store.exercises.setJSON(exerciseKey(user, exercise.id), exercise),
          ),
        );
      }
      const visible = includeInactive ? exercises : exercises.filter((item) => item.isActive);
      visible.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      return json({ exercises: visible });
    }

    if (resource === "exercise" && request.method === "POST") {
      const exercise = normalizeExercise(await request.json());
      if (!exercise.name) return json({ error: "Name is required" }, 400);
      await store.exercises.setJSON(exerciseKey(exercise.user, exercise.id), exercise);
      return json({ exercise });
    }

    if (resource === "exercise" && request.method === "DELETE") {
      assertUser(user);
      if (!id) return json({ error: "Id is required" }, 400);
      const key = exerciseKey(user, id);
      const current = await store.exercises.get(key, { type: "json" });
      if (current) {
        await store.exercises.setJSON(key, { ...current, isActive: false, updatedAt: now() });
      }
      return json({ ok: true });
    }

    if (resource === "goal" && request.method === "GET") {
      assertUser(user);
      return json({ goal: await store.goals.get(goalKey(user), { type: "json" }) });
    }

    if (resource === "goal" && request.method === "POST") {
      const goal = normalizeGoal(await request.json());
      await store.goals.setJSON(goalKey(goal.user), goal);
      return json({ goal });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json({ error: error.message || "Server error" }, 500);
  }
};
