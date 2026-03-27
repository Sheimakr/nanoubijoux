# Nano Bijoux — E-Commerce Jewelry Store

A modern, multilingual e-commerce website for an Algerian jewelry & accessories boutique.

**Live Instagram:** [@nano31bijoux](https://www.instagram.com/nano31bijoux/)

---

## Tech Stack

| Technology | Role |
|---|---|
| Next.js 16 | Framework (App Router, SSR) |
| React 19 | UI library |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Styling with RTL support |
| Supabase | Backend — Auth, Database, Storage (planned) |
| Zustand | Client state (cart, wishlist) with localStorage |
| next-intl | Internationalization (FR / AR / EN) |
| Framer Motion | Animations |
| Radix UI | Accessible UI primitives |
| React Hook Form + Zod | Form validation |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles & theme
│   ├── [locale]/                   # Locale-based routing (fr/ar/en)
│   │   ├── page.tsx                # Home page
│   │   ├── boutique/page.tsx       # Shop with filters
│   │   ├── produit/[slug]/page.tsx # Product detail
│   │   ├── panier/page.tsx         # Cart
│   │   ├── commande/page.tsx       # Checkout (4-step)
│   │   ├── connexion/page.tsx      # Login
│   │   ├── inscription/page.tsx    # Register
│   │   ├── mon-compte/page.tsx     # Account dashboard
│   │   ├── a-propos/page.tsx       # About
│   │   ├── contact/page.tsx        # Contact + FAQ
│   │   ├── blog/page.tsx           # Blog listing
│   │   └── livraison/page.tsx      # Shipping info
│   └── admin/                      # Admin panel (not built yet)
├── components/
│   ├── home/                       # Hero, categories, featured, newsletter
│   ├── layout/                     # Header, footer, mobile menu, announcement
│   ├── shop/                       # Product card, filter sidebar
│   ├── shared/                     # Language switcher, WhatsApp, scroll-to-top
│   └── ui/                         # Button, Input, Badge, SectionHeading
├── stores/
│   ├── cart-store.ts               # Cart with persistence & discount logic
│   └── wishlist-store.ts           # Wishlist with persistence
├── i18n/                           # next-intl routing & request config
├── lib/
│   ├── constants.ts                # Site config, categories, brands
│   ├── utils.ts                    # cn(), formatPrice(), slugify()
│   └── supabase/                   # Client & server Supabase clients (stubs)
├── messages/
│   ├── fr.json                     # French translations
│   ├── ar.json                     # Arabic translations
│   └── en.json                     # English translations
└── types/
    └── index.ts                    # Full TypeScript type definitions
```

---

## Features

### Completed (Frontend)
- [x] Responsive, mobile-first design
- [x] Multilingual support (French, Arabic with RTL, English)
- [x] Home page with hero slider, categories, featured products, Instagram feed
- [x] Shop page with category/brand/price/material filters
- [x] Product detail with image gallery, variants, reviews tab
- [x] Shopping cart with quantity controls & 10% discount at 3+ items
- [x] Wishlist with toggle functionality
- [x] 4-step checkout (info, shipping with 58 wilayas, payment, confirmation)
- [x] Login & registration forms
- [x] Account dashboard
- [x] Contact page with form & FAQ accordion
- [x] About, shipping info, blog pages
- [x] Floating WhatsApp button
- [x] Announcement bar with dismiss
- [x] Smooth animations (Framer Motion)
- [x] Reusable UI component kit

### Not Yet Implemented (Backend)
- [ ] Supabase database setup & integration
- [ ] Authentication (Supabase Auth)
- [ ] Real product data from database
- [ ] Order processing & storage
- [ ] Payment integration (BaridiMob, CCP, COD)
- [ ] Email notifications
- [ ] Search functionality
- [ ] Admin panel (CRUD for products, orders, customers, blog)
- [ ] Image upload & storage
- [ ] SEO optimization & sitemap

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone <repository-url>
cd nano-bijoux
npm install
```

### Environment Setup

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Security

### Safe to Share
- All source code in `src/` — no hardcoded credentials
- `package.json`, config files, translations
- `.gitignore` properly excludes sensitive files

### Never Share or Commit
| File | Contains |
|---|---|
| `.env.local` | Supabase URL & keys |
| `~/.claude/.credentials.json` | Claude AI OAuth tokens |
| `~/.claude/settings.json` | Service role keys, project IDs |
| `../.mcp.json` | Supabase MCP access token |

---

## Deployment Roadmap

1. **Backend Foundation** — Supabase tables, seed data, API routes
2. **Authentication** — Supabase Auth, protected routes
3. **Core E-commerce** — Real products, orders, payments, emails
4. **Admin Panel** — Product/order/customer/blog management
5. **Production** — Deploy to Vercel, connect nanobijoux.dz, analytics

---

## Business Info

- **Currency:** Algerian Dinar (DA / DZD)
- **WhatsApp:** +213 549 63 12 36
- **Email:** contact@nanobijoux.dz
- **Instagram:** [@nano31bijoux](https://www.instagram.com/nano31bijoux/)
- **Delivery:** All 58 Algerian wilayas
- **Payment Methods:** Cash on Delivery, BaridiMob, CCP

---

## License

Private project — All rights reserved.
