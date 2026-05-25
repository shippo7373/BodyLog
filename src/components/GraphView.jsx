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

export function GraphView({ users }) {
  const [logsByUser, setLogsByUser] = useState({});
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all(users.map((user) => api.listLogs(user.id).then((logs) => [user.id, logs])))
      .then((entries) => setLogsByUser(Object.fromEntries(entries)))
      .catch((err) => setError(err.message));
  }, [users]);

  const data = useMemo(() => {
    const rows = new Map();
    users.forEach((user) => {
      (logsByUser[user.id] || [])
        .filter((log) => log.weight !== "" && log.weight != null)
        .filter((log) => filter === "all" || log.weightTiming === filter)
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
  }, [logsByUser, filter, users]);

  return (
    <section className="page-pad stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">nami / kaz</p>
          <h1>Weight graph</h1>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
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
    </section>
  );
}
