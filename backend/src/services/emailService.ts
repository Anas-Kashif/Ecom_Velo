// Email Service - Generates order confirmation emails
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  email: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    productName?: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  shippingMethod: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

// Generate Pending Status Email
export function generatePendingEmail(options: EmailOptions): string {
  const { customerName, orderId, orderNumber, items, shippingAddress, total, shippingMethod, paymentMethod, subtotal, shippingCost, tax } = options;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #E65100; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #FF9800; padding-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .summary-box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
        .total-row { font-size: 20px; font-weight: bold; color: #E65100; padding: 15px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; }
        .pending-badge { display: inline-block; background: #FF9800; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .status-message { background: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; border-radius: 4px; }
        .status-message p { margin: 0; color: #E65100; font-weight: 500; }
        .order-number { background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; color: #E65100; text-align: center; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏳ Order Pending</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">We've received your order</p>
        </div>

        <div class="content">
            <div class="order-number">
                Order #${orderNumber}
            </div>

            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Thank you for your order! We have received it and it's currently pending review and confirmation.</p>

            <div class="status-message">
                <p>⏱️ Your order is pending and will be verified shortly.</p>
                <p>We're checking inventory and payment details to confirm your order.</p>
            </div>

            <!-- Order Details -->
            <div class="section">
                <h2>Your Order Details</h2>
                <div class="info-row">
                    <span class="info-label">Order Number:</span>
                    <span class="info-value">#${orderNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value"><span class="pending-badge">Pending</span></span>
                </div>
                <div class="info-row">
                    <span class="info-label">Expected Action:</span>
                    <span class="info-value">Within 24 hours</span>
                </div>
            </div>

            <!-- Items -->
            <div class="section">
                <h2>Order Items</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Pricing Summary -->
            <div class="section">
                <h2>Order Summary</h2>
                <div class="summary-box">
                    <div class="info-row">
                        <span class="info-label">Subtotal:</span>
                        <span class="info-value">$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Shipping (${shippingMethod}):</span>
                        <span class="info-value">$${shippingCost.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Tax:</span>
                        <span class="info-value">$${tax.toFixed(2)}</span>
                    </div>
                    <div class="info-row total-row">
                        <span>Total Amount:</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- Shipping Address -->
            <div class="section">
                <h2>Shipping To</h2>
                <p>
                    <strong>${shippingAddress.firstName} ${shippingAddress.lastName}</strong><br>
                    ${shippingAddress.address}<br>
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                    ${shippingAddress.country}
                </p>
            </div>

            <!-- Payment Method -->
            <div class="section">
                <h2>Payment Method</h2>
                <p><strong>${paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}</strong></p>
                <p>${paymentMethod === 'card' ? 'Your card will be charged once your order is confirmed.' : 'Payment will be collected upon delivery.'}</p>
            </div>

            <!-- What's Next -->
            <div class="section">
                <h2>What Happens Next?</h2>
                <p>✓ We are verifying your order details</p>
                <p>✓ Checking product availability</p>
                <p>✓ Confirming payment information</p>
                <p>✓ Once confirmed, we'll send you a processing notification</p>
                <p>✓ You'll receive tracking information as soon as your order ships</p>
            </div>

            <!-- Important Notice -->
            <div class="section" style="background: #FFF3E0; padding: 15px; border-radius: 5px; border-left: 4px solid #FF9800;">
                <h2 style="color: #E65100; margin-top: 0;">📌 Important</h2>
                <p>If you don't receive a confirmation email within 24 hours, please contact our support team.</p>
                <p>Do not attempt to place another order for the same items.</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">This is an automated email from VELO PRECISION.</p>
            <p style="margin: 0;">© 2026 VELO PRECISION. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate Processing Status Email
export function generateProcessingEmail(options: EmailOptions): string {
  const { customerName, orderId, orderNumber, items, shippingAddress, total, shippingMethod, paymentMethod, subtotal, shippingCost, tax } = options;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e3c72; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #1e3c72; padding-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .summary-box { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 15px; }
        .total-row { font-size: 20px; font-weight: bold; color: #1e3c72; padding: 15px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; }
        .processing-badge { display: inline-block; background: #2196F3; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .status-message { background: #E3F2FD; padding: 15px; border-left: 4px solid #2196F3; margin: 15px 0; border-radius: 4px; }
        .status-message p { margin: 0; color: #1565C0; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Processing</h1>
        </div>
        <div class="content">
            <h2>Order #${orderNumber}</h2>
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Great news! Your order is now being processed. We're preparing your items for shipment.</p>

            <div class="status-message">
                <p>📦 Your order is currently being processed and will ship soon.</p>
                <p>We'll send you a tracking number as soon as your order ships!</p>
            </div>

            <!-- Order Items -->
            <div class="section">
                <h2>Order Items</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Quantity</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Order Summary -->
            <div class="section">
                <h2>Order Summary</h2>
                <div class="summary-box">
                    <div class="info-row">
                        <span class="info-label">Subtotal:</span>
                        <span class="info-value">$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Shipping:</span>
                        <span class="info-value">$${shippingCost.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Tax:</span>
                        <span class="info-value">$${tax.toFixed(2)}</span>
                    </div>
                    <div class="info-row total-row">
                        <span>Total:</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- Shipping Address -->
            <div class="section">
                <h2>Shipping To</h2>
                <p>
                    ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                    ${shippingAddress.address}<br>
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                    ${shippingAddress.country}
                </p>
            </div>

            <!-- What's Next -->
            <div class="section">
                <h2>What's Next?</h2>
                <p>1. Your items are being carefully prepared for shipment</p>
                <p>2. You'll soon receive a tracking number via email</p>
                <p>3. Track your package to see delivery updates</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">This is an automated email from VELO PRECISION.</p>
            <p style="margin: 0;">© 2026 VELO PRECISION. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate Shipped Status Email
export function generateShippedEmail(options: EmailOptions): string {
  const { customerName, orderId, orderNumber, items, shippingAddress } = options;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #00BCD4 0%, #0097A7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #00796B; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #00BCD4; padding-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; }
        .shipped-badge { display: inline-block; background: #00BCD4; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .status-message { background: #E0F2F1; padding: 15px; border-left: 4px solid #00BCD4; margin: 15px 0; border-radius: 4px; }
        .status-message p { margin: 0; color: #00695C; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; }
        table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚚 Your Order Has Shipped!</h1>
        </div>
        <div class="content">
            <h2>Order #${orderNumber}</h2>
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Exciting news! Your order is on its way to you!</p>

            <div class="status-message">
                <p>✅ Your package has been shipped and is in transit!</p>
                <p>Check your tracking information below to monitor your delivery.</p>
            </div>

            <!-- Shipping Address -->
            <div class="section">
                <h2>Shipping To</h2>
                <p>
                    ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                    ${shippingAddress.address}<br>
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                    ${shippingAddress.country}
                </p>
            </div>

            <!-- Items Shipped -->
            <div class="section">
                <h2>Items Shipped</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- What's Next -->
            <div class="section">
                <h2>What's Next?</h2>
                <p>📍 Your package is on the way!</p>
                <p>📦 Check tracking information regularly for delivery updates</p>
                <p>🏠 Your items will arrive within the estimated delivery window</p>
                <p>📞 If you have any questions, contact our support team</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">This is an automated email from VELO PRECISION.</p>
            <p style="margin: 0;">© 2026 VELO PRECISION. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate Delivered Status Email
export function generateDeliveredEmail(options: EmailOptions): string {
  const { customerName, orderId, orderNumber, items, shippingAddress, total } = options;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2E7D32; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; }
        .delivered-badge { display: inline-block; background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .status-message { background: #E8F5E9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; border-radius: 4px; }
        .status-message p { margin: 0; color: #2E7D32; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; }
        table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .review-button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-align: center; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Your Order Has Been Delivered!</h1>
        </div>
        <div class="content">
            <h2>Order #${orderNumber}</h2>
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Great news! Your order has been successfully delivered to you.</p>

            <div class="status-message">
                <p>🎉 Thank you for your purchase!</p>
                <p>We hope you're happy with your order. Your support means a lot to us!</p>
            </div>

            <!-- Delivery Address -->
            <div class="section">
                <h2>Delivered To</h2>
                <p>
                    ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                    ${shippingAddress.address}<br>
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                    ${shippingAddress.country}
                </p>
            </div>

            <!-- Items Delivered -->
            <div class="section">
                <h2>Items Delivered</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Order Value -->
            <div class="section">
                <h2>Order Value</h2>
                <p><strong>Order Total: $${total.toFixed(2)}</strong></p>
            </div>

            <!-- Feedback -->
            <div class="section">
                <h2>We'd Love Your Feedback</h2>
                <p>Your satisfaction is important to us. If you have any feedback about this order, please let us know!</p>
                <p>If you have any issues or questions about your delivery, please contact our support team immediately.</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">This is an automated email from VELO PRECISION.</p>
            <p style="margin: 0;">© 2026 VELO PRECISION. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate Cancelled Status Email
export function generateCancelledEmail(options: EmailOptions): string {
  const { customerName, orderId, orderNumber, items, shippingAddress, total } = options;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.productName || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F44336 0%, #C62828 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #C62828; font-size: 18px; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #F44336; padding-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; border-radius: 0 0 8px 8px; }
        .cancelled-badge { display: inline-block; background: #F44336; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .status-message { background: #FFEBEE; padding: 15px; border-left: 4px solid #F44336; margin: 15px 0; border-radius: 4px; }
        .status-message p { margin: 0; color: #B71C1C; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; }
        table th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
        .refund-info { background: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; border-radius: 4px; }
        .refund-info p { margin: 0; color: #E65100; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Your Order Has Been Cancelled</h1>
        </div>
        <div class="content">
            <h2>Order #${orderNumber}</h2>
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>We're writing to confirm that your order has been cancelled.</p>

            <div class="status-message">
                <p>⛔ This order has been cancelled and will not be processed.</p>
                <p>Please review the information below and contact us if you have any questions.</p>
            </div>

            <!-- Cancelled Items -->
            <div class="section">
                <h2>Items Cancelled</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Quantity</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Order Value -->
            <div class="section">
                <h2>Order Value</h2>
                <p><strong>Order Total: $${total.toFixed(2)}</strong></p>
            </div>

            <!-- Refund Information -->
            <div class="refund-info">
                <p><strong>💰 Refund Status</strong></p>
                <p>If this order was already paid, your refund will be processed to your original payment method within 5-7 business days.</p>
            </div>

            <!-- What to Do Next -->
            <div class="section">
                <h2>What Happens Now?</h2>
                <p>✓ Your order has been removed from our system</p>
                <p>✓ No payment will be charged (or refunded if already paid)</p>
                <p>✓ You will not receive this order</p>
                <p>✓ Contact us if you'd like to place a new order</p>
            </div>

            <!-- Support -->
            <div class="section">
                <h2>Need Assistance?</h2>
                <p>If you need more information about this cancellation or have any questions, please don't hesitate to contact our support team.</p>
                <p>We're here to help!</p>
            </div>
        </div>

        <div class="footer">
            <p style="margin: 0 0 10px 0;">This is an automated email from VELO PRECISION.</p>
            <p style="margin: 0;">© 2026 VELO PRECISION. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Send email function using Nodemailer
export async function sendOrderConfirmationEmail(email: string, htmlContent: string): Promise<void> {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Your Order Status Update',
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
        logger.info('Order email sent successfully');
  } catch (error) {
        logger.error('Error sending order email', error);
    throw error;
  }
}

// Helper function to get appropriate email generator based on status
export function getEmailGeneratorForStatus(status: string): (options: EmailOptions) => string {
  switch (status) {
    case 'pending':
      return generatePendingEmail;
    case 'processing':
      return generateProcessingEmail;
    case 'shipped':
      return generateShippedEmail;
    case 'delivered':
      return generateDeliveredEmail;
    case 'cancelled':
      return generateCancelledEmail;
    default:
      return generatePendingEmail;
  }
}
