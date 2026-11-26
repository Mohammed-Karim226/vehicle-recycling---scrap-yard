import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const errors = loadTypeScriptModule('lib/errors.ts');
const schemas = loadTypeScriptModule('lib/validation/schemas.ts');
const { DVLAError, estimateWeightKg } = loadTypeScriptModule('lib/dvla.ts');
const privateProviderDetail = 'PROVIDER_KEY_SENTINEL_NEVER_EXPOSE';

test('quote inputs display UK spacing and submit compact uppercase values', () => {
  assert.equal(schemas.formatQuoteRegistration('ab12'), 'AB12 ');
  assert.equal(schemas.formatQuoteRegistration('ab12c'), 'AB12 C');
  assert.equal(schemas.formatQuoteRegistration(' ab12-cde '), 'AB12 CDE');
  assert.equal(schemas.formatQuoteRegistration('ab12 3'), 'AB123');
  assert.equal(schemas.formatQuoteRegistration('a123 abc'), 'A123 ABC');
  assert.equal(schemas.formatQuotePostcode('pe15'), 'PE15');
  assert.equal(schemas.formatQuotePostcode('pe1 5'), 'PE1 5');

  for (const postcode of ['M1 1AE', 'B33 8TH', 'W1A 0AX', 'PE1 5YP', 'DN55 1PT', 'EC1A 1BB', 'GIR 0AA']) {
    const compact = postcode.replace(' ', '');
    const displayedPostcode = schemas.formatQuotePostcode(compact.toLowerCase());
    assert.equal(displayedPostcode, postcode);
    assert.deepEqual(schemas.quoteInputSchema.parse({ registration: 'AB12 CDE', postcode: displayedPostcode }), {
      registration: 'AB12CDE',
      postcode: compact,
    });
  }
});

test('only complete modern registrations qualify for the green border', () => {
  assert.equal(schemas.isCompleteModernRegistration('AB12 CDE'), true);

  for (const registration of ['AB12 C', 'AB12 CD', 'AB12 CDEF', 'AB12 CD1']) {
    assert.equal(schemas.isCompleteModernRegistration(registration), false);
    assert.equal(schemas.quoteInputSchema.safeParse({ registration, postcode: 'PE1 5YP' }).success, false);
  }

  for (const registration of ['AB12', 'AB123', 'A123 ABC']) {
    assert.equal(schemas.isCompleteModernRegistration(registration), false);
    assert.equal(schemas.quoteInputSchema.safeParse({ registration, postcode: 'PE1 5YP' }).success, true);
  }
});

test('the hourly cap defaults to 60 and accepts only configured whole numbers from 1 to 10000', () => {
  const previousEnv = process.env;
  try {
    process.env = {
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      ADMIN_SESSION_SECRET: 'test-session-secret-at-least-32-characters',
    };
    const readers = [
      () => loadTypeScriptModule('lib/env.ts').getEnv().SCRAP_QUOTE_HOURLY_LIMIT,
      () => loadTypeScriptModule('lib/env.ts').getScrapQuoteHourlyLimit(),
    ];
    for (const readLimit of readers) {
      delete process.env.SCRAP_QUOTE_HOURLY_LIMIT;
      assert.equal(readLimit(), 60);
      process.env.SCRAP_QUOTE_HOURLY_LIMIT = '120';
      assert.equal(readLimit(), 120);
      for (const value of ['', '0', '-1', '1.5', 'unlimited', '10001']) {
        process.env.SCRAP_QUOTE_HOURLY_LIMIT = value;
        assert.throws(readLimit, /SCRAP_QUOTE_HOURLY_LIMIT/);
      }
    }
  } finally {
    process.env = previousEnv;
  }
});

function createQuoteFixture({ vehicle, lookupError, rateLimitError, saveError, hourlyLimit = 60, enforceRateLimit, envModule } = {}) {
  const calls = { lookups: [], priceReads: 0, valuations: [], invalidations: [], rateLimits: [] };
  const { generateScrapValuation } = loadTypeScriptModule('lib/actions/scrapValuationActions.ts', {
    '@/lib/auth/adminSession': { requireAdmin: async () => {} },
    '@/lib/errors': errors,
    '@/lib/env': envModule ?? { getScrapQuoteHourlyLimit: () => hourlyLimit },
    '@/lib/actions/safeAction': { withActionError: async (_label, action) => action() },
    '../services/ScrapValuationService': {
      ScrapValuationService: class {
        async createValuation(input) {
          if (saveError) throw saveError;
          calls.valuations.push(input);
          return { ...input, id: 'valuation-id', trackingToken: 'tracking-token' };
        }
      },
    },
    '../services/ScrapMetalPriceService': {
      ScrapMetalPriceService: class {
        async getAllPrices() {
          calls.priceReads++;
          return [];
        }
      },
    },
    '@/lib/validation/schemas': schemas,
    '@/lib/dvla': {
      DVLAError,
      estimateWeightKg,
      lookupVehicle: async (registration) => {
        calls.lookups.push(registration);
        if (lookupError) throw lookupError;
        return vehicle;
      },
    },
    '@/lib/security/rateLimit': {
      enforceRateLimit: async (...args) => {
        calls.rateLimits.push(args);
        if (rateLimitError) throw rateLimitError;
        await enforceRateLimit?.(...args);
      },
    },
    'next/cache': { updateTag: (tag) => calls.invalidations.push(tag) },
  });
  return { generateScrapValuation, calls };
}

test('public quotes use their own configuration while admin validation still rejects a short secret', async () => {
  const previousEnv = process.env;
  try {
    process.env = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      ADMIN_SESSION_SECRET: 'short',
      SCRAP_QUOTE_HOURLY_LIMIT: '120',
    };
    const envModule = loadTypeScriptModule('lib/env.ts');
    assert.throws(() => envModule.getEnv(), /ADMIN_SESSION_SECRET/);
    const { generateScrapValuation, calls } = createQuoteFixture({
      envModule,
      vehicle: { registrationNumber: 'AB12CDE', make: 'FORD' },
    });

    const result = await generateScrapValuation('AB12CDE', 'CB1 1AA');

    assert.equal('error' in result, false);
    assert.deepEqual(calls.rateLimits, [['generate-scrap-valuation', 120, 3600]]);
    assert.deepEqual(calls.lookups, ['AB12CDE']);
    assert.equal(calls.valuations.length, 1);
    assert.throws(() => envModule.getEnv(), /ADMIN_SESSION_SECRET/);
  } finally {
    process.env = previousEnv;
  }
});

test('invalid quote configuration stops before vehicle lookup or quote writes', async () => {
  const previousEnv = process.env;
  try {
    process.env = { SCRAP_QUOTE_HOURLY_LIMIT: 'unlimited' };
    const { generateScrapValuation, calls } = createQuoteFixture({
      envModule: loadTypeScriptModule('lib/env.ts'),
      vehicle: { registrationNumber: 'AB12CDE', make: 'FORD' },
    });

    const result = await generateScrapValuation('AB12CDE', 'CB1 1AA');

    assert.deepEqual(result, { error: 'Unable to generate a quote. Please try again.' });
    assert.deepEqual(calls.rateLimits, []);
    assert.deepEqual(calls.lookups, []);
    assert.equal(calls.priceReads, 0);
    assert.deepEqual(calls.valuations, []);
    assert.deepEqual(calls.invalidations, []);
  } finally {
    process.env = previousEnv;
  }
});

for (const [name, lookupError, expectedMessage] of [
  ['invalid registration', new DVLAError(privateProviderDetail, 400), /valid vehicle registration/i],
  ['vehicle not found', new DVLAError(privateProviderDetail, 404), /no vehicle was found/i],
  ['provider rate limit', new DVLAError(privateProviderDetail, 429), /wait and try again/i],
  ['rejected credentials', new DVLAError(privateProviderDetail, 403), /temporarily unavailable/i],
  ['request timeout', new DOMException(privateProviderDetail, 'TimeoutError'), /temporarily unavailable/i],
]) {
  test(`${name} returns a safe error without creating a quote`, async (t) => {
    const logged = [];
    t.mock.method(console, 'warn', (...args) => logged.push(args));
    const { generateScrapValuation, calls } = createQuoteFixture({ lookupError });

    const result = await generateScrapValuation('AB12 CDE', 'CB1 1AA');

    assert.deepEqual(Object.keys(result), ['error']);
    assert.match(result.error, expectedMessage);
    assert.doesNotMatch(JSON.stringify({ result, logged }), new RegExp(privateProviderDetail));
    assert.deepEqual(calls.lookups, ['AB12CDE']);
    assert.equal(calls.priceReads, 0);
    assert.deepEqual(calls.valuations, []);
    assert.deepEqual(calls.invalidations, []);
  });
}

test('invalid input and local rate limits stop before vehicle lookup or quote writes', async () => {
  const invalidInput = createQuoteFixture();
  const validationResult = await invalidInput.generateScrapValuation('!!', 'CB1 1AA');
  assert.match(validationResult.error, /invalid registration or postcode/i);
  assert.deepEqual(invalidInput.calls.lookups, []);
  assert.deepEqual(invalidInput.calls.valuations, []);

  const invalidPostcode = await invalidInput.generateScrapValuation('AB12 CDE', 'PE1 5Y');
  assert.match(invalidPostcode.error, /invalid registration or postcode/i);
  assert.deepEqual(invalidInput.calls.lookups, []);
  assert.deepEqual(invalidInput.calls.valuations, []);

  const rateLimited = createQuoteFixture({ rateLimitError: new errors.RateLimitError() });
  const rateLimitResult = await rateLimited.generateScrapValuation('AB12CDE', 'CB1 1AA');
  assert.match(rateLimitResult.error, /wait and try again/i);
  assert.deepEqual(rateLimited.calls.lookups, []);
  assert.equal(rateLimited.calls.priceReads, 0);
  assert.deepEqual(rateLimited.calls.valuations, []);
  assert.deepEqual(rateLimited.calls.invalidations, []);
});

test('a configured hourly cap allows more than ten quotes and blocks before another DVLA call', async () => {
  let attempts = 0;
  const hourlyLimit = 12;
  const { generateScrapValuation, calls } = createQuoteFixture({
    vehicle: { registrationNumber: 'AB12CDE', make: 'FORD' },
    hourlyLimit,
    enforceRateLimit: async (_scope, limit) => {
      if (++attempts > limit) throw new errors.RateLimitError();
    },
  });

  for (let attempt = 0; attempt < hourlyLimit; attempt++) {
    const result = await generateScrapValuation('AB12CDE', 'CB1 1AA');
    assert.equal('error' in result, false);
  }
  const result = await generateScrapValuation('AB12CDE', 'CB1 1AA');

  assert.match(result.error, /limit of 12 quote attempts per hour/i);
  assert.match(result.error, /wait and try again/i);
  assert.equal(calls.lookups.length, hourlyLimit);
  assert.equal(calls.valuations.length, hourlyLimit);
  assert.ok(calls.rateLimits.every(([scope, limit, seconds]) =>
    scope === 'generate-scrap-valuation' && limit === hourlyLimit && seconds === 3600));
});

test('a successful lookup persists vehicle details and returns the existing tracking fields', async () => {
  const { generateScrapValuation, calls } = createQuoteFixture({
    vehicle: {
      registrationNumber: 'AB12CDE',
      make: 'FORD',
      yearOfManufacture: 2008,
      engineCapacity: 1596,
      fuelType: 'PETROL',
      colour: 'BLUE',
      motStatus: 'Valid',
      motExpiryDate: '2027-03-15',
    },
  });

  const result = await generateScrapValuation('ab12-cde', 'cb1 1aa');

  assert.equal('error' in result, false);
  assert.equal(result.id, 'valuation-id');
  assert.equal(result.trackingToken, 'tracking-token');
  assert.equal(result.registration, 'AB12CDE');
  assert.equal(result.postcode, 'CB11AA');
  assert.equal(result.vehicleName, 'FORD 2008');
  assert.equal(result.engineSize, '1.6L');
  assert.equal(result.fuelType, 'PETROL');
  assert.equal(result.colour, 'BLUE');
  assert.equal(result.motStatus, 'Valid');
  assert.equal(result.motExpiryDate, '2027-03-15');
  assert.ok(Number.isFinite(result.estimatedValue) && result.estimatedValue >= 50);
  assert.ok(Number.isFinite(result.weightKg) && result.weightKg > 0);
  assert.equal(calls.valuations.length, 1);
  assert.equal(calls.valuations[0].vehicleName, result.vehicleName);
  assert.equal(calls.valuations[0].fuelType, result.fuelType);
  assert.match(calls.valuations[0].notes, /MOT Status: Valid/);
  assert.match(calls.valuations[0].notes, /MOT Expiry: 2027-03-15/);
  assert.deepEqual(calls.invalidations, ['submission-counts']);
});

test('missing optional vehicle data does not invent a current year or petrol fuel type', async () => {
  const { generateScrapValuation, calls } = createQuoteFixture({
    vehicle: { registrationNumber: 'AB12CDE', make: 'FORD', motStatus: 'No details held' },
  });

  const result = await generateScrapValuation('AB12CDE', 'CB1 1AA');

  assert.equal('error' in result, false);
  assert.equal(result.vehicleName, 'FORD');
  assert.equal(result.fuelType, 'Unknown');
  assert.equal(result.engineSize, 'Unknown');
  assert.equal(result.motStatus, 'No details held');
  assert.equal(result.motExpiryDate, '');
  assert.equal(calls.valuations[0].vehicleName, 'FORD');
  assert.equal(calls.valuations[0].fuelType, 'Unknown');
});

test('an unexpected persistence failure returns a generic error without internal details', async () => {
  const { generateScrapValuation, calls } = createQuoteFixture({
    vehicle: { registrationNumber: 'AB12CDE', make: 'FORD' },
    saveError: new Error(privateProviderDetail),
  });

  const result = await generateScrapValuation('AB12CDE', 'CB1 1AA');

  assert.deepEqual(Object.keys(result), ['error']);
  assert.match(result.error, /unable to generate a quote/i);
  assert.doesNotMatch(result.error, new RegExp(privateProviderDetail));
  assert.deepEqual(calls.invalidations, []);
});
