import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import type { Order } from '../types/index.js';

const enabled = !!(config.smtpHost && config.smtpUser && config.smtpPass && config.emailFrom);

let transporter: nodemailer.Transporter | null = null;

if (enabled) {
  transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
} else {
  console.log('[email] SMTP not configured — email notifications disabled');
}

function statusColor(status: string): string {
  switch (status) {
    case 'Completed': return '#22c55e';
    case 'Processing': return '#f59e0b';
    case 'Cancelled': return '#ef4444';
    default: return '#6b7280';
  }
}

function buildEmailHtml(order: Order): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 32px 24px; text-align: center; background: linear-gradient(135deg, #f97316, #ec4899);">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 1px;">HUNGARIAN BITES</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0;">Order Status Update</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="font-size: 16px; color: #374151; margin: 0;">Hi <strong>${order.customer.name}</strong>,</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 8px 0 0;">Your order status has been updated.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0; text-align: center;">
                    <span style="display: inline-block; padding: 8px 24px; border-radius: 100px; font-size: 16px; font-weight: 600; color: #ffffff; background: ${statusColor(order.status)};">
                      ${order.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; padding: 16px;">
                      <tr>
                        <td style="padding: 8px 16px;">
                          <p style="font-size: 12px; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Order</p>
                          <p style="font-size: 18px; font-weight: 700; color: #111827; margin: 4px 0 0;">${order.id}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 16px;">
                          <p style="font-size: 12px; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Items</p>
                          ${order.items.map(item => `
                            <p style="font-size: 14px; color: #374151; margin: 4px 0;">${item.quantity}x ${item.name} &mdash; KSh ${item.price * item.quantity}</p>
                          `).join('')}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 16px; border-top: 1px solid #e5e7eb;">
                          <p style="font-size: 14px; font-weight: 700; color: #111827; margin: 0;">Total: KSh ${order.amount}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 16px;">
                          <p style="font-size: 12px; color: #9ca3af; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</p>
                          <p style="font-size: 14px; color: #374151; margin: 4px 0 0;">${order.deliveryAddress}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 0;">
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">
                      Track your order anytime: 
                      <a href="https://hungarianbites.co.ke/track/${encodeURIComponent(order.id)}" style="color: #f97316; text-decoration: underline;">
                        hungarianbites.co.ke/track/${order.id}
                      </a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 0;">
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">
                      Questions? Contact us on 
                      <a href="https://wa.me/${config.whatsappNumber}" style="color: #22c55e; text-decoration: underline;">WhatsApp</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">Hungarian Bites &mdash; Authentic Hungarian Cuisine</p>
              <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">Nairobi, Kenya</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderStatusEmail(order: Order): Promise<void> {
  if (!enabled || !transporter) {
    console.log(`[email] Skipping email for ${order.id} (SMTP not configured)`);
    return;
  }

  const customerEmail = order.customer.email;
  if (!customerEmail) {
    console.log(`[email] Skipping email for ${order.id} — no customer email`);
    return;
  }

  try {
    await transporter.sendMail({
      from: config.emailFrom,
      to: customerEmail,
      subject: `Order ${order.id} — ${order.status}`,
      html: buildEmailHtml(order),
    });
    console.log(`[email] Status update sent to ${customerEmail} for ${order.id}`);
  } catch (err) {
    console.error(`[email] Failed to send to ${customerEmail}:`, err);
  }
}
