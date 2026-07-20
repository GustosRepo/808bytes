# Phase 4 Commerce And Auth Technical Spec

Last updated: 2026-07-17

## Purpose

Define the implementation contract for cart, checkout, download delivery, and phased auth/access.

## Scope

In scope:
- Cart state and cart UI
- Paid checkout flow
- Free-product delivery flow
- Order confirmation states (success, failure)
- Secure download delivery
- Optional customer portal planning
- Separate admin access model planning

Out of scope:
- Full customer account requirement before checkout
- Refund automation (manual support workflow is acceptable initially)
- Subscription billing

## Architecture Decisions

Recommended baseline stack:
- App framework: Next.js App Router route handlers
- Payment provider: Stripe Checkout
- Database: Postgres (Supabase or Neon are acceptable)
- Email: transactional provider (Resend or equivalent)
- File storage: object storage with signed URL support (S3/R2/Supabase Storage)

Design rules:
- Guest-first checkout by default
- Separate admin auth from customer auth
- Server-side authorization for all order/download actions
- Expiring, signed download access only

## Data Model Additions

## CustomerIdentity
Fields:
- id (string uuid)
- email (string, unique, normalized)
- authType (enum: guest, magic_link)
- createdAt (datetime)
- lastLoginAt (datetime nullable)

## Order
Additional fields beyond current model:
- customerIdentityId (string uuid nullable)
- email (string required)
- paymentProvider (enum: stripe, none)
- paymentIntentId (string nullable)
- checkoutSessionId (string nullable)
- fulfillmentStatus (enum: pending, ready, delivered, failed)
- failureReason (string nullable)
- currency (string)
- updatedAt (datetime)

## OrderItem
Fields:
- id (string uuid)
- orderId (string uuid)
- productId (string)
- titleSnapshot (string)
- typeSnapshot (enum: vst, pack, oneshot, merch)
- isFreeSnapshot (boolean)
- unitPriceSnapshot (number)
- quantity (number)
- lineTotal (number)

## DownloadGrant
Fields:
- id (string uuid)
- orderId (string uuid)
- orderItemId (string uuid)
- productId (string)
- tokenHash (string)
- expiresAt (datetime)
- maxDownloads (number)
- downloadCount (number)
- revokedAt (datetime nullable)
- createdAt (datetime)

## MagicLinkToken
Fields:
- id (string uuid)
- customerIdentityId (string uuid)
- tokenHash (string)
- expiresAt (datetime)
- consumedAt (datetime nullable)
- createdAt (datetime)

## AdminUser
Fields:
- id (string uuid)
- email (string unique)
- role (enum: admin, support)
- mfaEnabled (boolean)
- createdAt (datetime)
- lastLoginAt (datetime nullable)

## AdminAuditLog
Fields:
- id (string uuid)
- adminUserId (string uuid)
- action (string)
- entityType (string)
- entityId (string)
- metadataJson (json)
- createdAt (datetime)

## API Surface (Route Handlers)

Public and customer routes:
- POST /api/cart/quote
  - Input: product ids and quantities
  - Output: validated prices, subtotal, tax, total
- POST /api/checkout/session
  - Creates Stripe Checkout session for paid carts
- POST /api/checkout/free
  - Creates order and fulfillment for free-only carts
- POST /api/webhooks/stripe
  - Verifies Stripe signature, marks paid orders, triggers fulfillment
- GET /api/orders/:orderId
  - Returns order summary if request is authorized by token/session
- POST /api/orders/:orderId/resend
  - Resends confirmation and download links to order email
- GET /api/download/:grantToken
  - Verifies grant token and returns signed storage URL (short expiry)
- POST /api/auth/magic-link/request
  - Requests login link by email
- GET /api/auth/magic-link/verify
  - Verifies token and starts customer session

Admin routes (separate auth):
- GET /api/admin/orders
- POST /api/admin/orders/:id/refund-mark
- POST /api/admin/products/:id/publish
- GET /api/admin/audit-logs

## Checkout And Fulfillment Flows

Paid flow:
1. User starts checkout from cart.
2. Create Stripe session and pending order.
3. Stripe webhook confirms payment.
4. Create download grants for digital items.
5. Send receipt + download access email.

Free flow:
1. User provides email for free cart.
2. Create order with status paid and fulfillment ready.
3. Create download grants.
4. Send receipt + download access email.

Order states:
- pending -> paid -> fulfilled (logical: fulfillmentStatus ready/delivered)
- pending -> failed
- paid -> refunded (manual/admin for v1)

## Auth Strategy

Customer:
- Default: no account required for checkout
- Optional portal later: magic-link only
- Order access granted by verified email token or magic-link session

Admin:
- Separate login path and session scope
- MFA required before production launch
- Role checks performed server-side for every admin route

## Security Requirements

- Verify webhook signatures before mutating orders
- Store token hashes, not raw tokens
- Use short-lived signed file URLs
- Apply rate limits to auth and download endpoints
- Keep least-privilege storage credentials on server only
- Log sensitive admin actions to audit table

## Milestones

M1: Commerce foundation
- Cart quote endpoint [implemented]
- Paid checkout session creation [implemented]
- Stripe webhook handling [implemented]
- Free checkout endpoint [implemented]
- Order success/failure pages

M2: Fulfillment reliability
- Download grant generation
- Signed URL download endpoint
- Receipt and resend email endpoints
- Basic support tooling for failed fulfillment

M3: Access layer
- Magic-link customer portal (optional, post-checkout)
- Admin login with RBAC baseline
- Admin audit logging

## Done Criteria For This Spec

- Phase 4 implementation can begin from this document without open architectural decisions.
- Every checkout/download flow has a defined API and security control.
- Customer and admin auth boundaries are explicit and separate.
