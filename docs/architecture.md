# CREATOR.STACK — System Architecture

## Overview
CreatorStack is a B2B marketplace connecting Indian micro-influencers (10K–500K followers) 
with brands for structured, contract-backed sponsorship deals.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS (utility-first) |
| Auth | Firebase Authentication (Google OAuth) |
| Database | Firestore (NoSQL, real-time) |
| Storage | Firebase Storage (future: brand logos, PoD uploads) |
| Payments | Simulated → Razorpay (when live) |
| Hosting | Vercel |

---

## Data Model

### `users/{uid}`
Single source of truth for all user identity data.
```
{
  uid, email, role: 'creator' | 'brand',
  profileCompleted: boolean,
  kycStatus: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected',
  escrowWallet: { balance, lockedBalance, availableBalance, currency: 'INR' },
  // Creator-specific:
  channelVerified, panVerified, upiVerified,
  legalName, pan, upi, niche, language, follower_count,
  // Brand-specific:
  companyName, website, industry, verificationTier, verificationStatus,
  corporatePan, gstin?,
}
```

### `creators/{uid}`
Public discovery index — denormalized from users for matchmaking queries.
Security rule: any authenticated user can read, only owner can write.

### `campaigns/{campaignId}`
Brand campaigns available for creator applications.
```
{ brandId, brandName, title, description, niche, budget, deliverables, status }
```

### `dealRooms/{campaignId}_{creatorId}`
One deal room per (campaign, creator) pair.
```
{
  status: DealStatus,  // state machine
  amount, productionDays, deliverables,
  creatorSignatureName, creatorSignedAt, brandSignedAt,
  escrowLockedAt, podVideoLink,
  grossAmount, tdsAmount, platformFee, netPayout
}
```

### `adminReviews/{autoId}`
Write-only from client — brand/creator KYC submissions.
Read-only via Admin SDK.
```
{ userId, userRole, pan, gstin?, cin?, channelUrl, status: 'pending', submittedAt }
```

### `walletTransactions/{autoId}`
Immutable audit log. No updates or deletes.
```
{ userId, type: 'deposit'|'lock'|'release'|'withdrawal', amount, description, createdAt }
```

---

## Key Architecture Decisions

### 1. KYC is Never Auto-Approved
`kycStatus` on user documents is ONLY set to `'verified'` via Firebase Admin SDK 
(server-side) after human review. Client-side code can only set `'submitted'`.

### 2. Escrow is Wallet-Based
No real Razorpay integration yet. Brands deposit to a virtual wallet stored in Firestore.
When a deal is locked, `availableBalance` decreases and `lockedBalance` increases atomically.
When released, creator's `pendingEarnings` increases.

Replace with real Razorpay Escrow when live: see `src/lib/razorpay.ts`.

### 3. Deal Room State Machine
```
TERMS → CONTRACT → ESCROW → PRODUCTION → AI_CHECK → RELEASED
         ↑                                    ↓
         └──── contract_amendment_requested ──┘
         
         PRODUCTION → disputed (if brand raises revision)
```

### 4. YouTube OAuth vs URL Paste
- OAuth (`channelVerified: true`): Channel is cryptographically linked to Google account.
  Cannot be spoofed. Gets "Brand Ready" badge.
- URL paste (`isEstimate: true`): Metrics are estimated from URL hash. No verification.
  Shows "Self-Reported" badge.

### 5. Security Rules Enforcement
- Users can ONLY read/write their own `users/{uid}` document
- `adminReviews` is write-only from client, read-only from Admin SDK
- `walletTransactions` are immutable once created
- Deal rooms are readable only by the two parties involved
- See `firestore.rules` for full rules

---

## File Structure
```
src/
├── lib/            # External service configs (Firebase, Razorpay)
├── types/          # Shared TypeScript interfaces
├── hooks/          # Reusable stateful logic hooks
├── utils/          # Pure functions (no React)
├── components/     # Truly shared UI components
│   ├── layout/     # Navbar
│   └── ui/         # LoadingSpinner, StepIndicator, VerifiedBadge, etc.
└── features/       # Feature-first vertical slices
    ├── auth/
    ├── landing/
    ├── onboarding/
    ├── verification/
    ├── brand/
    ├── creator/
    ├── campaign/
    ├── deal-room/
    │   ├── components/
    │   └── hooks/
    ├── messaging/
    ├── payments/
    ├── notifications/
    └── admin/
```

---

## Pending Work (Priority Order)

### P0 — Required Before First Real User
- [ ] Deploy Firestore security rules (`firestore.rules`)
- [ ] Test all routes with a fresh account (no pre-seeded data)
- [ ] Add Razorpay test mode keys to .env

### P1 — Required Before Revenue
- [ ] Real Razorpay checkout in `EscrowWallet.tsx`
- [ ] Activate UPI penny-drop verification
- [ ] Build admin review panel (`features/admin/`)
- [ ] Firebase Custom Claims for admin role

### P2 — Polish
- [ ] Refactor DigitalDealRoom to use `useDealRoom` hook and sub-components
- [ ] Adopt `LoadingSpinner` across all pages (replace inline spinners)
- [ ] Adopt `StepIndicator` in both onboarding flows
- [ ] Adopt `VerifiedBadge` across matchmaking and profile pages
- [ ] Activate `NotificationProvider` with FCM
