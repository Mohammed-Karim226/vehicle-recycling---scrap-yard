"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { adminLogin, adminLogout, checkAdminSession } from "@/lib/actions";

const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

export interface UseAdminAuthReturn {
  isAdmin: boolean;
  loginError: string;
  attempts: number;
  cooldownRemaining: number;
  isLocked: boolean;
  handleLogin: (pin: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkAdminSession().then((valid) => {
      if (!cancelled && valid) setIsAdmin(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_SECONDS);
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const isLocked = cooldownRemaining > 0;

  const handleLogin = useCallback(
    async (pin: string) => {
      if (isLocked) return;

      try {
        const result = await adminLogin(pin);
        if (result.success) {
          setIsAdmin(true);
          setLoginError("");
          setAttempts(0);
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);

          if (newAttempts >= MAX_ATTEMPTS) {
            setLoginError(`Too many failed attempts. Locked for ${COOLDOWN_SECONDS}s.`);
            startCooldown();
          } else {
            setLoginError(
              `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`
            );
          }
        }
      } catch {
        setLoginError("Login service unavailable. Please try again.");
      }
    },
    [isLocked, attempts, startCooldown]
  );

  const handleLogout = useCallback(async () => {
    try {
      await adminLogout();
    } catch {
      // Best-effort — still clear local UI state
    }
    setIsAdmin(false);
    setLoginError("");
    setAttempts(0);
  }, []);

  return {
    isAdmin,
    loginError,
    attempts,
    cooldownRemaining,
    isLocked,
    handleLogin,
    handleLogout,
  };
}
