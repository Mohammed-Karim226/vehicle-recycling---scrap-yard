# Vehicle Recycling Scrap Yard

## Production setup

Use a pooled PostgreSQL URL for `DATABASE_URL` and a direct database URL for
`DIRECT_URL`. Copy the variable names from `.env.example`; never commit `.env`.

Use a random `ADMIN_SESSION_SECRET` of at least 32 characters. Create the first
database admin after migrations:

```bash
npm run admin:create -- --email=admin@example.com --password="a-strong-password"
```

Running the command again for the same email rotates its password and reactivates
the account. In production,
configure the `vehicle-images` Supabase bucket so anonymous users cannot insert,
update, or delete objects.

Apply migrations and regenerate Prisma before building:

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

Run `runRetentionMaintenance()` from `lib/maintenance/retention.ts` through your
deployment scheduler once per day. The function is intentionally not exposed as
a public route or Server Action.

## DVLA vehicle lookup

Set the private `DVLA_API_KEY` to your production VES key and `DVLA_API_URL` to
`https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles` (the default).
Restart the development server after changing `.env`. For a hosted deployment,
set these same server environment variables and restart or redeploy it.

Verify authentication without requesting any vehicle data:

```bash
npm run dvla:check
```

This sends an empty-registration request and expects HTTP 400 from DVLA's input
validation. To also verify a successful lookup, supply a registration you are
authorised to look up:

```bash
npm run dvla:check -- --registration=YOUR_REGISTRATION
```

UAT requires separately enabled test access and the UAT endpoint
`https://uat.driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`.
Its documented sample registration is `AA19AAA`. DVLA's default account limit is
two requests per second; the quote form asks customers to retry when DVLA returns
HTTP 429 after one bounded retry. The retry respects `Retry-After` when present;
waits longer than two seconds return the busy message instead. Both attempts share
an eight-second deadline. This handles brief throttling but does not increase
DVLA's account quota or enforce a global request queue across server instances.
For sustained traffic above your account quota, request a higher limit from DVLA.

The website separately allows 60 quote attempts per IP address per hour by default.
Set `SCRAP_QUOTE_HOURLY_LIMIT=60` in `.env` or your hosting environment to change
this cap (whole numbers from 1 to 10000), then restart or redeploy. Failed vehicle
lookups also count toward this hourly limit; the same IP's existing counter is
kept when the configured cap changes. The hourly window starts with the first
attempt and resets after one hour. This setting does not change DVLA's quota.

Failed lookups do not create valuations. VES provides MOT status and
expiry; it does not provide mileage, advisories or a vehicle's actual kerb weight.

Run the offline integration regression checks with `npm run test:dvla`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
