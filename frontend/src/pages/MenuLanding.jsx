import { Link, useSearchParams } from "react-router-dom";

export default function MenuLanding() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const tableName = searchParams.get("name");
  const displayName = tableName || (tableId ? `Table ${tableId}` : "Guest");

  return (
    <div className="min-h-screen bg-[#FFF8F0] px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#EAD6C0] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#4B2E2B]">Prey Lang Coffee</h1>
        <p className="mt-2 text-[#7C5D58]">
          QR session ready for <span className="font-semibold text-[#4B2E2B]">{displayName}</span>.
        </p>
        <p className="mt-3 text-sm text-[#7C5D58]">
          The customer menu endpoint is now reachable. You can connect this page to your public ordering flow.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="inline-flex items-center rounded-lg bg-[#4B2E2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5B3E3B]"
          >
            Staff Login
          </Link>
          <Link
            to="/"
            className="inline-flex items-center rounded-lg border border-[#EAD6C0] px-4 py-2 text-sm font-semibold text-[#4B2E2B] hover:bg-[#F8EFE4]"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
