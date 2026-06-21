"use client";

import React, { useState, useCallback, memo } from "react";
import { motion } from "motion/react";
import { ShieldCheck, AlertCircle, Lock } from "lucide-react";

// ────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────
interface AdminLoginGateProps {
  loginError: string;
  isLocked: boolean;
  cooldownRemaining: number;
  onLogin: (pin: string) => Promise<void>;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────
function AdminLoginGateInner({
  loginError,
  isLocked,
  cooldownRemaining,
  onLogin,
}: AdminLoginGateProps) {
  const [pin, setPin] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!pin.trim() || isLocked) return;
      onLogin(pin);
      setPin("");
    },
    [pin, isLocked, onLogin]
  );

  return (
    <div className="max-w-md mx-auto my-12" id="admin-pass-gate">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-slate-950/45 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl text-center space-y-6"
      >
        {/* Icon */}
        <div className="relative mx-auto h-16 w-16 bg-gradient-to-tr from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-red-500/30">
          <ShieldCheck className="h-8 w-8 text-red-400" />
          <div className="absolute inset-0 bg-red-400/10 blur-md rounded-full" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            RRS Autos Back Office
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            AUTHORIZED PERSONNEL ONLY — ENCRYPTED SESSION
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block ml-1">
              Enter Master Access PIN
            </label>
            <input
              id="admin-pin-input"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={8}
              disabled={isLocked}
              autoComplete="off"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-center text-xl font-bold font-mono text-white tracking-widest focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Lockout timer */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 bg-amber-950/40 border border-amber-900/30 py-2.5 px-4 rounded-lg"
            >
              <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] text-amber-400 font-mono">
                Account locked — retry in{" "}
                <span className="font-black tabular-nums">{cooldownRemaining}s</span>
              </span>
            </motion.div>
          )}

          {/* Error */}
          {loginError && !isLocked && (
            <p className="text-[10px] text-rose-400 font-mono mt-2 flex items-center justify-center space-x-1.5 bg-rose-950/40 border border-rose-900/30 py-1.5 px-3 rounded-lg">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{loginError}</span>
            </p>
          )}

          <button
            id="admin-login-btn"
            type="submit"
            disabled={isLocked || !pin.trim()}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest font-mono transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Identity & Unlock
          </button>
        </form>

        <span className="block text-[9px] text-slate-500 font-mono">
          Peterborough Yard HQ • System Version 26.4.1
        </span>
      </motion.div>
    </div>
  );
}

const AdminLoginGate = memo(AdminLoginGateInner);
export default AdminLoginGate;
