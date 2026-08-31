"use client";

import { FormEvent, memo, useCallback, useState } from "react";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminLoginGateProps {
  loginError: string;
  isLocked: boolean;
  cooldownRemaining: number;
  onLogin: (email: string, password: string) => Promise<void>;
}

function AdminLoginGateInner({ loginError, isLocked, cooldownRemaining, onLogin }: AdminLoginGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked || !email.trim() || password.length < 8) return;
    void onLogin(email.trim(), password);
    setPassword("");
  }, [email, isLocked, onLogin, password]);

  return (
    <div className="max-w-md mx-auto my-12" id="admin-pass-gate">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-slate-950/45 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl text-center space-y-6"
      >
        <div className="relative mx-auto h-16 w-16 bg-gradient-to-tr from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-red-500/30">
          <ShieldCheck className="h-8 w-8 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">RRS Autos Back Office</h2>
          <p className="text-xs text-slate-400 font-mono">AUTHORIZED PERSONNEL ONLY - ENCRYPTED SESSION</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <Label className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider" htmlFor="admin-email-input">
            Admin Email
          </Label>
          <Input
            id="admin-email-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
            maxLength={254}
            disabled={isLocked}
            autoComplete="username"
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
          />

          <Label className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider" htmlFor="admin-password-input">
            Password
          </Label>
          <Input
            id="admin-password-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            minLength={8}
            maxLength={128}
            disabled={isLocked}
            autoComplete="current-password"
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 disabled:opacity-50"
          />

          {isLocked && (
            <div className="flex items-center justify-center gap-2 bg-amber-950/40 border border-amber-900/30 py-2.5 px-4 rounded-lg text-[10px] text-amber-400 font-mono">
              <Lock className="h-3.5 w-3.5" /> Retry in {cooldownRemaining}s
            </div>
          )}
          {loginError && !isLocked && (
            <p className="text-[10px] text-rose-400 font-mono flex items-center justify-center gap-1.5 bg-rose-950/40 border border-rose-900/30 py-1.5 px-3 rounded-lg">
              <AlertCircle className="h-3 w-3" /> {loginError}
            </p>
          )}

          <Button
            id="admin-login-btn"
            type="submit"
            disabled={isLocked || !email.trim() || password.length < 8}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest font-mono disabled:opacity-50"
          >
            Sign In
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

export default memo(AdminLoginGateInner);
