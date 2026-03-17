import React from "react";
import { auth } from "../utils/auth";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#EAD6C0] bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-[#4B2E2B]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[#7C5D58]">
              Try refreshing, or go back to login.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-[#F8EFE4] p-3 text-xs text-[#4B2E2B]">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#4B2E2B] px-4 py-2 text-sm font-medium text-white hover:bg-[#6B4E4B]"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#EAD6C0] px-4 py-2 text-sm font-medium text-[#4B2E2B] hover:bg-[#F8EFE4]"
                onClick={() => {
                  auth.clear();
                  window.dispatchEvent(new Event("auth:unauthorized"));
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

