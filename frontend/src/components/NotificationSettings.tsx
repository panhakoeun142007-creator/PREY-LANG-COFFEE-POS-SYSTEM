import { useEffect, useState } from "react";
import type { NotificationSettingsData } from "../services/api";
import { Save } from "lucide-react";

interface NotificationSettingsProps {
  value: NotificationSettingsData;
  onSave: (payload: NotificationSettingsData) => Promise<void>;
  isSaving: boolean;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-colors ${
        checked ? "border-[#4A2721] bg-[#5A2E26]" : "border-slate-200 bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationSettings({
  value,
  onSave,
  isSaving,
}: NotificationSettingsProps) {
  const [form, setForm] = useState<NotificationSettingsData>(value);

  useEffect(() => {
    setForm(value);
  }, [value]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">Notification Settings</h1>
        <p className="text-brand-muted">Manage order, inventory, and report alerts.</p>
      </div>

      <section>
        <h3 className="text-lg font-bold text-brand-text mb-4">New Orders Channels</h3>
        <div className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border shadow-sm">
          <div className="p-5 flex items-center justify-between">
            <div>
              <h4 className={`font-bold ${form.new_orders_push ? "text-brand-text" : "text-red-600"}`}>Push</h4>
              <p className="text-xs text-brand-muted">In-app popup when new order arrives</p>
            </div>
            <Toggle
              checked={form.new_orders_push}
              onChange={(next) => setForm((prev) => ({ ...prev, new_orders_push: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <h4 className={`font-bold ${form.new_orders_email ? "text-brand-text" : "text-red-600"}`}>Email</h4>
              <p className="text-xs text-brand-muted">Send email for each new order</p>
            </div>
            <Toggle
              checked={form.new_orders_email}
              onChange={(next) => setForm((prev) => ({ ...prev, new_orders_email: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <h4 className={`font-bold ${form.new_orders_sound ? "text-brand-text" : "text-red-600"}`}>Sound</h4>
              <p className="text-xs text-brand-muted">Play sound on new order</p>
            </div>
            <Toggle
              checked={form.new_orders_sound}
              onChange={(next) => setForm((prev) => ({ ...prev, new_orders_sound: next }))}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-brand-text mb-4">Operational Alerts</h3>
        <div className="bg-white rounded-2xl border border-brand-border divide-y divide-brand-border shadow-sm">
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${form.ready_for_pickup ? "text-brand-text" : "text-red-600"}`}>Ready for Pickup</span>
            <Toggle
              checked={form.ready_for_pickup}
              onChange={(next) => setForm((prev) => ({ ...prev, ready_for_pickup: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${form.cancelled_orders ? "text-brand-text" : "text-red-600"}`}>Cancelled Orders</span>
            <Toggle
              checked={form.cancelled_orders}
              onChange={(next) => setForm((prev) => ({ ...prev, cancelled_orders: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${form.low_stock_warning ? "text-brand-text" : "text-red-600"}`}>Low Stock Warning</span>
            <Toggle
              checked={form.low_stock_warning}
              onChange={(next) => setForm((prev) => ({ ...prev, low_stock_warning: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${form.out_of_stock ? "text-brand-text" : "text-red-600"}`}>Out of Stock</span>
            <Toggle
              checked={form.out_of_stock}
              onChange={(next) => setForm((prev) => ({ ...prev, out_of_stock: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${form.daily_summary ? "text-brand-text" : "text-red-600"}`}>Daily Summary</span>
            <Toggle
              checked={form.daily_summary}
              onChange={(next) => setForm((prev) => ({ ...prev, daily_summary: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${form.weekly_performance ? "text-brand-text" : "text-red-600"}`}>Weekly Performance</span>
            <Toggle
              checked={form.weekly_performance}
              onChange={(next) => setForm((prev) => ({ ...prev, weekly_performance: next }))}
            />
          </div>
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-brand-border flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setForm(value)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl border border-[#5A2E26] text-[#5A2E26] font-bold text-sm hover:bg-[#5A2E26] hover:text-white transition-colors disabled:opacity-60"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={() => void onSave(form)}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-[#5A2E26] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg disabled:opacity-60 flex items-center gap-2"
        >
          {isSaving ? "Saving..." : (
            <>
              <Save size={16} />
              Save Notifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}
