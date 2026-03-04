import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const [email, setEmail] = useState("admin@pos.com");
  const [password, setPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await loginAdmin(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#EAD6C0] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#4B2E2B]">Admin Login</h1>
        <p className="mt-1 text-sm text-[#7C5D58]">
          Sign in to connect to backend API.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label
              className="mb-1 block text-sm text-[#4B2E2B]"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] outline-none focus:border-[#B28A6E]"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm text-[#4B2E2B]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-[#EAD6C0] px-3 py-2 text-sm text-[#4B2E2B] outline-none focus:border-[#B28A6E]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#4B2E2B] px-3 py-2 text-sm font-medium text-white hover:bg-[#5B3E3B] disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
