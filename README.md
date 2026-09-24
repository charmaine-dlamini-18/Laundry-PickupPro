# Laundry Pickup Pro

A full-stack laundry pickup & delivery demo app for **Customers**, **Drivers**, and an **Admin** dispatch console. Customers book a pickup + delivery, the admin assigns a driver, the driver completes the legs in the field, and chat + notifications keep the order moving — all backed by a live Supabase PostgreSQL database.

## Roles & demo accounts

All accounts are created by `supabase/database.sql` (roles come from the `profiles` table).

| Role    | Email                      | Password           | Notes                |
| ------- | -------------------------- | ------------------ | -------------------- |
| Admin   | admin@laundrypickup.co.za  | Admin!Laundry#2025 | Dispatch / analytics |
| Driver  | sipho@laundrypickup.co.za  | Sipho#Nkosi        | VW Caddy, Woodstock  |
| Driver  | thabo@laundrypickup.co.za  | Thabo$Dube         | Toyota Corolla, Maitland |
| Driver  | jeff@laundrypickup.co.za   | Jeff!Erasmus       | Ford Fiesta, Woodstock |
| Driver  | david@laundrypickup.co.za  | David#Mthe         | Nissan Bakkie, Observatory |
| Driver  | lerato@laundrypickup.co.za | Lerato/Mahlangu    | Toyota Bakkie, Maitland |
| Driver  | zanele@laundrypickup.co.za | Zanele!Ndlovu1     | Hyundai i20, Observatory |

Customers register themselves inside the app.

## Features

**Customer app**
- Book a laundry pickup + delivery (address, time window, items, laundromat, payment method)
- Track order status live, leave reviews, chat with the assigned driver
- Saved addresses, notifications, help & support

**Driver app**
- See only the orders **assigned by the admin** (Pickups & Deliveries)
- Start a route, view order details, complete legs, update status
- Chat with the customer, notifications, profile

**Admin console**
- Real Supabase login (no hardcoded local session)
- Order dashboard: view bookings, **assign drivers**, update order status
- Customers, drivers, payments, reviews, reports, support messages

## Tech stack

- **React Native + Expo** (SDK 57, React 19, TypeScript) with React Navigation
- **Supabase** (`@supabase/supabase-js`) — Postgres, Auth (GoTrue), REST, Realtime
- **react-native-web** for the browser target
- Google Fonts (Poppins), `expo-linear-gradient`, `@react-native-community/datetimepicker`

## Getting started

### Prerequisites

- Node.js 18+
- An Expo + Supabase project (client already targets the Supabase project referenced in `.env`)

### 1. Install

```bash
npm install
```

### 2. Environment

Create/edit `.env` at the repo root:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```


> The deployed app lives at **https://laundry-pickup-pro.vercel.app/**.


### 3. Database

The whole schema lives in one file:

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of `supabase/database.sql` and **Run**.
3. Wait for it to complete to the end (it finishes with a `notify pgrst, 'reload schema';`). If any error appears, fix it and re-run the full file.

The file is idempotent (`create or replace`, guarded drops): creating tables + RLS policies, ~40 security-definer RPCs, realtime subscriptions, and the seed accounts above.

### 4. Run

```bash
npm run web       # browser
npm run ios       # iOS simulator
npm run android   # Android emulator/device
npm start         # Expo dev server
```

## Scripts

| Script          | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm run web`   | Start Expo for web (`react-native-web`)       |
| `npm run ios`   | Start Expo for iOS                            |
| `npm run android` | Start Expo for Android                      |
| `npm start`     | Start the Expo dev server                     |
| `build:web`     | Static export of the web build to `dist/`     |
| `deploy:web`    | Build + serve `dist/` with `npx serve`        |

Typecheck with `npx tsc --noEmit`.

## Project structure

```
src/
  components/          shared UI (modals, alerts, booking header)
  context/             auth, orders (customer/driver/admin), notifications
  hooks/               useAuth and friends
  lib/supabase.ts      Supabase client (publishable key)
  navigation/          customer, driver, admin stacks
  screens/             per-role screens
  services/            RPC wrappers (bookings, orders, chat, addresses, ...)
supabase/
  database.sql         single-file schema + RPCs + seeds (re-run to update)
  functions/           optional Supabase Edge Functions (create/update/delete driver, admin-orders)
```

## How it works

- All data access goes through **security-definer SQL functions** (e.g. `create_booking`, `customer_list_orders`, `driver_list_orders`, `admin_assign_driver`, `chat_send_message`, `customer_add_review`). They enforce role rules server-side and expose a clean `p_*` parameter API to the app (`src/services/*`).
- Row-Level Security is enabled on every table; the app's client key can only touch data the policies allow.
- `create_booking` writes the two driver legs (`driver_orders` P/D), the aggregate `orders` row, `order_items`, `payments`, a `conversations` thread, and an admin notification.
- Real-time sync: the app also polls via RPCs every ~5s (orders, chat every 3s) and subscribes to `postgres_changes` for `driver_assignments` — so updates from any role appear quickly.
- Order lifecycle: `Pending` (unassigned) → **admin assigns a driver** → `Assigned` → driver completes → `Completed`.

## Troubleshooting

- **Bookings don't persist:** the write-RPCs rely on SQL helper functions created in `database.sql`. Re-run the whole file (some sections are additive) and confirm it completes.
- **Order missing from a role:** customer list filters by the logged-in user, driver list only shows admin-assigned orders, admin shows all. Make sure you're signed in as the right account.
- **Wiped demo data:** run `supabase/database.sql` again to recreate the schema + seed accounts (it does not delete existing bookings).
- **Auth errors:** confirm `EXPO_PUBLIC_SUPABASE_URL` / publishable key in `.env` match the project where you ran the SQL.

## License
The MIT License (MIT)
