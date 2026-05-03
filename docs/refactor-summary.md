# Refactor Summary

## Goal

Move StyleHub from a strong prototype structure toward an early-production-grade layout without changing product scope, routes, or visual identity.

## What Changed

### 1. Service Layer Introduced

New domain services under `src/lib/services`:

- `seller.service.ts`
- `coupon.service.ts`
- `order.service.ts`
- `notification.service.ts`

These now own business rules and orchestration for:

- seller application lifecycle
- coupon discovery and validation
- order creation workflow
- notification creation and seller-application notification read state

### 2. Large Screen Files Split

#### `src/components/screens/admin-management.tsx`

Replaced with a barrel export. Screen implementations moved into:

- `src/components/screens/admin/products-screen.tsx`
- `src/components/screens/admin/sellers-screen.tsx`
- `src/components/screens/admin/orders-screen.tsx`
- `src/components/screens/admin/users-screen.tsx`
- `src/components/screens/admin/reviews-screen.tsx`
- `src/components/screens/admin/coupons-screen.tsx`
- `src/components/screens/admin/settings-screen.tsx`
- shared admin helpers/types in `src/components/screens/admin/shared.tsx`

#### `src/components/screens/shared.tsx`

Replaced with a barrel export. Shared storefront code moved into:

- `src/components/storefront/types.ts`
- `src/components/storefront/api.tsx`
- `src/components/storefront/media.ts`
- `src/components/storefront/primitives.tsx`
- `src/components/storefront/product-card.tsx`
- `src/components/storefront/chrome.tsx`

#### `src/components/screens/commerce.tsx`

Replaced with a barrel export. Implementations moved into:

- `src/components/screens/commerce/cart-page-screen.tsx`
- `src/components/screens/commerce/checkout-page-screen.tsx`
- `src/components/screens/commerce/checkout-success-page-screen.tsx`

### 3. Route Simplification

Routes refactored to call services instead of embedding full business workflows:

- `src/app/api/seller/apply/route.ts`
- `src/app/api/admin/sellers/[id]/approve/route.ts`
- `src/app/api/admin/sellers/[id]/reject/route.ts`
- `src/app/api/coupons/available/route.ts`
- `src/app/api/coupons/validate/route.ts`
- `src/app/api/orders/route.ts`

### 4. Documentation Added

- real `README.md`
- `.env.example`
- `docs/architecture.md`
- this refactor summary

### 5. Workflow Tests Added

High-value automated workflow checks now live under `tests/` and cover:

- seller apply -> approve -> role promotion
- coupon validation rules
- checkout -> order creation totals
- review approval aggregate updates

## Safe Compatibility Decisions

- Existing imports from `@/components/screens/shared` still work through re-exports
- Existing imports from `@/components/screens/admin-management` still work through re-exports
- Existing imports from `@/components/screens/commerce` still work through re-exports
- Existing page routes and API routes remain stable

## Remaining Technical Debt

### High Value Next

- Add workflow integration tests for seller approval, checkout, coupon eligibility, and review moderation
- Continue moving order status transitions and review-approval aggregation logic deeper into services
- Break down some remaining large screen files such as `catalog.tsx`, `account.tsx`, and `dashboards.tsx`

### Nice To Have

- Consolidate duplicate button/input primitives so screen imports use `src/components/ui` directly over time
- Add route-level contract tests for the most important admin and checkout APIs
- Add architectural decision notes for payment orchestration and notification model choices
