const API_BASE = "/.netlify/functions/api";

async function request(params, options = {}) {
  const search = new URLSearchParams(params);
  const response = await fetch(`${API_BASE}?${search}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "通信に失敗しました");
  }
  return data;
}

export const api = {
  async getDailyLog(user, date) {
    const data = await request({ resource: "log", user, date });
    return data.log;
  },

  async saveDailyLog(log) {
    const data = await request(
      { resource: "log" },
      { method: "POST", body: JSON.stringify(log) },
    );
    return data.log;
  },

  async listLogs(user) {
    const data = await request({ resource: "logs", user });
    return data.logs;
  },

  async deleteLog(user, date) {
    return request({ resource: "log", user, date }, { method: "DELETE" });
  },

  async listExercises(user, includeInactive = false) {
    const data = await request({ resource: "exercises", user, includeInactive });
    return data.exercises;
  },

  async saveExercise(exercise) {
    const data = await request(
      { resource: "exercise" },
      { method: "POST", body: JSON.stringify(exercise) },
    );
    return data.exercise;
  },

  async deleteExercise(user, id) {
    return request({ resource: "exercise", user, id }, { method: "DELETE" });
  },
};
