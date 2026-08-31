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
