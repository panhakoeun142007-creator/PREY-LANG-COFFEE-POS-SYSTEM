import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import GeneralSettings from "../GeneralSettings";
import NotificationSettings from "../NotificationSettings";
import PaymentSettings from "../PaymentSettings";
import ReceiptSettings from "../ReceiptSettings";
import {
  AppSettings,
  fetchSettings,
  updateSettings,
  GeneralSettingsData,
  NotificationSettingsData,
  PaymentSettingsData,
  ReceiptSettingsData,
} from "../../services/api";

type TabType = "General" | "Notifications" | "Payment" | "Receipt";

interface SettingsPageProps {
  onSettingsSaved?: () => void;
}

const tabs: TabType[] = ["General", "Notifications", "Payment", "Receipt"];

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    shop_name: "Prey Lang Coffee Roastery",
    address: "123 Samdach Sihanouk Blvd, Phnom Penh, Cambodia",
    phone: "+855 23 123 456",
    email: "hello@preylangcoffee.com",
  },
  notifications: {
    new_orders_push: true,
    new_orders_email: false,
    new_orders_sound: true,
    ready_for_pickup: true,
    cancelled_orders: true,
    low_stock_warning: true,
    out_of_stock: true,
    daily_summary: true,
    weekly_performance: true,
  },
  payment: {
    currency: "USD",
    tax_rate: 10,
    cash_enabled: true,
    credit_card_enabled: true,
    aba_pay_enabled: true,
    wing_money_enabled: false,
  },
  receipt: {
    shop_name: "Prey Lang Coffee",
    address: "St. 214, Phnom Penh, Cambodia",
    phone: "+855 12 345 678",
    tax_id: "",
    footer_message:
      "Thank you for visiting! We hope you enjoyed your organic coffee. Save this receipt for a 5% discount on your next visit.",
    show_logo: true,
    show_qr_payment: true,
    show_order_number: true,
    show_customer_name: false,
  },
};

export default function SettingsPage({ onSettingsSaved }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("General");
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingTab, setSavingTab] = useState<TabType | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const payload = await Promise.race([
        fetchSettings(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Settings request timed out")), 8000);
        }),
      ]);
      setSettings(payload);
    } catch (err) {
      setSettings(DEFAULT_SETTINGS);
      setError(
        err instanceof Error
          ? `${err.message}. Showing local defaults.`
          : "Failed to load settings. Showing local defaults.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveGeneral(data: GeneralSettingsData) {
    try {
      setSavingTab("General");
      setError(null);
      const payload = await updateSettings({ general: data });
      setSettings(payload);
      onSettingsSaved?.();
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
      toast.success("Receipt settings saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt settings");
    } finally {
      setSavingTab(null);
    }
  }

  function renderContent() {
    if (!settings) {
      return null;
    }

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

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-[#EAD6C0] bg-white p-6 text-sm text-[#7C5D58] shadow-sm">
          Loading settings...
        </div>
      ) : null}

      {!loading && settings ? (
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
