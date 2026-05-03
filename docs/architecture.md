# Architecture Notes

## Current Folder Structure

### App Layer

- `src/app`
  - route handlers
  - layouts
  - pages
  - admin, seller, storefront, auth route groups

### Screen Layer

- `src/components/screens`
  - page-level orchestration only
  - split by domain where possible
- `src/components/screens/admin`
  - admin products, sellers, orders, users, reviews, coupons, settings
- `src/components/screens/commerce`
  - cart, checkout, checkout success

### Storefront Shared Layer

- `src/components/storefront`
  - `types.ts`
  - `api.tsx`
  - `media.ts`
  - `primitives.tsx`
  - `product-card.tsx`
  - `chrome.tsx`
    - desktop mega-menu
    - mobile full-screen drawer navigation
    - role-aware quick links
    - cart drawer shell

### Reusable UI

- `src/components/ui`
  - modal, button, input, badge, pagination, skeletons, order timeline, coupon input, vendor modal

### Domain Layer

- `src/lib/models`
  - mongoose schemas
- `src/lib/services`
  - seller lifecycle
  - coupon validation and discovery
  - order creation and admin order status lifecycle
  - notification writes
  - review approval aggregation
- `src/lib`
  - `redis.ts`
  - `cache.ts`
  - `rate-limit.ts`
  - `otp.ts`

## Service Layer Responsibilities

### seller.service.ts

- seller application creation and reapplication
- admin approval/rejection
- role promotion/demotion side effects
- seller notification/email orchestration

### coupon.service.ts

- available coupon discovery
- eligibility checks
- discount calculation
- audience and per-user restrictions

### order.service.ts

- checkout order creation
- order total composition
- admin status transition lifecycle
- customer status emails

### notification.service.ts

- notification creation
- seller application notification cleanup

### review.service.ts

- review approval
- product rating aggregate recalculation

## Main Runtime Flows

### Vendor Apply To Seller Access

1. user submits vendor application
2. seller service persists application
3. notification created for admin
4. admin approves
5. seller service updates seller record and user role
6. seller gains dashboard access

### Coupon Validation

1. UI requests available coupons or validates manual code
2. route authenticates and validates input
3. coupon service checks expiry, usage, audience, limits
4. response returns stable discount payload

### OTP Verification

1. auth route validates input
2. OTP helper stores short-lived codes in Redis when configured
3. cooldown, attempts, and lockout are enforced in the same layer
4. legacy DB OTP fields remain as fallback compatibility path

### Checkout To Order

1. checkout submits cart, address, payment method
2. route validates payload
3. order service validates products and variants
4. shipping and coupon adjustments are applied
5. order is created
6. payment-specific flow continues

### Review Approval

1. admin approves pending review
2. review service marks review approved
3. service recalculates product rating totals

## Setup And Deployment Notes

- use `.env.example` as the canonical local template
- production requires valid values for MongoDB, NextAuth, SMTP, Cloudinary, Razorpay, and Stripe
- Upstash Redis is optional but recommended for OTP, cache, and rate limiting
- NextAuth callback URLs must match deployed hostname
- Stripe webhook endpoint and secret must align with deployment target
- Cloudinary credentials must support upload/delete actions used by admin/media routes

## Testing Strategy

Current high-value tests focus on service-level workflows with mocked model boundaries:

- seller apply -> approve -> role promotion
- coupon validation rules
- checkout -> order creation totals
- review approval aggregate updates

The runner lives under `tests/` and executes through `npm run test`.

This keeps tests stable while avoiding brittle UI-coupled coverage.
