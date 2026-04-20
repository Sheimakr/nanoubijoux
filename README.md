# Nano Bijoux

A trilingual (Français / العربية / English) e-commerce platform for a luxury jewelry boutique in Algeria.

Built on Next.js 16 + Supabase, with a full admin dashboard, realtime order notifications, Algerian-specific checkout (58 wilayas, COD, EcoTrack shipping integration), and automatic RTL for Arabic.

**Live Instagram:** [@nano31bijoux](https://www.instagram.com/nano31bijoux/)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| i18n | next-intl v4 (fr / ar / en, URL prefix routing) |
| State | Zustand 5 (cart, wishlist, settings) with localStorage persistence |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | Sonner |
| Forms / Validation | React Hook Form + Zod |

---

## Features

### Storefront
- **Trilingual by default** — FR / AR / EN. Arabic is fully RTL. Content pulls `name_${locale}` / `description_${locale}` from the DB automatically, so every product/category/blog translates the moment an admin fills the fields — **no code changes per item**.
- Multi-image product gallery, localized search, sortable / filterable shop (category, brand, material, price range).
- Cart + wishlist persist across tabs via localStorage.
- One-tap **Buy Now** button skips the cart review and sends the user straight to checkout.
- Auto-discount: **10% off when the cart has 3 or more items**. Stacks with coupon codes.
- Checkout targets the 58 wilayas of Algeria, respects home-delivery vs desk-delivery per wilaya, and honors per-wilaya free-delivery thresholds.
- SEO-ready: per-page `generateMetadata` on product + blog detail routes, `hreflang` alternates across the 3 locales, OpenGraph + Twitter cards.

### Admin
- Separate auth (custom JWT in `admin_users`, not Supabase Auth).
- **Realtime dashboard** — new orders / products appear instantly via Supabase Realtime (no refresh).
- Super Admin vs regular Admin roles with per-permission gating (`orders:view`, `orders:edit`, `users:manage`, `coupons:manage`, …).
- Catalog hub at `/admin/produits` with tabs for **Products / Categories / Brands / Materials** — full CRUD for each.
- Settings panel for site info, hero-slider images (multi-upload), and EcoTrack shipping.
- Coupons / Blog / Orders / Pixels / Delivery pricing — all first-class admin sections.

---

## Getting started

### Prerequisites
- Node.js ≥ 20
- pnpm / npm / yarn (examples use `npm`)
- A Supabase project ([sign up](https://supabase.com))

### 1. Clone + install

```bash
git clone https://github.com/Sheimakr/nanoubijoux.git
cd nanoubijoux
npm install
```

### 2. Environment

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Your live domain, e.g. `https://nanobijoux.dz` | ✅ |
| `ADMIN_USER` | Fallback admin username (bootstrap only) | ✅ |
| `ADMIN_PASS` | Fallback admin password (bootstrap only) | ✅ |
| `ADMIN_SECRET` | JWT signing secret (≥ 32 random chars) | ✅ |

> **Security:** `.env*` is in `.gitignore`. Never commit real keys. Generate `ADMIN_SECRET` with `openssl rand -hex 32`.

### 3. Database

Run the SQL migrations in order inside the Supabase SQL editor, from `supabase/migrations/`:

```
001_admin_users_permissions.sql
002_settings.sql
003_pixels.sql
004_orders_ecotrack.sql
005_products_pixels.sql
006_wilayas_delivery_pricing.sql
007_fix_user_profiles_rls.sql
007_french_only_nullable.sql
008_rls_admin_write_policies.sql
009_platform_v2.sql              ← consolidated v2 changes
```

`009_platform_v2.sql` is **idempotent** — safe to re-run. It:
- Adds `email`, `hero_images` to `settings` (+ dedupes to one row)
- Creates the `materials` table and `products.material_id` FK
- Installs the missing INSERT policies on `orders` / `order_items` (guest checkout fix)
- Enables realtime + public read on `settings`
- Creates 13 hot-path indexes for shop, checkout, and admin queries
- Seeds the 3 luxury jewelry categories (Colliers & Pendentifs, Bagues & Alliances, Bracelets & Joncs) with FR / AR / EN names & descriptions

### 4. Realtime publication

In Supabase → Database → Replication, enable realtime on these tables so live admin / storefront updates fire:
- `orders`
- `products`
- `settings`

Or run:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
```

### 5. Storage

Create a public bucket named `product-images` (or match whatever `uploadProductImage` expects in `src/lib/supabase/admin-queries.ts`). This is where admin-uploaded product / hero / category images live.

### 6. First admin user

After running the migrations, insert a super-admin row so you can log into `/admin/login`:

```sql
-- Password hash format: pbkdf2-sha256 with 100k iterations, "<saltHex>:<hashHex>"
-- Generate with Node: node -e "
--   const c=require('crypto'); const p='yourPassword'; const s=c.randomBytes(16);
--   console.log(s.toString('hex')+':'+c.pbkdf2Sync(p,s,100000,32,'sha256').toString('hex'));
-- "
INSERT INTO admin_users (username, password_hash, display_name, role, permissions, active, created_at)
VALUES ('admin', 'PASTE_GENERATED_HASH_HERE', 'Admin', 'admin', '[]'::jsonb, true, NOW());
```

### 7. Run

```bash
npm run dev        # http://localhost:3000
npm run build
npm start
```

---

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |

---

## Project structure

```
src/
├── app/
│   ├── [locale]/              # Storefront (fr / ar / en via URL prefix)
│   │   ├── page.tsx           # Homepage — hero, categories, featured products
│   │   ├── boutique/          # Product listing + filters
│   │   ├── produit/[slug]/    # Product detail (server page + client view)
│   │   ├── blog/              # Blog list + detail
│   │   ├── panier/            # Cart
│   │   ├── commande/          # Checkout
│   │   ├── mon-compte/        # User account
│   │   ├── a-propos/          # About
│   │   └── livraison/         # Shipping info
│   ├── admin/                 # Admin dashboard (custom JWT auth)
│   │   ├── page.tsx           # Dashboard (stats + recent orders, realtime)
│   │   ├── produits/          # Catalog hub: Products / Categories / Brands / Materials
│   │   ├── commandes/         # Orders
│   │   ├── admins/            # Admin accounts CRUD
│   │   ├── blog/              # Blog CRUD
│   │   ├── coupons/           # Coupons CRUD (super-admin only)
│   │   ├── pixels/            # Tracking pixels (FB / TikTok / GA)
│   │   ├── delivery/          # 58-wilaya pricing
│   │   └── settings/          # Site info + hero images + EcoTrack
│   ├── api/
│   │   ├── admin/             # Protected admin API routes
│   │   └── settings/          # Public read-only settings endpoint
│   ├── layout.tsx             # Root layout (html lang / dir, tracking pixels)
│   ├── sitemap.ts             # Dynamic sitemap
│   └── robots.ts              # Robots.txt
├── components/
│   ├── home/                  # Hero, category grid, featured products, etc.
│   ├── shop/                  # ProductCard, FilterSidebar
│   ├── layout/                # Header, Footer, AnnouncementBar, MobileMenu
│   ├── shared/                # LanguageSwitcher, WhatsAppButton, TrackingPixels
│   └── ui/                    # Design-system primitives (Button, Input, Badge…)
├── stores/
│   ├── cart-store.ts          # Zustand cart with auto-discount
│   ├── wishlist-store.ts
│   └── settings-store.ts      # Live site config via Realtime
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser (anon)
│   │   ├── server.ts          # SSR (anon)
│   │   ├── admin-client.ts    # Service-role (server-only)
│   │   ├── queries.ts         # Public queries
│   │   ├── server-queries.ts  # Server-side queries for SSR
│   │   └── admin-queries.ts   # Admin CRUD queries
│   ├── admin-auth.ts          # PBKDF2 password hashing + JWT
│   ├── metadata.ts            # Per-page SEO metadata builders
│   ├── settings.ts            # Server-side settings loader
│   └── constants.ts           # Site-wide constants
├── hooks/
│   └── use-realtime-table.ts  # Generic Supabase Realtime subscription
├── i18n/
│   ├── routing.ts             # next-intl locales + routing config
│   └── navigation.ts          # Locale-aware Link + useRouter
├── messages/
│   ├── fr.json                # French UI strings
│   ├── ar.json                # Arabic UI strings
│   └── en.json                # English UI strings
├── types/
│   └── index.ts               # Domain types (Product, Category, Order, …)
└── proxy.ts                   # Next middleware: admin JWT auth + i18n routing

supabase/
└── migrations/                # Ordered SQL migrations (001 … 009)
```

---

## Deployment

### Vercel (recommended)

1. Push this repo to GitHub.
2. Import into Vercel.
3. Add the 7 env vars from `.env.local.example` in Vercel → Project → Settings → Environment Variables.
4. Deploy.

### Self-hosting

`npm run build && npm start` on any Node 20+ host. Remember to set the env vars in your process manager (systemd / PM2 / Docker).

---

## Known follow-ups

These were flagged in a senior-dev audit and are **not blockers for launch**, but should be addressed before heavy traffic:

- **Tighten RLS**: current migration 008 opens most tables with `USING (true)` — sufficient for a pre-launch private demo, not for production. Add per-role scoping (`auth.uid()` checks).
- **Remove the fallback admin credentials** in `src/app/api/admin/auth/route.ts` (`admin/admin123`) and throw on missing `ADMIN_SECRET` instead of falling back to a hardcoded default.
- **Add a Product JSON-LD `<script>`** to the product detail page for Google Shopping rich results.
- **Capture email at checkout** so customers get order confirmations / tracking / abandoned-cart recovery.
- **Rate-limit `/api/admin/auth/login`** — brute-force protection.
- Swap Unsplash placeholder URLs for the real seeded product shots (upload to Supabase Storage and `UPDATE product_images SET url = …`).

---

## License

Private. All rights reserved © Nano Bijoux.
