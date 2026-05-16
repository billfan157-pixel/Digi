# Stripe Premium Subscription

## Architecture

```
User clicks "Nâng cấp" in UpgradeModal
  → src/lib/stripe.ts: redirectToCheckout(plan)
    → supabase.functions.invoke('create-stripe-checkout')
      → Edge Function tạo Stripe Checkout Session
        → Trả về { id, url }
  → window.location.href = url (web)
  → Browser.open(url) (mobile)

User completes payment on Stripe
  → Stripe redirects to successUrl?session_id=xxx
  → stripe-webhook Edge Function nhận event
    → Cập nhật profiles.subscription_tier = 'premium'
  → Frontend: syncPremiumStatus() poll phát hiện thay đổi
```

## Edge Functions

| Function | verify_jwt | Mô tả |
|---|---|---|
| `create-stripe-checkout` | true | Tạo Stripe Checkout Session |
| `stripe-webhook` | false | Xử lý webhook từ Stripe |

## Required Secrets

Set via Supabase CLI:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  STRIPE_PRICE_MONTHLY=price_... \
  STRIPE_PRICE_YEARLY=price_...
```

## Stripe Webhook Configuration

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://<project>.supabase.co/functions/v1/stripe-webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy Signing Secret → set `STRIPE_WEBHOOK_SECRET`

## Key Frontend Files

| File | Mô tả |
|---|---|
| `src/lib/stripe.ts` | Checkout functions, Sentry monitoring |
| `src/components/modals/UpgradeModal.tsx` | UI modal với 2 plan buttons |
| `src/features/premium/usePremiumGamification.ts` | syncPremiumStatus() poll + premium features |

## Testing

```bash
npm run test -- src/lib/stripe.test.ts
```

## Price IDs

- Monthly: `price_1TXbbo0wIYL8uVPbd8fTojTA`
- Yearly: `price_1TXbca0wIYL8uVPbnm9Ke36f`
