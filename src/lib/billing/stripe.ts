import Stripe from "stripe";

// Server-side Stripe client - only initialize if API key is available
// This allows the build to complete without the API key being present
const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });
};

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      _stripe = getStripeClient();
    }
    return (_stripe as unknown as Record<string, unknown>)[prop as string];
  },
});

// Plan configuration with Stripe price IDs
export const PLAN_CONFIG = {
  free: {
    slug: "free",
    credits: 5,
    priceId: null, // Free plan has no Stripe price
  },
  standard: {
    slug: "standard",
    credits: 60,
    priceId: process.env.STRIPE_PRICE_STANDARD,
  },
  professional: {
    slug: "professional",
    credits: 150,
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL,
  },
  enterprise: {
    slug: "enterprise",
    credits: 500,
    priceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
} as const;

// Credit top-up packages
export const TOPUP_PACKAGES = [
  {
    id: "topup_10",
    credits: 10,
    price_cents: 500,
    priceId: process.env.STRIPE_TOPUP_10,
    label: "10 Credits",
    description: "$5.00",
  },
  {
    id: "topup_25",
    credits: 25,
    price_cents: 1000,
    priceId: process.env.STRIPE_TOPUP_25,
    label: "25 Credits",
    description: "$10.00",
    badge: "Popular",
  },
  {
    id: "topup_50",
    credits: 50,
    price_cents: 1750,
    priceId: process.env.STRIPE_TOPUP_50,
    label: "50 Credits",
    description: "$17.50",
    badge: "Best Value",
  },
] as const;

export type PlanSlug = keyof typeof PLAN_CONFIG;
export type TopupPackageId = (typeof TOPUP_PACKAGES)[number]["id"];

// Helper to get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): PlanSlug | null {
  for (const [slug, config] of Object.entries(PLAN_CONFIG)) {
    if (config.priceId === priceId) {
      return slug as PlanSlug;
    }
  }
  return null;
}

// Helper to get topup package by price ID
export function getTopupByPriceId(priceId: string) {
  return TOPUP_PACKAGES.find((pkg) => pkg.priceId === priceId);
}

// Create checkout session for subscription
export async function createSubscriptionCheckout(params: {
  userId: string;
  userEmail: string;
  planSlug: PlanSlug;
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const { userId, userEmail, planSlug, customerId, successUrl, cancelUrl } = params;
  const planConfig = PLAN_CONFIG[planSlug];

  if (!planConfig.priceId) {
    throw new Error("Cannot create checkout for free plan");
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      plan_slug: planSlug,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan_slug: planSlug,
      },
    },
  };

  // Use existing customer or create new one
  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_email = userEmail;
  }

  return stripe.checkout.sessions.create(sessionParams);
}

// Create checkout session for credit top-up
export async function createTopupCheckout(params: {
  userId: string;
  userEmail: string;
  packageId: TopupPackageId;
  customerId?: string;
  organizationId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const { userId, userEmail, packageId, customerId, organizationId, successUrl, cancelUrl } = params;
  const pkg = TOPUP_PACKAGES.find((p) => p.id === packageId);

  if (!pkg || !pkg.priceId) {
    throw new Error("Invalid top-up package");
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: pkg.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      user_id: userId,
      package_id: packageId,
      credits: pkg.credits.toString(),
      ...(organizationId && { organization_id: organizationId }),
    },
  };

  // Use existing customer or create new one
  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_email = userEmail;
  }

  return stripe.checkout.sessions.create(sessionParams);
}

// Create customer portal session
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const { customerId, returnUrl } = params;

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

// Get or create Stripe customer
export async function getOrCreateCustomer(params: {
  email: string;
  userId: string;
  name?: string;
}) {
  const { email, userId, name } = params;

  // Search for existing customer
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId,
    },
  });
}

// Cancel subscription at period end
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Resume canceled subscription
export async function resumeSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
