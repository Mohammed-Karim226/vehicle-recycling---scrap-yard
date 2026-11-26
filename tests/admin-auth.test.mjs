import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const adminEmail = 'admin@example.com';
const password = 'test-password-for-admin';
const cookieName = 'rrs_admin_session';

function createAuthFixture(t, { config = {}, databaseAdmin } = {}) {
  const previousEnv = process.env;
  process.env = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://test:test@localhost/test',
    ADMIN_SESSION_SECRET: 'test-session-secret-at-least-32-characters',
    ...config,
  };
  t.after(() => { process.env = previousEnv; });

  const calls = { adminLookups: [], adminUpdates: [], rateLimits: [], clearedLimits: [] };
  const jar = new Map();
  const env = loadTypeScriptModule('lib/env.ts');
  const auth = loadTypeScriptModule('lib/auth/adminSession.ts', {
    '@/lib/env': env,
    '@/lib/errors': loadTypeScriptModule('lib/errors.ts'),
    '@/lib/prisma': { prisma: { adminUser: {
      findUnique: async (query) => {
        calls.adminLookups.push(query);
        return databaseAdmin;
      },
      update: async (query) => { calls.adminUpdates.push(query); },
    } } },
    '@/lib/security/rateLimit': {
      enforceRateLimit: async (...args) => { calls.rateLimits.push(args); },
      clearRateLimit: async (...args) => { calls.clearedLimits.push(args); },
    },
    'next/headers': { cookies: async () => ({
      get: (name) => jar.get(name),
      set: (name, value, options) => { jar.set(name, { value, options }); },
      delete: (name) => { jar.delete(name); },
    }) },
  });

  return { auth, calls, jar };
}

test('configured credentials use the email and password directly and support password resets', async (t) => {
  const { auth, calls, jar } = createAuthFixture(t, {
    config: { ADMIN_EMAIL: ' ADMIN@example.com ', ADMIN_PASSWORD: password },
  });

  assert.equal((await auth.adminLogin(adminEmail, 'incorrect-password')).success, false);
  assert.equal((await auth.adminLogin('other@example.com', password)).success, false);
  assert.equal(await auth.checkAdminSession(), false);
  assert.deepEqual(await auth.adminLogin(adminEmail, password), { success: true });
  const cookie = jar.get(cookieName);
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.secure, true);
  assert.equal(await auth.checkAdminSession(), true);

  process.env.ADMIN_PASSWORD = 'different-test-password';
  assert.equal(await auth.checkAdminSession(), false);
  assert.equal(jar.has(cookieName), false);
  assert.equal((await auth.adminLogin(adminEmail, password)).success, false);
  assert.equal((await auth.adminLogin(adminEmail, process.env.ADMIN_PASSWORD)).success, true);
  await auth.adminLogout();
  assert.equal(await auth.checkAdminSession(), false);
  assert.deepEqual(calls.adminLookups, []);
  assert.deepEqual(calls.adminUpdates, []);
  assert.equal(calls.rateLimits.length, 5);
  assert.equal(calls.clearedLimits.length, 2);
});

test('database admins can still sign in when configured credentials are unset', async (t) => {
  const salt = Buffer.alloc(16, 1);
  const hash = scryptSync(password, salt, 32);
  const databaseAdmin = {
    id: 'existing-admin-id',
    isActive: true,
    passwordHash: `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`,
  };
  const { auth, calls } = createAuthFixture(t, { databaseAdmin });

  assert.deepEqual(await auth.adminLogin(adminEmail, password), { success: true });
  assert.equal(await auth.checkAdminSession(), true);
  assert.equal(calls.adminUpdates.length, 1);

  process.env.ADMIN_EMAIL = adminEmail;
  process.env.ADMIN_PASSWORD = 'different-test-password';
  assert.equal(await auth.checkAdminSession(), false);
  assert.equal((await auth.adminLogin(adminEmail, password)).success, false);
  assert.equal(calls.adminLookups.length, 2);
});

test('one missing configured credential fails without falling back to database login', async (t) => {
  const { auth, calls, jar } = createAuthFixture(t, { config: { ADMIN_EMAIL: adminEmail } });

  await assert.rejects(auth.adminLogin(adminEmail, password), /ADMIN_EMAIL and ADMIN_PASSWORD|ADMIN_EMAIL.*ADMIN_PASSWORD/);
  assert.deepEqual(calls.adminLookups, []);
  assert.equal(jar.has(cookieName), false);
});
