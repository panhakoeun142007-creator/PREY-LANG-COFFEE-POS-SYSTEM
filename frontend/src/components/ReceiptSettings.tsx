import { useEffect, useState } from "react";
import { FileText, QrCode, Store, UserRound } from "lucide-react";
import type { ReceiptSettingsData } from "../services/api";

interface ReceiptSettingsProps {
  value: ReceiptSettingsData;
  onSave: (payload: ReceiptSettingsData) => Promise<void>;
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
        checked ? "border-[#4A2721] bg-[#5A2E26]" : "border-[#D9CBB7] bg-[#D9CBB7]"
      }`}
    >
      <span
        className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#EAD6C0] bg-[#FFFBF7] px-4 py-3">
      <div className="pr-4">
        <p className={`text-sm font-semibold ${checked ? "text-[#4B2E2B]" : "text-red-600"}`}>{title}</p>
        <p className="text-xs text-[#8E706B]">{subtitle}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function ReceiptSettings({ value, onSave, isSaving }: ReceiptSettingsProps) {
  const [form, setForm] = useState<ReceiptSettingsData>(value);

  useEffect(() => {
    setForm(value);
  }, [value]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-7">
        <section className="rounded-2xl border border-[#EAD6C0] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#F8EFE4] p-2.5 text-[#4B2E2B]">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#4B2E2B]">Receipt Header</h2>
              <p className="text-xs text-[#8E706B]">Configure business information printed on each receipt.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8E706B]">
                Shop Name
              </label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => setForm((prev) => ({ ...prev, shop_name: e.target.value }))}
                className="w-full rounded-xl border border-[#EAD6C0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4B2E2B] outline-none transition focus:border-[#4B2E2B] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8E706B]">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full rounded-xl border border-[#EAD6C0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4B2E2B] outline-none transition focus:border-[#4B2E2B] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8E706B]">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-xl border border-[#EAD6C0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4B2E2B] outline-none transition focus:border-[#4B2E2B] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8E706B]">
                  Tax ID
                </label>
                <input
                  type="text"
                  value={form.tax_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, tax_id: e.target.value }))}
                  className="w-full rounded-xl border border-[#EAD6C0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4B2E2B] outline-none transition focus:border-[#4B2E2B] focus:bg-white"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8E706B]">
                Footer Message
              </label>
              <textarea
                rows={4}
                value={form.footer_message}
                onChange={(e) => setForm((prev) => ({ ...prev, footer_message: e.target.value }))}
                className="w-full resize-none rounded-xl border border-[#EAD6C0] bg-[#FFFBF7] px-4 py-3 text-sm text-[#4B2E2B] outline-none transition focus:border-[#4B2E2B] focus:bg-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAD6C0] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#F8EFE4] p-2.5 text-[#4B2E2B]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#4B2E2B]">Print Configuration</h2>
              <p className="text-xs text-[#8E706B]">Choose what details appear on the printed receipt.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SettingRow
              title="Show Shop Logo"
              subtitle="Include logo at the top"
              checked={form.show_logo}
              onChange={(next) => setForm((prev) => ({ ...prev, show_logo: next }))}
            />
            <SettingRow
              title="Show QR Payment"
              subtitle="Display scan-to-pay QR"
              checked={form.show_qr_payment}
              onChange={(next) => setForm((prev) => ({ ...prev, show_qr_payment: next }))}
            />
            <SettingRow
              title="Show Order Number"
              subtitle="Print order number section"
              checked={form.show_order_number}
              onChange={(next) => setForm((prev) => ({ ...prev, show_order_number: next }))}
            />
            <SettingRow
              title="Show Customer Name"
              subtitle="If customer information exists"
              checked={form.show_customer_name}
              onChange={(next) => setForm((prev) => ({ ...prev, show_customer_name: next }))}
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm(value)}
            disabled={isSaving}
            className="rounded-xl border border-[#EAD6C0] bg-white px-5 py-2.5 text-sm font-semibold text-[#6E4F4A] transition hover:bg-[#FFFBF7]"
          >
            Discard Changes
          </button>
          <button
            type="button"
            onClick={() => void onSave(form)}
            disabled={isSaving}
            className="rounded-xl bg-[#4B2E2B] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#6B4E4B] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Receipt Settings"}
          </button>
        </div>
      </div>

      <aside className="xl:col-span-5">
        <div className="sticky top-6 rounded-2xl border border-[#EAD6C0] bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8E706B]">Live Preview</h3>
            {form.show_qr_payment ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F8EFE4] px-2.5 py-1 text-[11px] font-semibold text-[#6E4F4A]">
                <QrCode className="h-3.5 w-3.5" />
                QR On
              </span>
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-[360px] rounded-md border border-dashed border-[#EAD6C0] bg-[#FFFBF7] p-4">
            <div className="rounded bg-white px-5 py-5 shadow-sm">
              {form.show_logo ? (
                <div className="mb-3 flex justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4B2E2B] text-white">
                    <Store className="h-5 w-5" />
                  </div>
                </div>
              ) : null}

              <div className="text-center">
                <p className="text-sm font-bold tracking-wide text-[#4B2E2B]">{form.shop_name || "Shop Name"}</p>
                <p className="mt-1 text-[11px] text-[#8E706B]">{form.address || "Address"}</p>
                <p className="text-[11px] text-[#8E706B]">{form.phone || "Phone"}</p>
                {form.tax_id ? <p className="text-[11px] text-[#8E706B]">Tax ID: {form.tax_id}</p> : null}
              </div>

              <div className="my-4 border-t border-dashed border-[#EAD6C0]" />

              {form.show_order_number ? (
                <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-[#6E4F4A]">
                  <span>Order #PLC-1024</span>
                  <span>12:45 PM</span>
                </div>
              ) : null}

              {form.show_customer_name ? (
                <div className="mb-3 flex items-center gap-2 text-[11px] text-[#6E4F4A]">
                  <UserRound className="h-3.5 w-3.5" />
                  <span>Customer: Walk-in</span>
                </div>
              ) : null}

              <div className="space-y-1.5 text-[11px] text-[#6E4F4A]">
                <div className="flex justify-between">
                  <span>1x Latte</span>
                  <span>$3.50</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Croissant</span>
                  <span>$2.25</span>
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-[#EAD6C0]" />

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-[#8E706B]">
                  <span>Subtotal</span>
                  <span>$5.75</span>
                </div>
                <div className="flex justify-between font-semibold text-[#4B2E2B]">
                  <span>Total</span>
                  <span>$5.75</span>
                </div>
              </div>

              {form.show_qr_payment ? (
                <div className="mt-4 flex flex-col items-center gap-1">
                  <div className="rounded bg-[#F8EFE4] p-2 text-[#4B2E2B]">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8E706B]">
                    Scan To Pay
                  </p>
                </div>
              ) : null}

              <p className="mt-4 text-center text-[10px] italic leading-relaxed text-[#8E706B]">
                {form.footer_message || "Footer message"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
