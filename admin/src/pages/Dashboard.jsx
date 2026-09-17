import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { api } from "../api/client.js";

function formatMoney(amount) {
  return Number(amount).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    api.overview().then(setOverview).catch(console.error);
    api.monthlyTrend().then(setTrend).catch(console.error);
  }, []);

  const cards = [
    { label: "Foydalanuvchilar", value: overview?.usersCount, color: "var(--accent)" },
    { label: "Jami operatsiyalar", value: overview?.transactionsCount, color: "var(--text)" },
    { label: "Umumiy kirim", value: overview ? `${formatMoney(overview.totalIncome)} so'm` : null, color: "var(--income)" },
    { label: "Umumiy chiqim", value: overview ? `${formatMoney(overview.totalExpense)} so'm` : null, color: "var(--expense)" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Statistika</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{c.label}</p>
            <h2 style={{ fontSize: 22, color: c.color }}>{c.value ?? "…"}</h2>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Oxirgi 6 oy: kirim va chiqim</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${formatMoney(v)} so'm`} />
              <Legend />
              <Bar dataKey="income" name="Kirim" fill="#0ea5a0" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="Chiqim" fill="#f2542d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
