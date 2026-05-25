import { ExercisePanel } from "./ExerciseManager.jsx";
import { GoalPanel } from "./GoalSettings.jsx";

export function SettingsView({ users }) {
  return (
    <section className="page-pad stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">nami / kaz</p>
          <h1>設定</h1>
        </div>
      </div>

      <div className="settings-user-list">
        {users.map((user) => (
          <section className="settings-user stack" id={`settings-${user.id}`} key={user.id}>
            <p className="eyebrow">{user.label}</p>
            <section className="settings-section stack">
              <h2>目標設定</h2>
              <GoalPanel user={user} />
            </section>
            <section className="settings-section stack">
              <h2>運動設定</h2>
              <ExercisePanel user={user} />
            </section>
          </section>
        ))}
      </div>
    </section>
  );
}
