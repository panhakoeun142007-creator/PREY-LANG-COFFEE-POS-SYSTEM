import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export default function LogoutConfirmModal({ open, onConfirm, onCancel, isDarkMode = false }: LogoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${
          isDarkMode ? "bg-slate-900 border border-slate-700 text-slate-100" : "bg-white text-[#4B2E2B]"
        }`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isDarkMode ? "bg-red-900/40" : "bg-red-50"}`}>
            <LogOut size={26} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">Confirm Logout</h3>
          <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-[#7C5D58]"}`}>
            Are you sure you want to log out?
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
              isDarkMode
                ? "border border-slate-600 text-slate-200 hover:bg-slate-800"
                : "border border-[#EAD6C0] text-[#4B2E2B] hover:bg-[#F8EFE4]"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}
