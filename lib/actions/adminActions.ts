'use server'

import {
  adminLogin as login,
  adminLogout as logout,
  checkAdminSession as checkSession,
} from '@/lib/auth/adminSession'

export async function adminLogin(
  pin: string
): Promise<{ success: true } | { success: false; error: string }> {
  return login(pin)
}

export async function adminLogout(): Promise<void> {
  return logout()
}

export async function checkAdminSession(): Promise<boolean> {
  return checkSession()
}
