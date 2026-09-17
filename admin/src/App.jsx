import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Categories from "./pages/Categories.jsx";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("admin_key"));

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const logout = () => {
    localStorage.removeItem("admin_key");
    setLoggedIn(false);
  };

  return (
    <div className="layout">
      <Sidebar onLogout={logout} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </main>
    </div>
  );
}
