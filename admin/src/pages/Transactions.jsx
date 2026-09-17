import { useEffect, useState } from "react";
import { api } from "../api/client.js";

function formatMoney(amount) {
  return Number(amount).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

export default function Transactions() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 20 });

  const load = (page) => api.transactions(page).then(setData).catch(console.error);

  useEffect(() => {
    load(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Operatsiyalar</h1>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Turi</th>
              <th>Kategoriya</th>
              <th>Summa</th>
              <th>Izoh</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((t) => (
              <tr key={t.id}>
                <td>{t.user.name}</td>
                <td style={{ color: t.type === "INCOME" ? "var(--income)" : "var(--expense)" }}>
                  {t.type === "INCOME" ? "Kirim" : "Chiqim"}
                </td>
                <td>
                  {t.category.icon} {t.category.name}
                </td>
                <td style={{ fontWeight: 700 }}>{formatMoney(t.amount)} so'm</td>
                <td style={{ color: "var(--text-muted)" }}>{t.note || "—"}</td>
                <td>{new Date(t.date).toLocaleDateString("uz-UZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        <button
          disabled={data.page <= 1}
          onClick={() => load(data.page - 1)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "#fff" }}
        >
          Oldingi
        </button>
        <span style={{ padding: "8px 12px", fontSize: 13, color: "var(--text-muted)" }}>
          {data.page} / {totalPages}
        </span>
        <button
          disabled={data.page >= totalPages}
          onClick={() => load(data.page + 1)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "#fff" }}
        >
          Keyingi
        </button>
      </div>
    </div>
  );
}
