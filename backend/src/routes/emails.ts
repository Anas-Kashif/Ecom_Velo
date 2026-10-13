import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendOrderConfirmationEmail, getEmailGeneratorForStatus } from '../services/emailService';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { createRateLimiter } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const emailLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many email requests. Please try again later.',
});

// Send order status update email (when admin updates order status)
router.post('/send-order-status-update', emailLimiter, authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const orderId = typeof req.body.orderId === 'string' ? req.body.orderId.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const newStatus = typeof req.body.newStatus === 'string' ? req.body.newStatus.trim().toLowerCase() : '';

    if (!orderId || !email || !newStatus) {
      return res.status(400).json({ error: 'Missing required fields: orderId, email, newStatus' });
    }

    if (!email.includes('@') || email.length > 255) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    // Fetch order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Parse shipping address
    const shippingAddress = typeof order.shippingAddress === 'string'
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress;

    // Parse notes to get pricing details
    const notes = order.notes ? JSON.parse(order.notes) : {};

    // Prepare email options with status
    const emailOptions = {
      email,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.guestName || 'Valued Customer',
      status: newStatus,
      items: order.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        productName: item.product?.name || 'Product',
      })),
      shippingAddress: shippingAddress || {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
      paymentMethod: order.paymentMethod || 'card',
      shippingMethod: order.shippingMethod || 'standard',
      subtotal: order.totalAmount - (notes.shippingCost || 0) - (notes.tax || 0),
      shippingCost: notes.shippingCost || 0,
      tax: notes.tax || 0,
      total: order.totalAmount,
    };

    // Generate HTML email with updated status
    const emailGenerator = getEmailGeneratorForStatus(newStatus);
    const htmlContent = emailGenerator(emailOptions);

    // Send email
    await sendOrderConfirmationEmail(email, htmlContent);

    res.json({
      success: true,
      message: `Order status update email sent successfully (Status: ${newStatus})`,
      email: email,
      status: newStatus,
    });
  } catch (error) {
    logger.error('Order status update email failed', error);
    res.status(500).json({
      error: 'Failed to send order status update email',
    });
  }
});

export default router;
