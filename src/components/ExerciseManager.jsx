import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const blank = (user) => ({
  user,
  name: "",
  duration: "",
  unit: "分",
  isActive: true,
});

export function ExercisePanel({ user }) {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState(blank(user.id));
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api.listExercises(user.id, true).then(setItems).catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    setDraft(blank(user.id));
  }, [user.id]);

  const activeItems = items.filter((item) => item.isActive);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.saveExercise({
        ...draft,
        user: user.id,
        sortOrder: draft.sortOrder ?? activeItems.length + 1,
      });
      setMessage(editingId ? "運動項目を更新しました" : "運動項目を追加しました");
      setEditingId("");
      setDraft(blank(user.id));
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (item) => {
    setEditingId(item.id);
    setDraft(item);
  };

  const remove = async (id) => {
    if (!window.confirm("この運動項目を非表示にしますか？")) return;
    await api.deleteExercise(user.id, id);
    load();
  };

  return (
    <section className="person-panel stack" style={{ "--accent": user.color }}>
      <div className="person-heading">
        <p className="eyebrow">{user.label}</p>
      </div>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <form className="card exercise-form" onSubmit={submit}>
        <label className="field">
          <span>名前</span>
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="腹筋"
          />
        </label>
        <div className="form-row two">
          <label className="field">
            <span>時間</span>
            <input
              inputMode="numeric"
              type="number"
              value={draft.duration}
              onChange={(event) => setDraft({ ...draft, duration: event.target.value })}
              placeholder="3"
            />
          </label>
          <label className="field">
            <span>単位</span>
            <input
              value={draft.unit}
              onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
              placeholder="分"
            />
          </label>
        </div>
        <button className="primary-action compact" type="submit">
          {editingId ? "更新する" : "追加する"}
        </button>
      </form>

      <div className="history-list">
        {activeItems.map((item) => (
          <article className="history-item" key={item.id}>
            <div>
              <h2>{item.name}</h2>
              <p>
                {item.duration}
                {item.unit}
              </p>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => edit(item)}>
                編集
              </button>
              <button className="ghost-danger" type="button" onClick={() => remove(item.id)}>
                削除
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ExerciseManager({ users, embedded = false }) {
  const content = (
    <>
      <div className="page-title-row">
        <div>
          <h1>運動設定</h1>
        </div>
      </div>
      <div className="two-person-grid">
        {users.map((user) => (
          <ExercisePanel key={user.id} user={user} />
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="stack">
        <div className="two-person-grid">
          {users.map((user) => (
            <ExercisePanel key={user.id} user={user} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="page-pad stack">
      {content}
    </section>
  );
}
