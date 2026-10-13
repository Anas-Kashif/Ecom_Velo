import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';
import adminRoutes from './routes/admin';
import emailRoutes from './routes/emails';

// Import error handling
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { requireRoles } from './middleware/roles';

// Import monitoring
import { monitor } from './utils/monitoring';
import { logger } from './utils/logger';

// Import HTTPS config
import HttpsConfig from './utils/httpsConfig';

dotenv.config({ path: '.env.local' });
dotenv.config();


const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add security headers (for HTTPS)
if (process.env.NODE_ENV === 'production') {
  app.use(HttpsConfig.securityHeaders());
}

// Add monitoring middleware
app.use(monitor.requestTracker);

// ============================================
// HEALTH CHECK & MONITORING
// ============================================
app.get('/health', async (req, res) => {
  const checkDb = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  };

  const health = await monitor.getHealthCheck(checkDb);
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503;
  res.status(statusCode).json(health);
});

// Monitoring endpoints (for internal use or admin dashboard)
app.get('/api/monitoring/stats', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const errors = monitor.getErrorMetrics(5);
    const performance = monitor.getPerformanceStats(5);
    const health = await monitor.getHealthCheck();

    res.json({
      health,
      errors,
      performance,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Monitoring stats fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch monitoring stats' });
  }
});

app.get('/api/monitoring/health', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const checkDb = async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    };

    const health = await monitor.getHealthCheck(checkDb);
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 207 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Monitoring health fetch failed', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

// ============================================
// ADMIN ROUTES
// ============================================
app.use('/api/admin', adminRoutes);

// ============================================
// EMAIL ROUTES
// ============================================
app.use('/api/emails', emailRoutes);

app.get('/api/admin/dashboard', authenticate, requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Get time ranges for comparisons
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const previousMonthStart = new Date(thirtyDaysAgo);
    previousMonthStart.setDate(1);
    const previousMonthEnd = new Date(today);
    previousMonthEnd.setDate(1);

    // Basic counts
    const totalUsers = await prisma.user.count();
    const totalOrders = await prisma.order.count();
    const totalProducts = await prisma.product.count();

    // Total revenue (only delivered + paid orders)
    const totalRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'delivered',
        paymentStatus: 'paid',
      },
    });
    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

    // Today's revenue (only delivered + paid orders)
    const todayRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: {
          gte: today,
        },
      },
    });
    const todayRevenue = todayRevenueResult._sum.totalAmount || 0;

    // Yesterday's revenue (only delivered + paid orders)
    const yesterdayRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });
    const yesterdayRevenue = yesterdayRevenueResult._sum.totalAmount || 0;

    // Last 30 days revenue (only delivered + paid orders)
    const last30DaysRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
    const last30DaysRevenue = last30DaysRevenueResult._sum.totalAmount || 0;

    // Previous 30 days revenue (only delivered + paid orders)
    const previous30DaysRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'delivered',
        paymentStatus: 'paid',
        createdAt: {
          gte: previousMonthStart,
          lt: thirtyDaysAgo,
        },
      },
    });
    const previous30DaysRevenue = previous30DaysRevenueResult._sum.totalAmount || 0;

    // Calculate growth percentages
    const todayGrowth = yesterdayRevenue === 0
      ? (todayRevenue > 0 ? 100 : 0)
      : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

    const monthGrowth = previous30DaysRevenue === 0
      ? (last30DaysRevenue > 0 ? 100 : 0)
      : ((last30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100;

    // Orders count
    const todayOrdersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    const totalOrdersCount = await prisma.order.count();

    // Total delivered + paid orders count (for avg calculation)
    const totalDeliveredOrdersCount = await prisma.order.count({
      where: {
        status: 'delivered',
        paymentStatus: 'paid',
      },
    });

    // Revenue breakdown by order status
    const revenueByStatus = await prisma.order.groupBy({
      by: ['status'],
      _sum: { totalAmount: true },
      _count: true,
    });

    const statusBreakdown = revenueByStatus.map(item => ({
      status: item.status,
      revenue: item._sum.totalAmount || 0,
      count: item._count,
    }));

    // Average order value (only from delivered orders)
    const avgOrderValue = totalDeliveredOrdersCount > 0 ? totalRevenue / totalDeliveredOrdersCount : 0;

    // Daily revenue data for chart (last 7 days - only delivered + paid orders)
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRevenueResult = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'delivered',
          paymentStatus: 'paid',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenueResult._sum.totalAmount || 0,
      });
    }

    res.json({
      totalUsers,
      totalOrders: totalOrdersCount,
      totalProducts,
      totalRevenue,
      todayRevenue,
      yesterdayRevenue,
      todayGrowth: Math.round(todayGrowth * 100) / 100,
      monthGrowth: Math.round(monthGrowth * 100) / 100,
      last30DaysRevenue,
      todayOrdersCount,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      statusBreakdown,
      dailyRevenue,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Dashboard fetch failed', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// 404 Handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// ============================================
// START SERVER WITH HTTPS SUPPORT
// ============================================
async function startServer() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error('Database connection failed', error);
  }

  // Get HTTPS configuration
  const httpsOptions = HttpsConfig.fromEnvironment();
  
  // Create secure server
  const server = HttpsConfig.createSecureServer(app, {
    ...httpsOptions,
    port: httpsOptions.port || (process.env.NODE_ENV === 'production' ? 443 : 3001),
  });

  const serverPort = httpsOptions.enabled ? httpsOptions.port : PORT;
  const protocol = httpsOptions.enabled ? 'https' : 'http';

  server.listen(serverPort, async () => {
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
