"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900/80 border border-white/10 rounded-2xl p-8 text-center space-y-5">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Something went wrong
          </h1>
          <p className="text-slate-400 text-sm">
            An unexpected error occurred. You can try again or refresh the page.
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase px-5 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    </main>
  );
}
