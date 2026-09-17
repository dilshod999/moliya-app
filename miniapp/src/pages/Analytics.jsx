import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAppContext } from "../App.jsx";
import { api } from "../api/client.js";

function formatMoney(amount, currency) {
  const formatted = Number(amount).toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
  return currency === "USD" ? `$${formatted}` : `${formatted} so'm`;
}

export default function Analytics() {
  const { user, refreshKey } = useAppContext();
  const [data, setData] = useState([]);
  const currency = user?.currency || "UZS";
  const total = data.reduce((s, d) => s + d.amount, 0);

  useEffect(() => {
    api.byCategory().then(setData).catch(console.error);
  }, [refreshKey]);

  return (
    <div className="screen">
      <h1 style={{ fontSize: 22, marginBottom: 18 }}>Tahlil</h1>

      <div className="card" style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>Bu oy jami xarajat</p>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>{formatMoney(total, currency)}</h2>

        {data.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Bu oy uchun xarajatlar hali yo'q.</p>
        ) : (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={3}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(value, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 10 }}>Eng ko'p xarajat qilingan toifalar</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((d) => (
          <div key={d.categoryId} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: d.color + "22",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              {d.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{d.name}</p>
              <div style={{ height: 5, background: "var(--surface)", borderRadius: 99, marginTop: 6 }}>
                <div
                  style={{
                    width: `${total ? (d.amount / total) * 100 : 0}%`,
                    height: "100%",
                    background: d.color,
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700 }}>{formatMoney(d.amount, currency)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
