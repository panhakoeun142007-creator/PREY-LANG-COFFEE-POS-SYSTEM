import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PaymentSettingsData } from "../services/api";

interface PaymentSettingsProps {
  value: PaymentSettingsData;
  onSave: (payload: PaymentSettingsData) => Promise<void>;
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

export default function PaymentSettings({ value, onSave, isSaving }: PaymentSettingsProps) {
  const [form, setForm] = useState<PaymentSettingsData>(value);
  const labelClass = (enabled: boolean) =>
    enabled ? "text-brand-text settings-label-on" : "text-brand-text settings-label-off";

  useEffect(() => {
    setForm(value);
  }, [value]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="payment-settings-panel bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-sm font-bold text-brand-text">Currency</h2>
          <p className="text-xs text-brand-muted mt-1">
            Configure your primary currency and local tax settings.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-[10px] font-bold text-brand-text mb-2 uppercase tracking-wide">
              Default Currency
            </label>
            <div className="relative">
              <select
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full bg-slate-50 border border-brand-border rounded-lg px-4 py-2.5 text-xs text-brand-text outline-none appearance-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="USD">USD - United States Dollar ($)</option>
                <option value="KHR">KHR - Cambodian Riel (៛)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
            </div>
          </div>
          <div>
          </div>
        </div>
      </section>

      <section className="payment-methods-section bg-white rounded-2xl border border-brand-border p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-sm font-bold text-brand-text">Payment Methods</h2>
          <p className="text-xs text-brand-muted mt-1">
            Enable or disable available payment options for customers.
          </p>
        </div>
        <div className="space-y-3">
          <div className="payment-method-row flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <h3 className={`payment-method-label text-lg font-semibold ${labelClass(form.cash_enabled)}`}>
              Cash Payment
            </h3>
            <Toggle
              checked={form.cash_enabled}
              onChange={(next) => setForm((prev) => ({ ...prev, cash_enabled: next }))}
            />
          </div>
          <div className="payment-method-row flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <h3 className={`payment-method-label text-lg font-semibold ${labelClass(form.credit_card_enabled)}`}>
              Credit Card
            </h3>
            <Toggle
              checked={form.credit_card_enabled}
              onChange={(next) => setForm((prev) => ({ ...prev, credit_card_enabled: next }))}
            />
          </div>
          <div className="payment-method-row flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <h3 className={`payment-method-label text-lg font-semibold ${labelClass(form.aba_pay_enabled)}`}>
              ABA Pay (KHQR)
            </h3>
            <Toggle
              checked={form.aba_pay_enabled}
              onChange={(next) => setForm((prev) => ({ ...prev, aba_pay_enabled: next }))}
            />
          </div>
          <div className="payment-method-row flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <h3 className={`payment-method-label text-lg font-semibold ${labelClass(form.wing_money_enabled)}`}>
              Wing Money
            </h3>
            <Toggle
              checked={form.wing_money_enabled}
              onChange={(next) => setForm((prev) => ({ ...prev, wing_money_enabled: next }))}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
       <button
          type="button"
          onClick={() => setForm(value)}
          disabled={isSaving}
          className="px-8 py-2.5 rounded-xl bg-[#5A2E26] text-white text-sm font-bold hover:bg-[#4a241d] transition-all disabled:opacity-60"
        >
          Discard Changes
        </button>
        <button
          type="button"
          onClick={() => void onSave(form)}
          disabled={isSaving}
          className="px-8 py-2.5 bg-[#5A2E26] rounded-xl bg-brand-primary text-white text-sm font-bold shadow-lg shadow-brand-primary/20 hover:opacity-90 transition-all disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
