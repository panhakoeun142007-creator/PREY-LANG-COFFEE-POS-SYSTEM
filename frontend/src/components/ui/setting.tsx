import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import GeneralSettings from "../GeneralSettings";
import NotificationSettings from "../NotificationSettings";
import PaymentSettings from "../PaymentSettings";
import ReceiptSettings from "../ReceiptSettings";
import {
  updateSettings,
  GeneralSettingsData,
  NotificationSettingsData,
  PaymentSettingsData,
  ReceiptSettingsData,
} from "../../services/api";
import { useSettings } from "../../context/SettingsContext";

type TabType = "General" | "Notifications" | "Payment" | "Receipt";

interface SettingsPageProps {
  onSettingsSaved?: () => void;
}

const tabs: TabType[] = ["General", "Notifications", "Payment", "Receipt"];

export default function SettingsPage({ onSettingsSaved }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("General");
  const { settings, isLoading, error: loadError, setSettings, refreshSettings } = useSettings();
  const [error, setError] = useState<string | null>(null);
  const [savingTab, setSavingTab] = useState<TabType | null>(null);

  const mergedError = useMemo(() => error ?? loadError, [error, loadError]);

  async function saveGeneral(data: GeneralSettingsData) {
    try {
      setSavingTab("General");
      setError(null);
      const payload = await updateSettings({ general: data });
      setSettings(payload);
      onSettingsSaved?.();
      await refreshSettings();
      toast.success("General settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save general settings");
    } finally {
      setSavingTab(null);
    }
  }

  async function saveNotifications(data: NotificationSettingsData) {
    try {
      setSavingTab("Notifications");
      setError(null);
      const payload = await updateSettings({ notifications: data });
      setSettings(payload);
      onSettingsSaved?.();
      await refreshSettings();
      toast.success("Notification settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notification settings");
    } finally {
      setSavingTab(null);
    }
  }

  async function savePayment(data: PaymentSettingsData) {
    try {
      setSavingTab("Payment");
      setError(null);
      const payload = await updateSettings({ payment: data });
      setSettings(payload);
      onSettingsSaved?.();
      await refreshSettings();
      toast.success("Payment settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment settings");
    } finally {
      setSavingTab(null);
    }
  }

  async function saveReceipt(data: ReceiptSettingsData) {
    try {
      setSavingTab("Receipt");
      setError(null);
      const payload = await updateSettings({ receipt: data });
      setSettings(payload);
      onSettingsSaved?.();
      await refreshSettings();
      toast.success("Receipt settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt settings");
    } finally {
      setSavingTab(null);
    }
  }

  function renderContent() {
    switch (activeTab) {
      case "General":
        return (
          <GeneralSettings
            value={settings.general}
            onSave={saveGeneral}
            isSaving={savingTab === "General"}
          />
        );
      case "Notifications":
        return (
          <NotificationSettings
            value={settings.notifications}
            onSave={saveNotifications}
            isSaving={savingTab === "Notifications"}
          />
        );
      case "Payment":
        return (
          <PaymentSettings
            value={settings.payment}
            onSave={savePayment}
            isSaving={savingTab === "Payment"}
          />
        );
      case "Receipt":
        return (
          <ReceiptSettings
            value={settings.receipt}
            onSave={saveReceipt}
            isSaving={savingTab === "Receipt"}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2 text-[#4B2E2B] dark:text-white">Settings</h1>
        <p className="text-sm text-[#8E706B] dark:text-slate-400">Manage your shop settings, notifications, payment options, and receipts.</p>
      </div>

      <section className="rounded-2xl border border-[#EAD6C0] bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-[#4B2E2B] text-white shadow"
                  : "text-[#6E4F4A] hover:bg-[#F8EFE4]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 -z-10 rounded-xl bg-[#4B2E2B]"
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {mergedError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {mergedError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-6 text-sm text-[#7C5D58] shadow-sm">
          Loading settings...
        </div>
      ) : null}

      {!isLoading && settings ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
