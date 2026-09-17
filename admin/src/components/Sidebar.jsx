import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Statistika", icon: "📊" },
  { to: "/transactions", label: "Operatsiyalar", icon: "💳" },
  { to: "/categories", label: "Kategoriyalar", icon: "🏷️" },
];

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar" style={{ display: "flex", flexDirection: "column" }}>
      <h2 style={{ fontSize: 18, marginBottom: 28, padding: "0 8px" }}>Moliya Admin</h2>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              textDecoration: "none",
              color: isActive ? "var(--accent)" : "var(--text)",
              background: isActive ? "var(--accent-soft)" : "transparent",
              fontSize: 14,
              fontWeight: 600,
            })}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={onLogout}
        style={{
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          fontSize: 13,
          textAlign: "left",
          padding: "10px 12px",
        }}
      >
        Chiqish
      </button>
    </aside>
  );
}
