# Luminary Production Environment Variables Guide

This guide walks you through finding or generating each required environment variable for the permanent Vercel deployment.

---

## 1. STRIPE_SECRET_KEY & NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**Purpose:** Payment processing for family and pro subscriptions.

### Steps:

1. Go to **https://dashboard.stripe.com/login**
2. Sign in to your Stripe account (or create one at https://dashboard.stripe.com/register)
3. In the left sidebar, click **Developers** → **API Keys**
4. You will see two keys:
   - **Secret Key** (starts with `sk_live_` or `sk_test_`) → Use as `STRIPE_SECRET_KEY`
   - **Publishable Key** (starts with `pk_live_` or `pk_test_`) → Use as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
5. Copy both keys and save them

**Note:** If you see "Test mode" at the top, you are using test keys. For production, toggle to "Live mode" to get real keys.

---

## 2. STRIPE_WEBHOOK_SECRET

**Purpose:** Verify webhook events from Stripe (subscription updates, payments, etc.).

### Steps:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter the webhook URL: `https://your-luminary-domain.vercel.app/api/stripe/webhook`
   - Replace `your-luminary-domain` with your actual Vercel domain (you'll get this after first deployment)
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click **Add endpoint**
6. Click the endpoint you just created
7. Scroll to **Signing secret** and click **Reveal**
8. Copy the secret (starts with `whsec_`) → Use as `STRIPE_WEBHOOK_SECRET`

---

## 3. STRIPE_FAMILY_PRICE_ID & STRIPE_PRO_PRICE_ID

**Purpose:** Identify which Stripe price objects correspond to your Family and Pro plans.

### Steps:

1. In Stripe Dashboard, go to **Products**
2. Create or find your products:
   - **Family Plan** (e.g., "Luminary Family")
   - **Pro Plan** (e.g., "Luminary Pro")
3. For each product, click it to open details
4. Scroll to **Pricing** section
5. You will see one or more prices listed. Each price has an ID starting with `price_`
6. Copy the price ID for:
   - Family plan → Use as `STRIPE_FAMILY_PRICE_ID`
   - Pro plan → Use as `STRIPE_PRO_PRICE_ID`

**Example:**
- `STRIPE_FAMILY_PRICE_ID=price_1A2B3C4D5E6F7G8H9I0J`
- `STRIPE_PRO_PRICE_ID=price_2K3L4M5N6O7P8Q9R0S1T`

---

## 4. NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose:** Connect to your Supabase database for storing child progress, lessons, and user data.

### Steps:

1. Go to **https://supabase.com** and sign in (or create an account)
2. Click on your Luminary project (or create a new one)
3. In the left sidebar, click **Settings** → **API**
4. You will see:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Public** (under "Project API keys") → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Copy both values

**Example:**
- `NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 5. SUPABASE_SERVICE_ROLE_KEY

**Purpose:** Server-side access to Supabase for admin operations, lesson generation, and report generation.

**Note:** Some server routes also accept `SUPABASE_URL` as an alternative name for the project URL (same value as `NEXT_PUBLIC_SUPABASE_URL`). Prefer setting `NEXT_PUBLIC_SUPABASE_URL` everywhere; only add `SUPABASE_URL` if you have legacy config.

### Steps:

1. In Supabase, go to **Settings** → **API**
2. Scroll down to **Project API keys**
3. Find the key labeled **Service Role** (this is secret and should never be exposed to the client)
4. Copy it → Use as `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Important:** This key has full database access. Keep it secret and never commit it to GitHub.

---

## 6. ANTHROPIC_API_KEY

**Purpose:** Power Lumi's lesson generation, chat responses, and teaching interactions.

### Steps:

1. Go to **https://console.anthropic.com** (Anthropic console)
2. Sign in or create an account
3. In the left sidebar, click **API Keys**
4. Click **Create Key**
5. Give it a name like "Luminary Production"
6. Copy the key → Use as `ANTHROPIC_API_KEY`

**Example:**
- `ANTHROPIC_API_KEY=sk-ant-v1-abc123def456ghi789jkl...`

---

## 7. NEXT_PUBLIC_APP_URL

**Purpose:** Tell the app what its own domain is (used for OAuth redirects, email links, etc.).

### Steps:

1. After your first Vercel deployment completes, you will get a URL like:
   - `https://luminary-xyz123.vercel.app`
2. Use that as `NEXT_PUBLIC_APP_URL`

**For now, use a placeholder:**
- `NEXT_PUBLIC_APP_URL=https://luminary-xyz123.vercel.app`
- (You can update this after your first deployment)

---

## Summary Table

| Variable | Where to find | Example |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys | `sk_live_abc123...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys | `pk_live_xyz789...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | `whsec_abc123...` |
| `STRIPE_FAMILY_PRICE_ID` | Stripe Dashboard → Products → Family Plan | `price_1A2B3C...` |
| `STRIPE_PRO_PRICE_ID` | Stripe Dashboard → Products → Pro Plan | `price_2K3L4M...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → Anon Public | `eyJhbGc...` |
| `SUPABASE_URL` | (Optional) Same as `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → Service Role | `eyJhbGc...` |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys | `sk-ant-v1-...` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel domain (after deployment) | `https://luminary-xyz.vercel.app` |

---

## Adding Variables to Vercel

Once you have all the values, add them to your Vercel project:

1. Go to **https://vercel.com** and sign in
2. Click on your **luminary** project
3. Go to **Settings** → **Environment Variables**
4. For each variable above, click **Add New**
5. Enter the name and value
6. Select which environments: **Production**, **Preview**, **Development**
7. Click **Save**
8. Redeploy by going to **Deployments** and clicking **Redeploy** on the latest failed deployment

---

## Need Help?

- **Stripe support:** https://support.stripe.com
- **Supabase docs:** https://supabase.com/docs
- **Anthropic docs:** https://docs.anthropic.com
- **Vercel docs:** https://vercel.com/docs
