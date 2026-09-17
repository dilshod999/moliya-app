import { useState } from "react";

export default function Login({ onLogin }) {
  const [key, setKey] = useState("");

  const submit = (e) => {
    e.preventDefault();
    localStorage.setItem("admin_key", key);
    onLogin();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <form onSubmit={submit} className="card" style={{ width: 340 }}>
        <h2 style={{ fontSize: 20, marginBottom: 6 }}>Admin Panel</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 18 }}>
          Backend .env faylidagi ADMIN_API_KEY qiymatini kiriting.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin kaliti"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            marginBottom: 14,
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          Kirish
        </button>
      </form>
    </div>
  );
}
