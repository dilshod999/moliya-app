import { useEffect, useState, createContext, useContext } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Onboarding from "./pages/Onboarding.jsx";
import Home from "./pages/Home.jsx";
import Analytics from "./pages/Analytics.jsx";
import History from "./pages/History.jsx";
import Profile from "./pages/Profile.jsx";
import BottomNav from "./components/BottomNav.jsx";
import AddTransactionSheet from "./components/AddTransactionSheet.jsx";
import { api } from "./api/client.js";

export const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

const ONBOARDING_KEY = "moliya_onboarding_done";

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem(ONBOARDING_KEY) === "1"
  );
  const [user, setUser] = useState(null);
  const [sheet, setSheet] = useState({ open: false, type: "EXPENSE" });
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (onboardingDone) {
      api.me().then(setUser).catch(console.error);
    }
  }, [onboardingDone]);

  const finishOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOnboardingDone(true);
    navigate("/");
  };

  const openAddSheet = (type = "EXPENSE") => setSheet({ open: true, type });
  const closeAddSheet = () => setSheet({ open: false, type: "EXPENSE" });
  const bumpRefresh = () => setRefreshKey((k) => k + 1);

  if (!onboardingDone) {
    return <Onboarding onFinish={finishOnboarding} />;
  }

  const showNav = ["/", "/analytics", "/history", "/profile"].includes(location.pathname);

  return (
    <AppContext.Provider value={{ user, setUser, openAddSheet, refreshKey, bumpRefresh }}>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        {showNav && <BottomNav />}
        {sheet.open && (
          <AddTransactionSheet
            initialType={sheet.type}
            onClose={closeAddSheet}
            onSaved={() => {
              closeAddSheet();
              bumpRefresh();
            }}
          />
        )}
      </div>
    </AppContext.Provider>
  );
}
