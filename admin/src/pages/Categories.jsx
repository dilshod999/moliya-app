import { useEffect, useState } from "react";
import { api } from "../api/client.js";

const emptyForm = { name: "", type: "EXPENSE", icon: "🏷️", color: "#4F46E5" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.categories().then(setCategories).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await api.updateCategory(editingId, form);
    } else {
      await api.createCategory(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, type: c.type, icon: c.icon, color: c.color });
  };

  const remove = async (id) => {
    if (!confirm("Kategoriyani o'chirishni tasdiqlaysizmi? Unga bog'liq amallar ham o'chadi.")) return;
    await api.deleteCategory(id);
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Kategoriyalar</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table>
            <thead>
              <tr>
                <th>Ikonka</th>
                <th>Nomi</th>
                <th>Turi</th>
                <th>Rang</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: 18 }}>{c.icon}</td>
                  <td>{c.name}</td>
                  <td>{c.type === "INCOME" ? "Kirim" : "Chiqim"}</td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: c.color,
                        verticalAlign: "middle",
                      }}
                    />
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(c)} style={{ border: "none", background: "transparent", color: "var(--accent)" }}>
                      Tahrirlash
                    </button>
                    <button onClick={() => remove(c.id)} style={{ border: "none", background: "transparent", color: "var(--expense)" }}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={submit} className="card">
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>{editingId ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</h3>

          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Nomi</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          />

          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Turi</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          >
            <option value="EXPENSE">Chiqim</option>
            <option value="INCOME">Kirim</option>
          </select>

          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Ikonka (emoji)</label>
          <input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          />

          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Rang</label>
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            style={{ width: "100%", height: 40, marginBottom: 16, borderRadius: 8, border: "1px solid var(--border)" }}
          />

          <button
            type="submit"
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 700 }}
          >
            {editingId ? "Saqlash" : "Qo'shish"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              style={{ width: "100%", padding: 10, marginTop: 8, borderRadius: 8, border: "1px solid var(--border)", background: "transparent" }}
            >
              Bekor qilish
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
