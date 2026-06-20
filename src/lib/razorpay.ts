/**
 * src/lib/razorpay.ts
 * 
 * Razorpay payment gateway configuration.
 * 
 * CURRENT STATUS: Simulated (no real API calls made)
 * TO ACTIVATE: Set VITE_RAZORPAY_KEY_ID in .env and replace
 *              simulatePayment() with real Razorpay checkout.
 * 
 * Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

export const RAZORPAY_CONFIG = {
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  currency: 'INR' as const,
  companyName: 'CreatorStack',
  logo: '/logo.png',
  theme: { color: '#4f46e5' }, // Indigo-600
};

export interface RazorpayOrderOptions {
  amount: number;       // in paise (₹1 = 100 paise)
  currency: 'INR';
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Simulates a Razorpay checkout for development/demo.
 * Returns a fake payment ID after a 1.5s delay.
 * Replace with real window.Razorpay() call when going live.
 */
export async function simulatePayment(
  amountInr: number,
  description: string,
): Promise<RazorpayPaymentResult> {
  // TODO: Replace this with real Razorpay checkout when VITE_RAZORPAY_KEY_ID is set
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        razorpay_payment_id: `pay_sim_${Date.now()}`,
        razorpay_order_id: `order_sim_${Date.now()}`,
        razorpay_signature: 'simulated_signature',
      });
    }, 1500);
  });
}

/**
 * Calculates the net payout after TDS and platform fee.
 * Section 194J: 10% TDS on professional fees
 * Platform fee: 2.5% + 18% GST on the platform fee
 */
export function calculateNetPayout(grossAmount: number): {
  gross: number;
  tds: number;
  platformFee: number;
  gstOnPlatformFee: number;
  net: number;
} {
  const tds = Math.round(grossAmount * 0.10);
  const platformFeeBase = Math.round(grossAmount * 0.025);
  const gstOnPlatformFee = Math.round(platformFeeBase * 0.18);
  const net = grossAmount - tds - platformFeeBase - gstOnPlatformFee;
  return { gross: grossAmount, tds, platformFee: platformFeeBase, gstOnPlatformFee, net };
}
