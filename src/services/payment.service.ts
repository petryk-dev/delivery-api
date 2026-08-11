import createError from 'http-errors';
import { Payment } from '@prisma/client';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { prisma } from '../config/database';
import { env } from '../config/env';

export async function createPaymentIntent(
  orderId: string,
  customerId: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order) throw createError(404, 'Order not found');
  if (order.customerId !== customerId) throw createError(403, 'Not your order');
  if (order.payment) throw createError(409, 'Payment already initiated for this order');

  const amountInCents = Math.round(Number(order.totalAmount) * 100);
  const intent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: { orderId },
  });

  await prisma.payment.create({
    data: {
      orderId,
      stripePaymentIntentId: intent.id,
      amount: order.totalAmount,
      status: 'PENDING',
    },
  });

  return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw createError(400, 'Webhook signature verification failed');
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    await prisma.payment.update({
      where: { stripePaymentIntentId: intent.id },
      data: { status: 'SUCCEEDED' },
    });
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: intent.id },
    });
    if (payment) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'CONFIRMED' },
      });
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    await prisma.payment.update({
      where: { stripePaymentIntentId: intent.id },
      data: { status: 'FAILED' },
    });
  }
}

export async function getPaymentByOrder(orderId: string): Promise<Payment> {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw createError(404, 'Payment not found');
  return payment;
}
