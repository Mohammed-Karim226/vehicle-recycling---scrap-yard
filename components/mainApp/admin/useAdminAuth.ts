"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
const SESSION_KEY = "rrs_autos_admin";
const SIGNATURE_KEY = "rrs_autos_sig";
const HMAC_SECRET = "rrs-admin-session-guard-v1";
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 30;

// SHA-256 of "1234" — the actual PIN is never stored in source
const PIN_HASH =
  "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";

// ────────────────────────────────────────────────────────────
// Crypto helpers (Web Crypto API — runs only in the browser)
// ────────────────────────────────────────────────────────────
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(data);
  return expected === signature;
}

// ────────────────────────────────────────────────────────────
// Session helpers
// ────────────────────────────────────────────────────────────
async function writeSession(): Promise<void> {
  const value = "true";
  const sig = await hmacSign(value);
  sessionStorage.setItem(SESSION_KEY, value);
  sessionStorage.setItem(SIGNATURE_KEY, sig);
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SIGNATURE_KEY);
}

async function validateSession(): Promise<boolean> {
  const value = sessionStorage.getItem(SESSION_KEY);
  const sig = sessionStorage.getItem(SIGNATURE_KEY);
  if (!value || !sig) return false;
  return hmacVerify(value, sig);
}

// ────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────
export interface UseAdminAuthReturn {
  isAdmin: boolean;
  loginError: string;
  attempts: number;
  cooldownRemaining: number;
  isLocked: boolean;
  handleLogin: (pin: string) => Promise<void>;
  handleLogout: () => void;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Validate existing session on mount
  useEffect(() => {
    let cancelled = false;
    validateSession().then((valid) => {
      if (cancelled) return;
      if (valid) {
        setIsAdmin(true);
      } else {
        clearSession(); // Tampered or missing — wipe
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup cooldown timer on unmount
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

      const hash = await sha256(pin);
      if (hash === PIN_HASH) {
        await writeSession();
        setIsAdmin(true);
        setLoginError("");
        setAttempts(0);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLoginError(
            `Too many failed attempts. Locked for ${COOLDOWN_SECONDS}s.`
          );
          startCooldown();
        } else {
          setLoginError(
            `Invalid credentials. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`
          );
        }
      }
    },
    [isLocked, attempts, startCooldown]
  );

  const handleLogout = useCallback(() => {
    clearSession();
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
