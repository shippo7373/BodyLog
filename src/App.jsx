import { useState } from "react";
import { GraphView } from "./components/GraphView.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
import { TodayLogView } from "./components/TodayLogView.jsx";
import { ExerciseManager } from "./components/ExerciseManager.jsx";
import { USERS } from "./data/users.js";
import { todayString } from "./utils/date.js";

const views = [
  { key: "today", label: "Today" },
  { key: "history", label: "History" },
  { key: "graph", label: "Graph" },
  { key: "exercises", label: "Exercise" },
];

export default function App() {
  const [view, setView] = useState("today");
  const [activeDate, setActiveDate] = useState(todayString());

  const openToday = () => {
    setActiveDate(todayString());
    setView("today");
  };

  const editLog = (date) => {
    setActiveDate(date);
    setView("today");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" type="button" onClick={openToday}>
          <strong>BodyLog</strong>
        </button>
        <div className="user-pair" aria-label="表示中のユーザー">
          {USERS.map((user) => (
            <span key={user.id} style={{ "--accent": user.color }}>
              {user.label}
            </span>
          ))}
        </div>
      </header>

      <main>
        {view === "today" && (
          <section className="page-pad stack">
            <div className="page-title-row">
              <div>
                <p className="eyebrow">nami / kaz</p>
                <h1>Daily log</h1>
              </div>
              <input type="date" value={activeDate} onChange={(event) => setActiveDate(event.target.value)} />
            </div>
            <div className="two-person-grid">
              {USERS.map((user) => (
                <TodayLogView key={user.id} user={user.id} date={activeDate} />
              ))}
            </div>
          </section>
        )}
        {view === "history" && <HistoryView users={USERS} onEdit={editLog} />}
        {view === "graph" && <GraphView users={USERS} />}
        {view === "exercises" && <ExerciseManager users={USERS} />}
      </main>

      <nav className="bottom-nav" aria-label="メイン">
        {views.map((item) => (
          <button
            className={view === item.key ? "active" : ""}
            key={item.key}
            type="button"
            onClick={() => setView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
