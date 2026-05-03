# StyleHub

StyleHub is a full-stack multi-role streetwear ecommerce platform built on Next.js App Router. It supports customer shopping, seller onboarding and operations, and admin controls for merchandising, fulfillment, moderation, promotions, notifications, and store configuration.

## What The Project Includes

- Customer storefront with product discovery, search, wishlist, cart, checkout, orders, profile, reviews, and notifications
- Seller onboarding flow with admin approval and seller dashboard access
- Admin operations for products, orders, users, reviews, sellers, coupons, notifications, analytics, and store settings
- Coupon targeting, loyalty shipping rules, moderation workflows, audit logs, homepage campaign controls, verified purchase reviews, and payment integrations

## Core Roles

- `user`: browse, buy, review, wishlist, manage profile and addresses
- `seller`: manage seller dashboard and catalog after approval
- `admin`: operate all back-office flows

## Tech Stack

- Next.js 14 App Router
- React 18 + TypeScript
- NextAuth for auth/session
- MongoDB + Mongoose
- Zustand for client state
- Zod for request validation
- Tailwind CSS + inline premium theme styling
- Cloudinary for media
- Razorpay and Stripe for payments
- Nodemailer for transactional email

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Copy the environment template

```bash
copy .env.example .env.local
```

3. Fill in all required environment values in `.env.local`

4. Start development

```bash
npm run dev
```

5. Seed sample data if needed

```bash
npm run seed
```

Seed behavior:
- recreates catalog categories and products against the current variant-pricing schema
- preserves the configured admin account and recreates the official seller profile
- generates active variants with real per-variant `price`, `compareAtPrice`, `stock`, `sku`, and safe image fallback
- keeps product-level `price` / `discountPrice` compatible as listing-facing values derived from the seeded variants
- guarantees every seeded category has at least 2 products

## Environment Variables

See [`.env.example`](D:\New folder\codex\stylehub\.env.example) for the exact template.

Required groups:

- Database
  - `MONGODB_URI`
- Auth
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_GOOGLE_ENABLED`
- Email
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `ADMIN_EMAIL`
- Media
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Payments
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Redis / Upstash
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

## Main Scripts

- `npm run dev`: local development
- `npm run build`: production build
- `npm run start`: run built app
- `npm run typecheck`: TypeScript validation without depending on generated `.next/types`
- `npm run lint`: ESLint
- `npm run test`: high-value service workflow tests
- `npm run seed`: seed sample data into MongoDB
- `npm run clean:next`: remove stale Next output manually

## Architecture Overview

### App Layer

- `src/app`: routes, API handlers, layout, pages
- `src/components/screens`: page-level screen orchestration
- `src/components/ui`: reusable UI building blocks
- `src/components/admin`: admin layout/widgets
- `src/components/storefront`: shared storefront types, helpers, chrome, and product card building blocks

### Domain Layer

- `src/lib/models`: mongoose schemas
- `src/lib/services`
  - `seller.service.ts`
  - `coupon.service.ts`
  - `order.service.ts`
  - `notification.service.ts`
- `src/lib`: auth, DB, redis/cache/rate-limit helpers, validators, route helpers, shipping rules, size rules

### State

- `src/stores/cart-store.ts`
- `src/stores/wishlist-store.ts`

## Important Business Flows

### Customer Purchase Flow

1. Browse products
2. Select a purchasable variant
3. Add exact variant to cart with price snapshot
3. Apply coupon if eligible
4. Checkout with saved or new address
5. Shipping fee resolved from store config and loyalty rules
6. Server revalidates product + variant + price + stock
7. Create order with variant snapshot
8. Pay through COD, Razorpay, or Stripe
9. Track order from profile/orders

### Seller Onboarding Flow

1. User visits `/sell-on-stylehub`
2. Opens vendor apply modal
3. Submits seller application
4. Admin receives notification
5. Admin reviews in `/admin/sellers`
6. Approve or reject
7. Approval updates user role to `seller`
8. Seller accesses `/seller/dashboard`

### Review Moderation Flow

1. Customer submits review
2. Admin reviews in `/admin/reviews`
3. Verified purchases are marked automatically from delivered orders
4. Approved reviews update product rating aggregates

### Homepage Campaign Flow

1. Admin updates homepage content from `/admin/settings`
2. Store config persists hero copy, CTA links, campaign media, promo content, and homepage product picks
3. Storefront homepage consumes the managed content with safe fallback defaults

### Mobile Navigation Flow

1. Desktop keeps the existing multi-column category dropdown
2. Mobile uses a dedicated full-screen drawer instead of the desktop mega-menu layout
3. Categories open in grouped accordions for men, women, and unisex
4. Mobile uses a fixed bottom navigation bar for the most frequent actions
5. The drawer is now the deeper navigation layer and the footer is reduced to session actions / non-primary utilities

### Audit Log Flow

1. Key admin actions write structured audit events
2. Audit events capture actor, action, target entity, target id, summary, and metadata
3. Recent activity is visible in `/admin/settings`

### Coupon Flow

1. Admin creates coupon with audience and category constraints
2. Customer sees available coupons in cart/checkout
3. Validation checks expiry, usage, audience, per-user limit, and order requirements
4. Discount is applied to order creation

### Variant Pricing Flow

StyleHub now treats product variants as the source of truth for purchasable data.

- `product.price` / `product.discountPrice` remain listing-facing “starting from” values derived from active variants
- each variant can carry its own:
  - `price`
  - `compareAtPrice`
  - `stock`
  - `sku`
  - `image`
  - `isActive`
- cart lines store:
  - `productId`
  - `variantId`
  - selected size/color
  - price snapshot
  - compare-at snapshot
  - SKU snapshot
- checkout validation resolves the exact variant first by `variantId`, then falls back to size/color for legacy compatibility
- order items persist the variant snapshot used at purchase time, so analytics and order history use historical purchase values, not current catalog prices

### Seeded Catalog Compatibility

- the seed script creates variant-priced products, not legacy flat-price variants
- SKU generation is deterministic per product/color/size combination
- seeded variant prices use controlled size/color adjustments so catalog pricing stays realistic
- product detail, cart, checkout, and order validation all operate correctly against the seeded catalog because each seeded variant is active, stocked, and price-aware

### Legacy Product Compatibility

- existing products without fully priced variants continue to work
- product-level prices are used as fallback when a legacy variant has no explicit compare-at value
- the product model derives listing prices from active variants when they exist
- older carts/orders that only know size/color are still validated through a fallback variant lookup path

### Shipping Rules Flow

1. Admin configures base fee, free-shipping threshold, COD rules, and loyalty shipping rules
2. Checkout fetches computed shipping from `/api/store-config/shipping`
3. Order creation uses the same calculation on the server

## API Design Notes

Routes are being normalized around this pattern:

1. authenticate/authorize
2. validate input
3. call service layer
4. return stable JSON response

High-value service-backed flows already moved out of route handlers:

- seller application lifecycle
- coupon validation and discovery
- order creation orchestration
- notification creation/read updates

## Redis Behavior

Redis is optional. When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present, StyleHub uses Upstash Redis for:

- OTP state and cooldown control
- failed attempt counting and temporary OTP lockouts
- rate limiting on auth, coupon, and review endpoints
- selective caching on safe read-heavy routes

### OTP Defaults

- signup/email verification OTP expiry: 5 minutes
- password reset OTP expiry: 5 minutes
- resend cooldown: 60 seconds
- max failed verification attempts: 5
- temporary lockout: 10 minutes

### Cached Routes

- `/api/homepage-content`
- `/api/products/featured`
- `/api/products/new-arrivals`
- `/api/categories`
- `/api/admin/dashboard`
- `/api/admin/analytics`

### Rate-Limited Routes

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/resend-otp`
- `/api/auth/verify-otp`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/coupons/available`
- `/api/coupons/validate`
- `/api/reviews`

### Fallback Behavior

- if Redis is not configured, the app falls back to direct DB reads for cached routes
- OTP and rate limiting fall back to in-memory behavior where practical
- business-critical paths such as checkout, payment verification, stock mutation, and final order creation do not depend on Redis as source of truth

## Next.js Build Stability

StyleHub now runs a lightweight preflight before `npm run dev` and `npm run build`.

- `scripts/ensure-next-output.mjs` validates `.next` manifests and server chunk references
- if the current `.next` output is internally inconsistent, it removes only the stale `.next` directory and lets Next regenerate it cleanly
- this is specifically intended to recover from chunk-manifest drift such as missing `/_next/static/...` files or missing server chunk references after interrupted refactors/builds

### Why this exists

The app uses the Next App Router and a large number of dynamic route/module boundaries. During heavy refactors, stale `.next` output can leave:

- dev chunk manifests pointing at files that no longer exist
- server runtime files referencing removed chunk ids
- auth/vendor chunk references that no longer match the current source graph

The preflight avoids carrying that broken state into the next `dev` or `build` run.

### Recovery Workflow

If you still see missing `/_next/static/...` assets or missing server chunk errors locally:

1. stop the dev server
2. run `npm run clean:next`
3. restart with `npm run dev`

The normal `dev` and `build` scripts already do targeted `.next` validation, so manual cleanup should only be needed if a local process is interrupted mid-compile.

## Mobile UX Notes

- mobile bottom nav is the primary high-frequency navigation layer
- the mobile drawer remains for categories, deeper links, and logout/session actions
- normal browse pages use an explicit responsive `2 / 3 / 4` product grid
- first hard app entry shows a short branded splash once per session
- tapping the active mobile bottom-nav tab scrolls to top instead of re-navigating
- homepage product modules use editorial rails/patterns instead of reusing the standard browse grid

## Testing

Current automated coverage focuses on stable, high-value service workflows instead of brittle UI snapshots:

- vendor apply -> admin approve -> seller role promotion
- coupon eligibility and discount validation
- checkout -> order creation totals
- admin review approval -> product rating aggregation

Run:

```bash
npm run test
```

The workflow runner uses mocked model boundaries so the tests stay fast and deterministic.

## Main Routes

### Storefront

- `/`
- `/products`
- `/products/[slug]`
- `/search`
- `/cart`
- `/checkout`
- `/orders`
- `/orders/[id]`
- `/wishlist`
- `/profile`
- `/sell-on-stylehub`

### Auth

- `/login`
- `/register`
- `/verify-email`
- `/forgot-password`

### Seller

- `/seller/dashboard`

### Admin

- `/admin/dashboard`
- `/admin/products`
- `/admin/orders`
- `/admin/reviews`
- `/admin/users`
- `/admin/sellers`
- `/admin/coupons`
- `/admin/settings`

## Integrations

### MongoDB

- Primary persistence for users, products, orders, sellers, coupons, reviews, notifications, and store config

### NextAuth

- Session auth for user, seller, and admin role-aware access

### Upstash Redis

- Optional but recommended for OTP reliability, selective caching, and route rate limiting
- App remains functional without it

### Cloudinary

- Product and avatar uploads

### Razorpay / Stripe

- Razorpay order creation and verification for India-first payments
- Stripe payment intent/webhook support for alternate card flows

### Nodemailer

- OTP, approval/rejection, and order communication

## Deployment Notes

- Ensure production values for `NEXTAUTH_URL` and callback origins
- Stripe webhooks require the correct deployed endpoint and `STRIPE_WEBHOOK_SECRET`
- Razorpay keys must match the target environment
- Cloudinary credentials must allow uploads/deletes used by admin/media APIs
- Email provider must allow SMTP from the deployment environment
- Upstash Redis credentials are optional but recommended for production resilience on OTP, cache, and rate limiting

## Refactor Notes

The current refactor moved the codebase from monolithic screen files toward a more maintainable structure while preserving routes and UI behavior. See [docs/refactor-summary.md](D:\New folder\codex\stylehub\docs\refactor-summary.md) for the structural changes and remaining technical debt.

For the current module map and service-layer responsibilities, see [docs/architecture.md](D:\New folder\codex\stylehub\docs\architecture.md).
#   s t t y l e h u b  
 