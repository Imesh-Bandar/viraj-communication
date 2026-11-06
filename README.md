# Viraj Communication POS

Shop management system: billing with short thermal bills, inventory, gas and water, Nayapotha (customer credit book), reports and settings.

Built with Next.js, Tailwind CSS and MongoDB.

## Setup

1. Install Node.js 20+ and MongoDB, and make sure MongoDB is running.
2. Copy `.env.example` to `.env.local` and set a long random `SESSION_SECRET`.
3. Install and prepare the database:

   ```bash
   npm install
   npm run seed
   ```

   Use `npm run seed -- --demo` to add sample items.
4. Run it with `npm run dev`, or `npm run build` then `npm start` in the shop. Open http://localhost:3000.

First login: `admin` / `admin123`. Change it straight away in Settings.

## Tests

`npm run build`, then `npm run test:e2e`. Playwright uses a separate `viraj_pos_e2e` database and needs MongoDB running.

## Deployment

GitHub Actions runs lint, type checks, the build and Playwright on every push. Vercel deploys `main` automatically. Set `MONGODB_URI`, `MONGODB_DB`, `SESSION_SECRET` and `COOKIE_SECURE=true` in Vercel, and allow Vercel to reach MongoDB Atlas under Network Access.

On Vercel, images are stored in the database because the server has no lasting folder.

## Folder structure

```
src/app/(dashboard)/  Pages behind login, one folder per section
src/app/api/          JSON routes: validate input, then call a service
src/app/receipt/      Short bill for the thermal printer
src/app/uploads/      Serves uploaded images
src/components/       Shared UI, alerts and confirm dialogs
src/services/         Business rules and database work
src/lib/              Database, login, validation and helpers
scripts/seed.mjs      Database setup
uploads/              Uploaded images (details in the "uploads" collection)
```

## Good to know

- Admins manage items, reports, shop settings, users and bill cancelling. Cashiers do billing, gas and water and Nayapotha.
- Back up both the MongoDB database and the `uploads/` folder.
- Printing: set the bill printer as the default and choose 58 mm or 80 mm in Settings.
