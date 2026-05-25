import { useState } from "react";
import { GraphView } from "./components/GraphView.jsx";
import { HistoryView } from "./components/HistoryView.jsx";
import { TodayLogView } from "./components/TodayLogView.jsx";
import { SettingsView } from "./components/SettingsView.jsx";
import { USERS } from "./data/users.js";
import { todayString } from "./utils/date.js";

const views = [
  { key: "today", label: "今日" },
  { key: "history", label: "履歴" },
  { key: "graph", label: "グラフ" },
  { key: "settings", label: "設定" },
];

export default function App() {
  const [view, setView] = useState("today");
  const [activeDate, setActiveDate] = useState(todayString());
  const jumpPrefix = view === "settings" ? "settings" : view;

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
        <div className="header-jump-row" aria-label="ユーザー欄へ移動">
          {USERS.map((user) => (
            <a href={`#${jumpPrefix}-${user.id}`} key={user.id} style={{ "--accent": user.color }}>
              {user.id === "kaz" ? "kazu" : user.label}
            </a>
          ))}
        </div>
      </header>

      <main>
        {view === "today" && (
          <section className="page-pad stack">
            <div className="page-title-row">
              <div>
                <p className="eyebrow">nami / kaz</p>
                <h1>今日の記録</h1>
              </div>
              <div className="title-actions">
                <input type="date" value={activeDate} onChange={(event) => setActiveDate(event.target.value)} />
              </div>
            </div>
            <div className="two-person-grid">
              {USERS.map((user) => (
                <TodayLogView key={user.id} user={user.id} date={activeDate} panelId={`today-${user.id}`} />
              ))}
            </div>
          </section>
        )}
        {view === "history" && <HistoryView users={USERS} onEdit={editLog} />}
        {view === "graph" && <GraphView users={USERS} />}
        {view === "settings" && <SettingsView users={USERS} />}
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
