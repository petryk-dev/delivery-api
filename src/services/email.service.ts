import { sendMail } from '../utils/email';

// TODO: Move HTML to proper template engine (e.g. handlebars) as needed

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Welcome to DeliveryApp!',
    html: `<h1>Hi ${name},</h1><p>Your account has been created successfully.</p>`,
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Verify your email address',
    html: `<h1>Hi ${name},</h1><p>Use the code below to verify your email address. It expires in 24 hours.</p><p><strong>${token}</strong></p>`,
  });
}

export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  total: number,
): Promise<void> {
  await sendMail({
    to,
    subject: `Order Confirmed — #${orderId}`,
    html: `<p>Your order <strong>#${orderId}</strong> has been confirmed. Total: $${total.toFixed(2)}</p>`,
  });
}

export async function sendOrderStatusEmail(
  to: string,
  orderId: string,
  status: string,
): Promise<void> {
  await sendMail({
    to,
    subject: `Order Update — #${orderId}`,
    html: `<p>Your order <strong>#${orderId}</strong> status changed to <strong>${status}</strong>.</p>`,
  });
}
