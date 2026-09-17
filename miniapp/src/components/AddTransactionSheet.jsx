import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function AddTransactionSheet({ initialType, onClose, onSaved }) {
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCategoryId(null);
    api
      .categories(type)
      .then((cats) => {
        setCategories(cats);
        if (cats[0]) setCategoryId(cats[0].id);
      })
      .catch(console.error);
  }, [type]);

  const handleSave = async () => {
    setError(null);
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) return setError("Summani to'g'ri kiriting");
    if (!categoryId) return setError("Kategoriyani tanlang");

    setSaving(true);
    try {
      await api.addTransaction({ amount: numeric, type, categoryId, note: note || undefined });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,24,31,0.4)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 18px" }} />

        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button
            onClick={() => setType("EXPENSE")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: "var(--radius-pill)",
              border: "1px solid " + (type === "EXPENSE" ? "var(--expense)" : "var(--border)"),
              background: type === "EXPENSE" ? "var(--expense-soft)" : "transparent",
              color: type === "EXPENSE" ? "var(--expense)" : "var(--text-muted)",
              fontWeight: 700,
            }}
          >
            Chiqim
          </button>
          <button
            onClick={() => setType("INCOME")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: "var(--radius-pill)",
              border: "1px solid " + (type === "INCOME" ? "var(--income)" : "var(--border)"),
              background: type === "INCOME" ? "var(--income-soft)" : "transparent",
              color: type === "INCOME" ? "var(--income)" : "var(--text-muted)",
              fontWeight: 700,
            }}
          >
            Kirim
          </button>
        </div>

        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          style={{
            width: "100%",
            fontSize: 34,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            border: "none",
            outline: "none",
            textAlign: "center",
            marginBottom: 18,
            color: "var(--text)",
          }}
        />

        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Kategoriya</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid " + (categoryId === c.id ? c.color : "var(--border)"),
                background: categoryId === c.id ? c.color + "1a" : "transparent",
                color: categoryId === c.id ? c.color : "var(--text)",
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Izoh (ixtiyoriy)"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            marginBottom: 14,
            fontSize: 14,
          }}
        />

        {error && <p style={{ color: "var(--expense)", fontSize: 13, marginBottom: 10 }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            fontFamily: "var(--font-display)",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
