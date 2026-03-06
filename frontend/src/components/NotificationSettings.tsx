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
      className={`settings-toggle relative h-7 w-14 rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#5A2E26] ${
        checked
          ? "border-[#5A2E26] bg-[#5A2E26] shadow-[0_3px_10px_rgba(90,46,38,0.25)]"
          : "border-[#C9D1E2] bg-[#E5EAF3]"
      }`}
    >
      <span
        className={`settings-toggle-thumb absolute top-0.5 h-6 w-6 rounded-full border border-[#DCE3F1] bg-[#0E1E4A] shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-7 left-0.5" : "translate-x-0 left-0.5"
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
  const labelClass = (enabled: boolean) =>
    enabled ? "text-brand-text settings-label-on" : "text-brand-text settings-label-off";

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
              <h4 className={`font-bold ${labelClass(form.new_orders_push)}`}>Push</h4>
              <p className="text-xs text-brand-muted">In-app popup when new order arrives</p>
            </div>
            <Toggle
              checked={form.new_orders_push}
              onChange={(next) => setForm((prev) => ({ ...prev, new_orders_push: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <h4 className={`font-bold ${labelClass(form.new_orders_email)}`}>Email</h4>
              <p className="text-xs text-brand-muted">Send email for each new order</p>
            </div>
            <Toggle
              checked={form.new_orders_email}
              onChange={(next) => setForm((prev) => ({ ...prev, new_orders_email: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <h4 className={`font-bold ${labelClass(form.new_orders_sound)}`}>Sound</h4>
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
            <span className={`font-bold ${labelClass(form.ready_for_pickup)}`}>Ready for Pickup</span>
            <Toggle
              checked={form.ready_for_pickup}
              onChange={(next) => setForm((prev) => ({ ...prev, ready_for_pickup: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${labelClass(form.cancelled_orders)}`}>Cancelled Orders</span>
            <Toggle
              checked={form.cancelled_orders}
              onChange={(next) => setForm((prev) => ({ ...prev, cancelled_orders: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${labelClass(form.low_stock_warning)}`}>Low Stock Warning</span>
            <Toggle
              checked={form.low_stock_warning}
              onChange={(next) => setForm((prev) => ({ ...prev, low_stock_warning: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${labelClass(form.out_of_stock)}`}>Out of Stock</span>
            <Toggle
              checked={form.out_of_stock}
              onChange={(next) => setForm((prev) => ({ ...prev, out_of_stock: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${labelClass(form.daily_summary)}`}>Daily Summary</span>
            <Toggle
              checked={form.daily_summary}
              onChange={(next) => setForm((prev) => ({ ...prev, daily_summary: next }))}
            />
          </div>
          <div className="p-5 flex items-center justify-between">
            <span className={`font-bold ${labelClass(form.weekly_performance)}`}>Weekly Performance</span>
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
