import { lemonSqueezySetup, createCheckout, getSubscription } from '@lemonsqueezy/lemonsqueezy.js';

// Inicializar configuración
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY,
});

/**
 * Crear sesión de checkout
 */
export async function createCheckoutSession(
  tenantId: string,
  userEmail: string,
  variantId: string
) {
  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      checkoutData: {
        email: userEmail,
        custom: {
          tenant_id: tenantId,
        },
      },
      productOptions: {
        redirectUrl: `${process.env.FRONTEND_URL}/billing?success=true`,
        receiptButtonText: 'Go to Dashboard',
        receiptThankYouNote: 'Thank you for subscribing!',
      },
    }
  );

  return checkout.data?.data.attributes.url;
}

/**
 * Obtener detalles de la suscripción
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const subscription = await getSubscription(subscriptionId);
  return subscription.data?.data.attributes;
}

/**
 * Manejar eventos del Webhook
 */
export async function handleWebhookEvent(event: any) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const eventName = event.meta?.event_name;

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated': {
      const sub = event.data.attributes;
      const tenantId = sub.custom_data?.tenant_id;

      if (tenantId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeSubscriptionId: String(event.data.id), // Reutilizamos el campo para guardar el ID de LS
            stripePriceId: String(sub.variant_id),
            stripeCurrentPeriodEnd: new Date(sub.renews_at),
            plan: sub.status === 'active' ? 'pro' : 'free',
          },
        });
      }
      break;
    }

    case 'subscription_cancelled':
    case 'subscription_expired': {
      const sub = event.data.attributes;
      const tenantId = sub.custom_data?.tenant_id;

      if (tenantId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
            plan: 'free',
          },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled Lemon Squeezy event: ${eventName}`);
  }
}