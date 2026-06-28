import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { UnauthorizedError } from "@/lib/errors";

const COOKIE_NAME = "rrs_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function signPayload(payload: string): string {
  return createHmac("sha256", getEnv().ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

function buildToken(expiresAt: number): string {
  const payload = `admin:${expiresAt}`;
  return `${payload}:${signPayload(payload)}`;
}

function parseToken(token: string): { valid: boolean; expiresAt: number } {
  const lastColon = token.lastIndexOf(":");
  if (lastColon <= 0) return { valid: false, expiresAt: 0 };

  const payload = token.slice(0, lastColon);
  const signature = token.slice(lastColon + 1);
  const expected = signPayload(payload);

  if (signature.length !== expected.length) return { valid: false, expiresAt: 0 };

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (sigBuffer.length !== expectedBuffer.length) return { valid: false, expiresAt: 0 };

  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return { valid: false, expiresAt: 0 };

  const [, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt)) return { valid: false, expiresAt: 0 };

  return { valid: true, expiresAt };
}

async function setAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function adminLogin(
  pin: string
): Promise<{ success: true } | { success: false; error: string }> {
  if (!pin || pin.length > 32) {
    return { success: false, error: "Invalid credentials" };
  }

  const hash = createHash("sha256").update(pin).digest("hex");
  if (hash !== getEnv().ADMIN_PIN_HASH) {
    return { success: false, error: "Invalid credentials" };
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  await setAdminCookie(buildToken(expiresAt));
  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const { valid, expiresAt } = parseToken(token);
  if (!valid || expiresAt <= Date.now()) {
    cookieStore.delete(COOKIE_NAME);
    return false;
  }

  return true;
}

export async function requireAdmin(): Promise<void> {
  const isAdmin = await checkAdminSession();
  if (!isAdmin) throw new UnauthorizedError();
}
