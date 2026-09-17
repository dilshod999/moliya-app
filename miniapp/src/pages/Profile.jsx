import { useState } from "react";
import { useAppContext } from "../App.jsx";
import { api } from "../api/client.js";

export default function Profile() {
  const { user, setUser } = useAppContext();
  const [exporting, setExporting] = useState(false);

  const handleCurrencyChange = async (currency) => {
    const res = await api.setCurrency(currency);
    setUser((u) => ({ ...u, currency: res.currency }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(api.exportCsvUrl(), {
        headers: { "x-telegram-init-data": window.Telegram?.WebApp?.initData || "DEV_MODE" },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tarix.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="screen">
      <h1 style={{ fontSize: 22, marginBottom: 18 }}>Profil</h1>

      <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            margin: "0 auto 10px",
          }}
        >
          {(user?.firstName || "F")[0]}
        </div>
        <h3 style={{ fontSize: 17 }}>{user?.firstName || "Foydalanuvchi"}</h3>
        {user?.username && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>@{user.username}</p>}
      </div>

      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Valyuta</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["UZS", "USD"].map((c) => (
          <button
            key={c}
            onClick={() => handleCurrencyChange(c)}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: "var(--radius-md)",
              border: "1px solid " + (user?.currency === c ? "var(--accent)" : "var(--border)"),
              background: user?.currency === c ? "var(--accent-soft)" : "transparent",
              color: user?.currency === c ? "var(--accent)" : "var(--text)",
              fontWeight: 700,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="card"
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
          border: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 20 }}>📤</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Ma'lumotlarni eksport qilish</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {exporting ? "Tayyorlanmoqda…" : "CSV formatida yuklab olish (Excel'da ochiladi)"}
          </p>
        </div>
      </button>

      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>❓</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Yordam</p>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Savollar bo'lsa, botga yozing: /help</p>
        </div>
      </div>
    </div>
  );
}
