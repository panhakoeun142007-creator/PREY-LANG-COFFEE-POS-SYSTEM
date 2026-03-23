import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardPage from "./DashboardPage";
import LiveOrders from "./LiveOrders";
import OrderHistory from "./OrderHistory";
import ReceiptsPage from "./ReceiptsPage";
import { SettingsProvider } from "../context/SettingsContext";
import { logoutAdmin } from "../services/api";
import { auth } from "../utils/auth";
import LogoutConfirmModal from "../components/LogoutConfirmModal";

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(() => {
    const t = localStorage.getItem("theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  async function doLogout() {
    setShowLogoutConfirm(false);
    try { await logoutAdmin(); } catch { /* ignore */ }
    auth.clear();
    navigate("/login", { replace: true });
  }

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return <LiveOrders />;
      case "history":
        return (
          <SettingsProvider>
            <OrderHistory />
          </SettingsProvider>
        );
      case "receipts":
        return (
          <SettingsProvider>
            <ReceiptsPage />
          </SettingsProvider>
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        isDark={isDark}
        onThemeToggle={() => setIsDark((prev) => {
          const next = !prev;
          localStorage.setItem("theme", next ? "dark" : "light");
          return next;
        })}
      />

      <div className={`flex-1 ml-64 min-h-screen ${isDark ? "dark" : ""}`}>
        <main className="w-full p-4 md:p-6 lg:p-8 transition-colors duration-300">
          {renderContent()}
        </main>
      </div>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        isDarkMode={isDark}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
