import { useEffect, useState } from "react";
import { useAppContext } from "../App.jsx";
import { api } from "../api/client.js";

function formatMoney(amount, currency) {
  const formatted = Number(amount).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
  return currency === "USD" ? `$${formatted}` : `${formatted} so'm`;
}

export default function History() {
  const { user, refreshKey, bumpRefresh } = useAppContext();
  const [transactions, setTransactions] = useState([]);
  const currency = user?.currency || "UZS";

  const load = () => api.transactions().then(setTransactions).catch(console.error);

  useEffect(() => {
    load();
  }, [refreshKey]);

  const handleDelete = async (id) => {
    await api.deleteTransaction(id);
    bumpRefresh();
  };

  const grouped = transactions.reduce((acc, t) => {
    const key = new Date(t.date).toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
    acc[key] = acc[key] || [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="screen">
      <h1 style={{ fontSize: 22, marginBottom: 18 }}>Tarix</h1>

      {transactions.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Hali hech qanday amal kiritilmagan.</p>
      )}

      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{day}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((t) => (
              <div key={t.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "var(--radius-sm)",
                    background: t.category.color + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 17,
                  }}
                >
                  {t.category.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{t.category.name}</p>
                  {t.note && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.note}</p>}
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
                <button
                  onClick={() => handleDelete(t.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: 16,
                    padding: "4px 6px",
                  }}
                  aria-label="O'chirish"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
