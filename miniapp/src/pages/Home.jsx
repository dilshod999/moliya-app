import { useEffect, useState } from "react";
import { useAppContext } from "../App.jsx";
import { api } from "../api/client.js";

function formatMoney(amount, currency) {
  const formatted = Number(amount).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
  return currency === "USD" ? `$${formatted}` : `${formatted} so'm`;
}

export default function Home() {
  const { user, openAddSheet, refreshKey } = useAppContext();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const currency = user?.currency || "UZS";

  useEffect(() => {
    api.summary().then(setSummary).catch(console.error);
    api.transactions(5).then(setRecent).catch(console.error);
  }, [refreshKey]);

  return (
    <div className="screen">
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Xush kelibsiz,</p>
        <h1 style={{ fontSize: 22 }}>{user?.firstName || "Foydalanuvchi"} 👋</h1>
      </div>

      <div
        className="card"
        style={{ background: "var(--accent)", border: "none", color: "#fff", marginBottom: 16 }}
      >
        <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>Joriy oy balansi</p>
        <h2 style={{ fontSize: 30, marginBottom: 18 }}>
          {summary ? formatMoney(summary.balance, currency) : "…"}
        </h2>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <p style={{ opacity: 0.75, fontSize: 12 }}>Kirim</p>
            <p style={{ fontSize: 16, fontWeight: 700 }}>
              {summary ? formatMoney(summary.income, currency) : "…"}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ opacity: 0.75, fontSize: 12 }}>Chiqim</p>
            <p style={{ fontSize: 16, fontWeight: 700 }}>
              {summary ? formatMoney(summary.expense, currency) : "…"}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <button
          onClick={() => openAddSheet("EXPENSE")}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--expense-soft)",
            background: "var(--expense-soft)",
            color: "var(--expense)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          ➕ Chiqim
        </button>
        <button
          onClick={() => openAddSheet("INCOME")}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--income-soft)",
            background: "var(--income-soft)",
            color: "var(--income)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          📥 Kirim
        </button>
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>So'nggi amallar</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recent.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Hozircha amallar yo'q.</p>
        )}
        {recent.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-sm)",
                background: t.category.color + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {t.category.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{t.category.name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {new Date(t.date).toLocaleDateString("uz-UZ")}
              </p>
            </div>
            <p
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: t.type === "INCOME" ? "var(--income)" : "var(--expense)",
              }}
            >
              {t.type === "INCOME" ? "+" : "-"}
              {formatMoney(t.amount, currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
