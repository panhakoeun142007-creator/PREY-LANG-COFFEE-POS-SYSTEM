import { useEffect, useState } from "react";
import type { GeneralSettingsData } from "../types.d";

interface GeneralSettingsProps {
  value: GeneralSettingsData;
  onSave: (data: GeneralSettingsData) => Promise<void>;
  isSaving: boolean;
}

export default function GeneralSettings({ value, onSave, isSaving }: GeneralSettingsProps) {
  const [form, setForm] = useState<GeneralSettingsData>(value);

  useEffect(() => {
    setForm(value);
  }, [value]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-brand-text">Shop Profile</h3>
          <button
            type="button"
            onClick={() => void onSave(form)}
            disabled={isSaving}
            className="bg-[#5A2E26] hover:bg-[#4a241d] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#5A2E26]/20 transition-all active:scale-95 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-brand-border p-10 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-brand-text">Shop Name</label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => setForm((prev) => ({ ...prev, shop_name: e.target.value }))}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-5 py-3.5 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-brand-text">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full bg-white border border-[#e2e8f0] rounded-xl px-5 py-3.5 text-sm text-brand-text h-24 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-brand-text">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-brand-text">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-brand-text focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
