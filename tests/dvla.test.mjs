import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScriptModule } from './helpers/load-typescript.mjs';

const waits = [];
const { lookupVehicle, DVLAError, DVLA_PRODUCTION_API_URL, DVLA_UAT_API_URL } = loadTypeScriptModule('lib/dvla.ts', {
  'node:timers/promises': {
    setTimeout: async (milliseconds, _value, options) => {
      options?.signal?.throwIfAborted();
      waits.push({ milliseconds, signal: options?.signal });
    },
  },
});
const registration = 'AA19AAA';

async function withDvla(fetchMock, run) {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.DVLA_API_KEY;
  const previousUrl = process.env.DVLA_API_URL;
  globalThis.fetch = fetchMock;
  waits.length = 0;
  process.env.DVLA_API_KEY = ' test-api-key ';
  delete process.env.DVLA_API_URL;
  try {
    await run();
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.DVLA_API_KEY;
    else process.env.DVLA_API_KEY = previousKey;
    if (previousUrl === undefined) delete process.env.DVLA_API_URL;
    else process.env.DVLA_API_URL = previousUrl;
  }
}

test('production lookup sends canonical registration and private authentication', async () => {
  await withDvla(async (url, options) => {
    assert.equal(url, DVLA_PRODUCTION_API_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['x-api-key'], 'test-api-key');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { registrationNumber: registration });
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ registrationNumber: registration, make: 'FORD', motStatus: 'Valid',
      motExpiry: '2027-03-01', wheelPlan: '2 AXLE RIGID BODY', monthOfFirstRegistration: 3,
      yearOfFirstRegistration: 2019, markedAsScrapped: false });
  }, async () => {
    const vehicle = await lookupVehicle(' aa19-aaa ');
    assert.equal(vehicle.make, 'FORD');
    assert.equal(vehicle.motExpiryDate, '2027-03-01');
    assert.equal(vehicle.wheelplan, '2 AXLE RIGID BODY');
    assert.equal(vehicle.monthOfFirstRegistration, 3);
  });
});

test('explicit UAT lookup accepts legacy VES fixtures and trims dates', async () => {
  await withDvla(async (url) => {
    assert.equal(url, DVLA_UAT_API_URL);
    return Response.json({ registrationNumber: registration, monthOfFirstRegistration: '2019-03',
      motExpiryDate: ' 2027-03-01 ', wheelplan: '2 AXLE RIGID BODY' });
  }, async () => {
    process.env.DVLA_API_URL = DVLA_UAT_API_URL;
    const vehicle = await lookupVehicle(registration);
    assert.equal(vehicle.motExpiryDate, '2027-03-01');
    assert.equal(vehicle.monthOfFirstRegistration, '2019-03');
  });
});

test('missing key, invalid input and non-DVLA URLs never send credentials', async () => {
  await withDvla(async () => { assert.fail('fetch must not be called'); }, async () => {
    process.env.DVLA_API_KEY = '   ';
    await assert.rejects(lookupVehicle(registration), /key is not configured/);
    process.env.DVLA_API_KEY = 'test-api-key';
    process.env.DVLA_API_URL = 'https://example.com/vehicle-enquiry/v1/vehicles';
    await assert.rejects(lookupVehicle(registration), /official production or UAT/);
    delete process.env.DVLA_API_URL;
    await assert.rejects(lookupVehicle('AA!19AAA'), (error) => error instanceof DVLAError && error.statusCode === 400);
  });
});

test('structured and legacy provider errors retain the HTTP status and readable details', async () => {
  const cases = [
    { status: 404, body: { errors: [{ title: 'Vehicle Not Found', detail: 'Record not found' }] }, text: 'Record not found' },
    { status: 403, body: { message: 'Access denied' }, text: 'Access denied' },
    { status: 429, body: { errors: ['Too Many Requests'] }, text: 'Too Many Requests' },
    { status: 503, body: [{ title: 'Maintenance', detail: 'Try later' }], text: 'Try later' },
    { status: 500, body: { errors: [] }, text: 'HTTP 500' },
  ];
  for (const item of cases) {
    let requests = 0;
    await withDvla(async () => {
      requests++;
      return Response.json(item.body, { status: item.status });
    }, async () => {
      await assert.rejects(lookupVehicle(registration), (error) => {
        assert.ok(error instanceof DVLAError);
        assert.equal(error.statusCode, item.status);
        assert.ok(error.message.includes(item.text));
        assert.ok(!error.message.includes('[object Object]'));
        return true;
      });
      assert.equal(requests, item.status === 429 ? 2 : 1);
      assert.equal(waits.length, item.status === 429 ? 1 : 0);
    });
  }
});

test('a transient rate limit retries once after one second using the same deadline', async () => {
  const signals = [];
  await withDvla(async (_url, options) => {
    signals.push(options.signal);
    return signals.length === 1
      ? Response.json({ errors: ['Too Many Requests'] }, { status: 429 })
      : Response.json({ registrationNumber: registration, make: 'FORD' });
  }, async () => {
    const vehicle = await lookupVehicle(registration);
    assert.equal(vehicle.make, 'FORD');
    assert.equal(signals.length, 2);
    assert.equal(signals[0], signals[1]);
    assert.deepEqual(waits, [{ milliseconds: 1_000, signal: signals[0] }]);
  });
});

test('retry waits honor short Retry-After seconds and HTTP dates', async (t) => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  t.mock.method(Date, 'now', () => now);
  for (const [retryAfter, expectedWait] of [
    ['2', 2_000],
    [new Date(now + 2_000).toUTCString(), 2_000],
    ['invalid', 1_000],
    ['0', 1_000],
  ]) {
    let requests = 0;
    await withDvla(async () => {
      requests++;
      return requests === 1
        ? Response.json({}, { status: 429, headers: { 'Retry-After': retryAfter } })
        : Response.json({ registrationNumber: registration });
    }, async () => {
      await lookupVehicle(registration);
      assert.equal(requests, 2);
      assert.equal(waits.length, 1);
      assert.equal(waits[0].milliseconds, expectedWait);
    });
  }
});

test('long Retry-After seconds and HTTP dates return the rate limit without an early retry', async (t) => {
  const now = Date.parse('2026-11-25T12:00:00Z');
  t.mock.method(Date, 'now', () => now);
  for (const retryAfter of ['120', new Date(now + 120_000).toUTCString()]) {
    let requests = 0;
    await withDvla(async () => {
      requests++;
      return Response.json({ errors: ['Wait before retrying'] }, {
        status: 429,
        headers: { 'Retry-After': retryAfter },
      });
    }, async () => {
      await assert.rejects(lookupVehicle(registration), (error) => error instanceof DVLAError && error.statusCode === 429);
      assert.equal(requests, 1);
      assert.deepEqual(waits, []);
    });
  }
});

test('a timeout while reading the response body returns 504 instead of invalid JSON', async (t) => {
  const controller = new AbortController();
  const timeout = new DOMException('raw body timeout detail', 'TimeoutError');
  t.mock.method(AbortSignal, 'timeout', () => controller.signal);
  await withDvla(async () => ({
    status: 200,
    ok: true,
    json: async () => {
      controller.abort(timeout);
      throw timeout;
    },
  }), async () => {
    await assert.rejects(lookupVehicle(registration), (error) => {
      assert.ok(error instanceof DVLAError);
      assert.equal(error.statusCode, 504);
      assert.doesNotMatch(error.message, /raw body timeout detail/);
      return true;
    });
  });
});

test('non-JSON error responses retain the provider status', async () => {
  await withDvla(async () => new Response('<html>Unavailable</html>', { status: 503 }), async () => {
    await assert.rejects(lookupVehicle(registration), (error) => error instanceof DVLAError && error.statusCode === 503);
  });
});

test('invalid or mismatched success responses cannot be used for a quote', async () => {
  const responses = [
    () => new Response('not JSON', { status: 200 }),
    () => Response.json({}),
    () => Response.json({ registrationNumber: 'BB19BBB' }),
    () => Response.json({ registrationNumber: registration, engineCapacity: '1200' }),
  ];
  for (const response of responses) {
    await withDvla(async () => response(), async () => {
      await assert.rejects(lookupVehicle(registration), (error) => error instanceof DVLAError && error.statusCode === 502);
    });
  }
});

test('timeouts and network failures return safe errors without raw transport details', async () => {
  for (const [failure, expectedStatus] of [[new DOMException('raw transport secret', 'TimeoutError'), 504],
    [new TypeError('raw transport secret'), 503]]) {
    await withDvla(async () => { throw failure; }, async () => {
      await assert.rejects(lookupVehicle(registration), (error) => {
        assert.ok(error instanceof DVLAError);
        assert.equal(error.statusCode, expectedStatus);
        assert.ok(!error.message.includes('raw transport secret'));
        return true;
      });
    });
  }
});
