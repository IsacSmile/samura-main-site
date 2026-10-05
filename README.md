# Samaura Healthcare — Storefront & E-Commerce Web Application

Samaura Healthcare is a modern, high-performance e-commerce storefront for natural menstrual hygiene and intimate wellness essentials.

---

## Payment Gateway: Razorpay Go-Live Steps

Online payments are built behind a unified `PaymentProvider` interface and stay completely dormant until valid Razorpay keys are configured. Cash on Delivery (COD) is active at launch.

Follow these exact steps to activate online payments (Cards, UPI, Netbanking):

### Step 1: Add Test API Keys to Environment
In your `.env` or production environment variables, supply your Razorpay Test Key ID and Secret:
```env
PAYMENT_PROVIDER="razorpay"
RAZORPAY_KEY_ID="rzp_test_YourTestKeyIdHere"
RAZORPAY_KEY_SECRET="YourTestKeySecretHere"
RAZORPAY_WEBHOOK_SECRET="YourTestWebhookSecretHere"
```

### Step 2: Set Provider Flag
Ensure `PAYMENT_PROVIDER="razorpay"` is set. If `PAYMENT_PROVIDER` is empty or unset, online payment options remain dormant and hidden from checkout, leaving COD as the active payment method.

### Step 3: Run a Test-Mode Payment
1. Start the application (`npm run dev` or production server).
2. Add any item to your cart and proceed to `/checkout`.
3. Select "Pay Online via UPI, Cards, Netbanking".
4. Submit the order and complete a test transaction using Razorpay's test credentials (e.g. test UPI ID or test card details).
5. Verify that your order is confirmed, inventory stock is decremented, and you are redirected to `/order/[token]` with status `placed` and payment status `paid`.

### Step 4: Register the Webhook URL
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. Set the **Webhook URL** to:
   ```
   https://your-domain.com/api/razorpay/webhook
   ```
4. Enter the exact secret string that you configured in `RAZORPAY_WEBHOOK_SECRET`.
5. Under **Active Events**, select:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
6. Save the webhook.

### Step 5: Switch to Live Keys
Once your business KYC verification is approved by Razorpay:
1. In the Razorpay Dashboard, toggle from **Test Mode** to **Live Mode**.
2. Generate Live API Keys under **Settings** > **API Keys**.
3. Update your production environment variables:
   ```env
   PAYMENT_PROVIDER="razorpay"
   RAZORPAY_KEY_ID="rzp_live_YourLiveKeyId"
   RAZORPAY_KEY_SECRET="YourLiveKeySecret"
   RAZORPAY_WEBHOOK_SECRET="YourLiveWebhookSecret"
   ```
4. Register the production webhook URL in the Live Mode dashboard settings with the matching `RAZORPAY_WEBHOOK_SECRET`.
5. Restart or redeploy your application. Online payments are now live!

---

## Local Development & Mock Payment Sandbox

To test the entire checkout and order lifecycle locally without Razorpay credentials:
1. In `.env`, set:
   ```env
   PAYMENT_PROVIDER="mock"
   ```
2. Proceed through `/checkout` and select "Pay Online (Sandbox Dev Gateway)".
3. You will be directed to the hosted mock gateway page at `/payment/mock`, where you can simulate successful payment or failure/cancellation.
4. Note: The mock gateway throws a fatal error if executed in a `production` environment (`NODE_ENV=production`).

---

## Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: SQLite / LibSQL with Drizzle ORM
- **Authentication**: Auth.js (Credentials, bcrypt)
- **State Management**: Zustand (client cart stores only `variantId` and `quantity`)
- **Server Pricing**: Authoritative integer paise computation in `src/lib/services/pricing.ts`
- **Transactions**: Atomic stock lock with rollback and idempotency protection
