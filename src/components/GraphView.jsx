import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WEIGHT_TIMINGS } from "../data/users.js";
import { api } from "../services/api.js";

const filters = [
  { value: "all", label: "全て" },
  { value: "beforeDinner", label: "夕食前のみ" },
  { value: "afterDinner", label: "夕食後のみ" },
];

const ranges = [
  { value: "1m", label: "1か月", months: 1 },
  { value: "3m", label: "3か月", months: 3 },
  { value: "6m", label: "6か月", months: 6 },
  { value: "all", label: "全て", months: null },
];

const rangeStartDate = (rangeValue) => {
  const range = ranges.find((item) => item.value === rangeValue);
  if (!range?.months) return "";
  const date = new Date();
  date.setMonth(date.getMonth() - range.months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const daysBefore = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const latestOnOrBefore = (logs, dateValue) =>
  logs
    .filter((log) => log.weight !== "" && log.weight != null)
    .filter((log) => log.date <= dateValue)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

const diffText = (current, previous) => {
  if (!current || !previous) return "-";
  const diff = Number(current.weight) - Number(previous.weight);
  if (!Number.isFinite(diff)) return "-";
  if (diff === 0) return "±0.0kg";
  return `${diff > 0 ? "+" : ""}${diff.toFixed(1)}kg`;
};

export function GraphView({ users }) {
  const [logsByUser, setLogsByUser] = useState({});
  const [filter, setFilter] = useState("all");
  const [range, setRange] = useState("1m");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all(users.map((user) => api.listLogs(user.id).then((logs) => [user.id, logs])))
      .then((entries) => setLogsByUser(Object.fromEntries(entries)))
      .catch((err) => setError(err.message));
  }, [users]);

  const data = useMemo(() => {
    const rows = new Map();
    const startDate = rangeStartDate(range);
    users.forEach((user) => {
      (logsByUser[user.id] || [])
        .filter((log) => log.weight !== "" && log.weight != null)
        .filter((log) => filter === "all" || log.weightTiming === filter)
        .filter((log) => !startDate || log.date >= startDate)
        .forEach((log) => {
          const row = rows.get(log.date) || { rawDate: log.date, date: log.date.slice(5) };
          row[user.id] = Number(log.weight);
          row[`${user.id}Timing`] = WEIGHT_TIMINGS.find(
            (item) => item.value === log.weightTiming,
          )?.label;
          rows.set(log.date, row);
        });
    });
    return Array.from(rows.values()).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [logsByUser, filter, range, users]);

  const latestByUser = useMemo(() => {
    return Object.fromEntries(
      users.map((user) => {
        const logs = logsByUser[user.id] || [];
        const latest = logs
          .filter((log) => log.weight !== "" && log.weight != null)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        const previousDay = latest ? latestOnOrBefore(logs, daysBefore(latest.date, 1)) : null;
        const previousWeek = latest ? latestOnOrBefore(logs, daysBefore(latest.date, 7)) : null;
        return [user.id, { latest, previousDay, previousWeek }];
      }),
    );
  }, [logsByUser, users]);

  return (
    <section className="page-pad stack">
      <div className="page-title-row">
        <div>
          <h1>体重グラフ</h1>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="chip-row">
        {ranges.map((item) => (
          <button
            className={range === item.value ? "chip selected" : "chip"}
            key={item.value}
            type="button"
            onClick={() => setRange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {filters.map((item) => (
          <button
            className={filter === item.value ? "chip selected" : "chip"}
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="card graph-card">
        {data.length === 0 ? (
          <p className="empty-text">体重を記録するとグラフになります。</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="#f1e8ef" strokeDasharray="4 4" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tickLine={false} axisLine={false} />
              <Tooltip />
              {users.map((user) => (
                <Line
                  key={user.id}
                  type="monotone"
                  dataKey={user.id}
                  name={user.label}
                  stroke={user.color}
                  strokeWidth={3}
                  connectNulls
                  dot={{ r: 4, fill: user.color }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>
      <div className="two-person-grid">
        {users.map((user) => {
          const summary = latestByUser[user.id];
          const latest = summary?.latest;
          return (
            <section
              className="person-panel graph-user-summary"
              id={`graph-${user.id}`}
              key={user.id}
              style={{ "--accent": user.color }}
            >
              <p className="eyebrow">{user.label}</p>
              <div className="graph-weight-row">
                <h2>{latest ? `${latest.weight} kg` : "-"}</h2>
                <div>
                  <span>前日比 {diffText(latest, summary?.previousDay)}</span>
                  <span>1週間前比 {diffText(latest, summary?.previousWeek)}</span>
                </div>
              </div>
              <p>{latest ? latest.date : "まだ体重記録がありません"}</p>
            </section>
          );
        })}
      </div>
    </section>
  );
}
