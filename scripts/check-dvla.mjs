import nextEnv from '@next/env';
import { parseArgs } from 'node:util';

const { loadEnvConfig } = nextEnv;

const productionUrl = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
const uatUrl = 'https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';

async function main() {
  const { values } = parseArgs({
    options: { registration: { type: 'string' }, help: { type: 'boolean' } },
  });
  if (values.help) {
    console.log('npm run dvla:check [-- --registration=YOUR_REGISTRATION]');
    console.log('Without a registration, checks authentication using an empty-registration validation request.');
    return;
  }

  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production', { info() {}, error() {} });
  const apiKey = process.env.DVLA_API_KEY?.trim();
  const apiUrl = process.env.DVLA_API_URL?.trim() || productionUrl;
  if (!apiKey) throw new Error('Set DVLA_API_KEY in .env or the server environment.');
  if (apiUrl !== productionUrl && apiUrl !== uatUrl) {
    throw new Error('DVLA_API_URL must use the official production or UAT endpoint.');
  }
  const registration = values.registration?.replace(/[\s-]/g, '').toUpperCase();
  if (values.registration !== undefined && !/^[A-Z0-9]{2,12}$/.test(registration || '')) {
    throw new Error('Enter an alphanumeric vehicle registration (spaces and hyphens are allowed).');
  }

  let response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ registrationNumber: registration || '' }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new Error('DVLA could not be reached. Check connectivity and try again.');
  }

  const environment = apiUrl === productionUrl ? 'production' : 'UAT';
  if (!registration && response.status === 400) {
    await response.body?.cancel();
    console.log(`DVLA ${environment} authentication check passed (HTTP 400 request validation).`);
    console.log('No vehicle data was requested. Supply --registration to verify a vehicle lookup.');
    return;
  }
  if (registration && response.ok) {
    let vehicle;
    try {
      vehicle = await response.json();
    } catch {
      throw new Error('DVLA returned invalid JSON.');
    }
    if (typeof vehicle?.registrationNumber !== 'string' ||
      vehicle.registrationNumber.replace(/\s/g, '').toUpperCase() !== registration) {
      throw new Error('DVLA returned an unexpected vehicle response.');
    }
    console.log(`DVLA ${environment} vehicle lookup passed (HTTP ${response.status}).`);
    return;
  }

  await response.body?.cancel();
  const hints = {
    400: 'Check the registration format.',
    401: 'Check the API key and its environment access.',
    403: 'Check the API key and its environment access.',
    404: 'DVLA has no vehicle record for this registration.',
    429: 'The DVLA account request limit was reached. Wait and retry.',
  };
  throw new Error(`DVLA ${environment} check failed (HTTP ${response.status}). ${hints[response.status] || 'Try again later.'}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'DVLA check failed.');
  process.exitCode = 1;
});
