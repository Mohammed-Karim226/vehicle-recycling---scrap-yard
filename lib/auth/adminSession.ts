import "server-only";

import { createHmac, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { RateLimitError, UnauthorizedError } from "@/lib/errors";
import { clearRateLimit, enforceRateLimit } from "@/lib/security/rateLimit";

const COOKIE_NAME = "rrs_admin_session";
const LOGIN_RATE_LIMIT_SCOPE = "admin-login-v2";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const scrypt = promisify(scryptCallback);

function signPayload(payload: string): string {
  return createHmac("sha256", getEnv().ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
}

function buildToken(adminId: string, expiresAt: number): string {
  const payload = `${adminId}:${expiresAt}`;
  return `${payload}:${signPayload(payload)}`;
}

function parseToken(token: string): { valid: boolean; adminId: string; expiresAt: number } {
  const lastColon = token.lastIndexOf(":");
  if (lastColon <= 0) return { valid: false, adminId: "", expiresAt: 0 };

  const payload = token.slice(0, lastColon);
  const signature = token.slice(lastColon + 1);
  const expected = signPayload(payload);

  if (signature.length !== expected.length) return { valid: false, adminId: "", expiresAt: 0 };

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (sigBuffer.length !== expectedBuffer.length) return { valid: false, adminId: "", expiresAt: 0 };

  if (!timingSafeEqual(sigBuffer, expectedBuffer)) return { valid: false, adminId: "", expiresAt: 0 };

  const [adminId, expiresRaw] = payload.split(":");
  const expiresAt = Number(expiresRaw);
  if (!adminId || !Number.isFinite(expiresAt)) return { valid: false, adminId: "", expiresAt: 0 };

  return { valid: true, adminId, expiresAt };
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
  email: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await enforceRateLimit(LOGIN_RATE_LIMIT_SCOPE, 5, 15 * 60);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message };
    }
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password || password.length < 8 || password.length > 128) {
    return { success: false, error: "Invalid credentials" };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: normalizedEmail } });
  const passwordValid = admin ? await verifyScrypt(password, admin.passwordHash) : false;
  if (!admin?.isActive || !passwordValid) {
    return { success: false, error: "Invalid credentials" };
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  await setAdminCookie(buildToken(admin.id, expiresAt));
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  try {
    await clearRateLimit(LOGIN_RATE_LIMIT_SCOPE);
  } catch (error) {
    console.warn("[adminLogin] Failed to clear login rate-limit bucket", error);
  }
  return { success: true };
}

async function verifyScrypt(password: string, encoded: string): Promise<boolean> {
  const [, saltHex, expectedHex] = encoded.split("$");
  if (!saltHex || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const { valid, adminId, expiresAt } = parseToken(token);
  if (!valid || expiresAt <= Date.now()) {
    cookieStore.delete(COOKIE_NAME);
    return false;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    select: { isActive: true },
  });
  return admin?.isActive === true;
}

export async function requireAdmin(): Promise<void> {
  const isAdmin = await checkAdminSession();
  if (!isAdmin) throw new UnauthorizedError();
}
