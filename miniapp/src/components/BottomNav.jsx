import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Bosh sahifa", icon: "🏠" },
  { to: "/analytics", label: "Tahlil", icon: "📊" },
  { to: "/history", label: "Tarix", icon: "📜" },
  { to: "/profile", label: "Profil", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "6px 0",
            textDecoration: "none",
            color: isActive ? "var(--accent)" : "var(--text-muted)",
          })}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
