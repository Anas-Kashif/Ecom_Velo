import express, { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireRoles } from '../middleware/roles';
import { createRateLimiter } from '../middleware/rateLimit';
import { sendOrderConfirmationEmail, getEmailGeneratorForStatus } from '../services/emailService';
import { cache, CACHE_KEYS } from '../utils/cache';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

interface CreateOrderRequest {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
}

interface GuestCheckoutRequest {
  email: string;
  customerName: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  shippingMethod: string;
  shippingCost: number;
  tax: number;
  total: number;
  paymentMethod: 'card' | 'cash_on_delivery';
  paymentStatus?: string;
  lastFourDigits?: string | null;
}

type OrderItemInput = {
  productId: string;
  quantity: number;
};

type CreateOrderOptions = {
  userId?: string;
  guestEmail?: string;
  guestName?: string;
  items: OrderItemInput[];
  shippingCity?: string;
  shippingState?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
  shippingAddress?: string;
  shippingMethod?: string;
  shippingCost?: number;
  tax?: number;
  totalAmount?: number;
  paymentMethod?: 'card' | 'cash_on_delivery';
  paymentStatus?: string;
  notes?: string;
  includeUser?: boolean;
};

const GUEST_CHECKOUT_LIMITER = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many checkout attempts. Please try again later.',
});

const SHIPPING_COSTS: Record<string, number> = {
  standard: 15,
  express: 30,
  overnight: 50,
};

const ALLOWED_PAYMENT_METHODS = new Set(['card', 'cash_on_delivery']);
const ALLOWED_ORDER_STATUSES = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
const ALLOWED_PAYMENT_STATUSES = new Set(['pending', 'paid', 'refunded', 'pending_on_delivery', 'unpaid']);

function normalizeOrderItems(items: OrderItemInput[]): OrderItemInput[] {
  const mergedItems = new Map<string, number>();

  for (const item of items) {
    if (!item.productId) {
      throw new Error('Each order item must include a productId');
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid quantity for product ${item.productId}`);
    }

    mergedItems.set(item.productId, (mergedItems.get(item.productId) ?? 0) + item.quantity);
  }

  return Array.from(mergedItems, ([productId, quantity]) => ({ productId, quantity }));
}

function normalizeEmail(email: unknown): string {
  if (typeof email !== 'string') {
    throw new Error('Email is required');
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.length > 255 || !normalized.includes('@')) {
    throw new Error('Invalid email address');
  }

  return normalized;
}

function normalizeName(name: unknown, fieldName: string): string {
  if (typeof name !== 'string') {
    throw new Error(`${fieldName} is required`);
  }

  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required`);
  }

  if (trimmed.length > 120) {
    throw new Error(`${fieldName} is too long`);
  }

  return trimmed;
}

function normalizeShippingMethod(method: unknown): keyof typeof SHIPPING_COSTS {
  if (typeof method !== 'string') {
    throw new Error('Invalid shipping method');
  }

  const normalized = method.trim().toLowerCase();
  if (!(normalized in SHIPPING_COSTS)) {
    throw new Error('Invalid shipping method');
  }

  return normalized as keyof typeof SHIPPING_COSTS;
}

function normalizePaymentMethod(method: unknown): 'card' | 'cash_on_delivery' {
  if (typeof method !== 'string') {
    throw new Error('Invalid payment method');
  }

  const normalized = method.trim().toLowerCase();
  if (!ALLOWED_PAYMENT_METHODS.has(normalized)) {
    throw new Error('Invalid payment method');
  }

  return normalized as 'card' | 'cash_on_delivery';
}

function normalizeAddress(address: unknown) {
  if (!address || typeof address !== 'object') {
    throw new Error('Missing required shipping address fields');
  }

  const shippingAddress = address as GuestCheckoutRequest['shippingAddress'];
  const firstName = normalizeName(shippingAddress.firstName, 'firstName');
  const lastName = normalizeName(shippingAddress.lastName, 'lastName');
  const streetAddress = normalizeName(shippingAddress.address, 'address');
  const city = normalizeName(shippingAddress.city, 'city');
  const state = normalizeName(shippingAddress.state, 'state');
  const zipCode = normalizeName(shippingAddress.zipCode, 'zipCode');
  const country = normalizeName(shippingAddress.country, 'country');

  return {
    firstName,
    lastName,
    address: streetAddress,
    city,
    state,
    zipCode,
    country,
  };
}

function normalizeGuestOrderItems(items: unknown): OrderItemInput[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  return normalizeOrderItems(
    items.map((item) => {
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid order item');
      }

      const orderItem = item as OrderItemInput;
      const productId = normalizeName(orderItem.productId, 'productId');
      const quantity = Number(orderItem.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
        throw new Error(`Invalid quantity for product ${productId}`);
      }

      return { productId, quantity };
    }),
  );
}

function calculateOrderFinancials(products: Array<{ id: string; price: number }>, items: OrderItemInput[], shippingMethod: keyof typeof SHIPPING_COSTS) {
  const subtotal = items.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    return sum + product.price * item.quantity;
  }, 0);

  const shippingCost = shippingMethod === 'standard' && subtotal > 100 ? 0 : SHIPPING_COSTS[shippingMethod];
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;

  return { subtotal, shippingCost, tax, total };
}

function safeOrderErrorResponse(error: unknown): { status: number; message: string } {
  const message = error instanceof Error ? error.message : 'Failed to process order';

  if (message.startsWith('Product with ID')) {
    return { status: 404, message };
  }

  if (
    message.startsWith('Insufficient stock') ||
    message.startsWith('Invalid quantity') ||
    message.startsWith('Each order item') ||
    message.startsWith('Order must contain at least one item') ||
    message.startsWith('Invalid email address') ||
    message.startsWith('Missing required shipping address fields') ||
    message.startsWith('Invalid shipping method') ||
    message.startsWith('Invalid payment method') ||
    message.startsWith('Invalid payment status') ||
    message.startsWith('Invalid card metadata') ||
    message.endsWith('is required') ||
    message.endsWith('is too long')
  ) {
    return { status: 400, message };
  }

  return { status: 500, message: 'Failed to process order' };
}

async function createOrderWithStockReservation(
  tx: Prisma.TransactionClient,
  options: CreateOrderOptions
) {
  const normalizedItems = normalizeOrderItems(options.items);

  if (normalizedItems.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  const productIds = normalizedItems.map((item) => item.productId);

  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    const foundProductIds = new Set(products.map((product) => product.id));
    const missingProductId = productIds.find((productId) => !foundProductIds.has(productId));
    throw new Error(`Product with ID ${missingProductId} not found`);
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  let totalAmount = 0;
  const orderItems: Array<{ productId: string; quantity: number; price: number }> = [];

  for (const item of normalizedItems) {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
      );
    }

    totalAmount += product.price * item.quantity;
    orderItems.push({
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
    });
  }

  for (const item of normalizedItems) {
    const stockUpdate = await tx.product.updateMany({
      where: {
        id: item.productId,
        stock: {
          gte: item.quantity,
        },
      },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });

    if (stockUpdate.count !== 1) {
      const product = productMap.get(item.productId);
      throw new Error(
        `Insufficient stock for ${product?.name || item.productId}. Available: ${product?.stock ?? 0}, Requested: ${item.quantity}`
      );
    }
  }

  const createdOrder = await tx.order.create({
    data: {
      orderNumber: `ORD-${Date.now()}`,
      userId: options.userId,
      guestEmail: options.guestEmail,
      guestName: options.guestName,
      totalAmount: options.totalAmount ?? totalAmount,
      shippingCity: options.shippingCity,
      shippingState: options.shippingState,
      shippingZipCode: options.shippingZipCode,
      shippingCountry: options.shippingCountry,
      shippingAddress: options.shippingAddress,
      shippingMethod: options.shippingMethod,
      shippingCost: options.shippingCost,
      tax: options.tax,
      paymentMethod: options.paymentMethod,
      paymentStatus: options.paymentStatus,
      notes: options.notes,
      items: {
        create: orderItems,
      },
    },
  });

  const include = {
    items: { include: { product: true } },
    ...(options.includeUser ? { user: { select: { name: true, email: true } } } : {}),
  };

  return tx.order.findUnique({
    where: { id: createdOrder.id },
    include,
  });
}

router.get('/', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { skip = '0', take = '20', userId, status } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        ...(userId && { userId: userId as string }),
        ...(status && { status: status as string }),
      },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        guestEmail: true,
        guestName: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        shippingMethod: true,
        shippingAttn: true,
        shippingName: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingZipCode: true,
        shippingCountry: true,
        shippingCost: true,
        tax: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      skip: parseInt(skip as string),
      take: parseInt(take as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.order.count();

    res.json({
      orders,
      total,
      skip: parseInt(skip as string),
      take: parseInt(take as string),
    });
  } catch (error) {
    logger.error('Order list fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Order detail fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request<{}, {}, CreateOrderRequest>, res: Response) => {
  try {
    const { userId, items, shippingCity, shippingState, shippingZipCode } = req.body;

    // Use transaction to ensure order creation and stock update are atomic
    const order = await prisma.$transaction(async (tx) => {
      return createOrderWithStockReservation(tx, {
        userId,
        items,
        shippingCity,
        shippingState,
        shippingZipCode,
        includeUser: true,
      });
    });

    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Invalidate product cache for all items in the order
    for (const item of items) {
      cache.delete(CACHE_KEYS.PRODUCT_DETAIL(item.productId));
    }
    // Also invalidate product list cache
    cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);

    res.status(201).json(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    const { status, message } = safeOrderErrorResponse(error);

    res.status(status).json({ error: message });
  }
});

// Guest checkout endpoint (no authentication required)
router.post('/checkout/guest', GUEST_CHECKOUT_LIMITER, async (req: Request<{}, {}, GuestCheckoutRequest>, res: Response) => {
  try {
    const email = normalizeEmail(req.body.email);
    const customerName = normalizeName(req.body.customerName, 'customerName');
    const items = normalizeGuestOrderItems(req.body.items);
    const shippingAddress = normalizeAddress(req.body.shippingAddress);
    const shippingMethod = normalizeShippingMethod(req.body.shippingMethod);
    const paymentMethod = normalizePaymentMethod(req.body.paymentMethod);
    const paymentStatus = typeof req.body.paymentStatus === 'string' ? req.body.paymentStatus.trim().toLowerCase() : undefined;
    const lastFourDigits = typeof req.body.lastFourDigits === 'string' ? req.body.lastFourDigits.replace(/\D/g, '').slice(-4) : null;

    if (paymentMethod === 'card' && lastFourDigits && lastFourDigits.length !== 4) {
      return res.status(400).json({ error: 'Invalid card metadata' });
    }

    if (paymentStatus && !ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // Use transaction to ensure order creation and stock update are atomic
    const order = await prisma.$transaction(async (tx) => {
      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true },
      });

      if (products.length !== productIds.length) {
        const foundProductIds = new Set(products.map((product) => product.id));
        const missingProductId = productIds.find((productId) => !foundProductIds.has(productId));
        throw new Error(`Product with ID ${missingProductId} not found`);
      }

      const financials = calculateOrderFinancials(products, items, shippingMethod);

      return createOrderWithStockReservation(tx, {
        guestEmail: email,
        guestName: customerName,
        items,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZipCode: shippingAddress.zipCode,
        shippingCountry: shippingAddress.country,
        shippingAddress: JSON.stringify(shippingAddress),
        shippingMethod,
        shippingCost: financials.shippingCost,
        tax: financials.tax,
        totalAmount: financials.total,
        paymentMethod,
        paymentStatus: paymentStatus || (paymentMethod === 'card' ? 'pending' : 'pending_on_delivery'),
        notes: JSON.stringify({
          subtotal: financials.subtotal,
          shippingCost: financials.shippingCost,
          tax: financials.tax,
          total: financials.total,
          lastFourDigits,
        }),
      });
    });

    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Invalidate product cache for all items in the order
    for (const item of items) {
      cache.delete(CACHE_KEYS.PRODUCT_DETAIL(item.productId));
    }
    // Also invalidate product list cache
    cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);

    res.status(201).json({
      id: order.id,
      orderNumber: order.orderNumber,
      message: 'Order created successfully',
    });
  } catch (error) {
    logger.error('Guest checkout failed', error);
    const { status, message } = safeOrderErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

// Fetch guest order details (no authentication required)
router.get('/checkout/guest/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only return guest orders (no userId)
    if (order.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    logger.error('Guest order fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.patch('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (status && !ALLOWED_ORDER_STATUSES.has(String(status).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    if (paymentStatus && !ALLOWED_PAYMENT_STATUSES.has(String(paymentStatus).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    res.json(order);
  } catch (error) {
    logger.error('Order patch failed', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.put('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    if (status && !ALLOWED_ORDER_STATUSES.has(String(status).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    if (paymentStatus && !ALLOWED_PAYMENT_STATUSES.has(String(paymentStatus).toLowerCase())) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // Fetch the current order with all details to check if status changed
    const currentOrder = await prisma.order.findUnique({
      where: { id: id as string },
      include: {
        user: { select: { name: true, email: true } },
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

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const normalizedStatus = status ? String(status).toLowerCase() : undefined;
    const statusChanged = normalizedStatus && normalizedStatus !== currentOrder.status;

    const order = await prisma.order.update({
      where: { id: id as string },
      data: {
        ...(normalizedStatus && { status: normalizedStatus }),
        ...(paymentStatus && { paymentStatus: String(paymentStatus).toLowerCase() }),
      },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    // If status changed, send email to customer
    if (statusChanged && order.items && order.items.length > 0) {
      const customerEmail = order.user?.email || (currentOrder as any).guestEmail;
      const customerName = order.user?.name || (currentOrder as any).guestName || 'Valued Customer';
      
      if (customerEmail) {
        try {
          // Parse shipping address
          const shippingAddress = typeof currentOrder.shippingAddress === 'string'
            ? JSON.parse(currentOrder.shippingAddress)
            : currentOrder.shippingAddress;

          // Parse notes to get pricing details
          const notes = currentOrder.notes ? JSON.parse(currentOrder.notes) : {};

          // Prepare email options with new status
          const emailOptions = {
            email: customerEmail,
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: customerName,
            status: status,
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

          // Get the appropriate email generator based on status
          const emailGenerator = getEmailGeneratorForStatus(normalizedStatus as string);
          const htmlContent = emailGenerator(emailOptions);
          await sendOrderConfirmationEmail(customerEmail, htmlContent);
        } catch (emailError) {
          logger.warn('Order status email failed to send', { orderId: order.id, status, error: emailError instanceof Error ? emailError.message : 'Unknown error' });
          // Don't fail the order update if email fails
        }
      }
    }

    res.json(order);
  } catch (error) {
    logger.error('Order update failed', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.delete('/:id', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch the order with items first to check it exists and get item details
    const order = await prisma.order.findUnique({
      where: { id: id as string },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Use transaction to ensure stock restoration and order deletion are atomic
    const deletedOrder = await prisma.$transaction(async (tx) => {
      // Restore stock for all items in the order
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Delete order items first (due to foreign key constraints)
      await tx.orderItem.deleteMany({
        where: { orderId: id as string },
      });

      // Then delete the order
      const removed = await tx.order.delete({
        where: { id: id as string },
      });

      return removed;
    });

    // Invalidate product cache for all items in the order
    for (const item of order.items) {
      cache.delete(CACHE_KEYS.PRODUCT_DETAIL(item.productId));
    }
    // Also invalidate product list cache
    cache.deletePattern(`${CACHE_KEYS.PRODUCTS_LIST}:.*`);

    res.json({ success: true, message: 'Order deleted successfully and stock restored', order: deletedOrder });
  } catch (error) {
    logger.error('Order deletion failed', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
