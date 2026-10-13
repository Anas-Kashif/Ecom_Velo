import { Request, Response, NextFunction } from 'express';
import os from 'os';
import { logger } from './logger';

/**
 * Production monitoring and health check system
 */

interface PerformanceMetric {
  timestamp: Date;
  duration: number;
  path: string;
  method: string;
  statusCode: number;
  userId?: string;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  checks: {
    database: boolean;
    memory: boolean;
    disk: boolean;
    responseTime: boolean;
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
  };
}

class Monitor {
  private metrics: PerformanceMetric[] = [];
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private maxMetrics = 1000;
  private dbHealthy = true;

  /**
   * Middleware to track request performance
   */
  requestTracker = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Track when response is sent
    const originalJson = res.json;
    const originalSend = res.send;

    const trackResponse = (statusCode: number) => {
      const duration = Date.now() - startTime;

      const metric: PerformanceMetric = {
        timestamp: new Date(),
        duration,
        path: req.path,
        method: req.method,
        statusCode,
        userId: (req as any).userId,
      };

      this.addMetric(metric);

      if (statusCode >= 400) {
        this.errorCount++;
      }
      this.requestCount++;

      // Log slow requests in production
      if (duration > 1000 && process.env.NODE_ENV === 'production') {
        logger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration,
        });
      }
    };

    res.json = function (this: any, body: any) {
      trackResponse(res.statusCode);
      return originalJson.call(this, body);
    };

    res.send = function (this: any, body: any) {
      trackResponse(res.statusCode);
      return originalSend.call(this, body);
    };

    next();
  };

  /**
   * Add performance metric
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / this.metrics.length);
  }

  /**
   * Get memory usage percentage
   */
  getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return Math.round((usedMemory / totalMemory) * 100);
  }

  /**
   * Get CPU usage percentage
   */
  getCpuUsage(): number {
    const usage = process.cpuUsage();
    const totalUsage = usage.user + usage.system;
    // Rough estimate: divide by 10000000 for percentage
    return Math.min(Math.round(totalUsage / 10000000), 100);
  }

  /**
   * Get process uptime in seconds
   */
  getUptime(): number {
    return Math.round((Date.now() - this.startTime) / 1000);
  }

  /**
   * Check database health
   */
  setDatabaseHealth(healthy: boolean) {
    this.dbHealthy = healthy;
  }

  /**
   * Get comprehensive health check
   */
  async getHealthCheck(checkDatabase?: () => Promise<boolean>): Promise<HealthCheckResult> {
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();
    const avgResponseTime = this.getAverageResponseTime();

    // Check if database is healthy
    let dbHealthy = this.dbHealthy;
    if (checkDatabase) {
      try {
        dbHealthy = await checkDatabase();
      } catch {
        dbHealthy = false;
      }
    }

    const checks = {
      database: dbHealthy,
      memory: memoryUsage < 90,
      disk: true, // Would require actual disk check
      responseTime: avgResponseTime < 5000,
    };

    const allHealthy = Object.values(checks).every(v => v === true);
    const anyUnhealthy = Object.values(checks).some(v => v === false);

    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
      timestamp: new Date(),
      uptime: this.getUptime(),
      checks,
      metrics: {
        memoryUsage,
        cpuUsage,
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        averageResponseTime: avgResponseTime,
      },
    };
  }

  /**
   * Get recent error metrics
   */
  getErrorMetrics(minutes: number = 5) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentErrors = this.metrics.filter(
      m => m.statusCode >= 400 && m.timestamp.getTime() > cutoff,
    );

    return {
      errorCount: recentErrors.length,
      errorRate: this.requestCount > 0 ? (recentErrors.length / this.requestCount) * 100 : 0,
      errors: recentErrors.map(e => ({
        path: e.path,
        method: e.method,
        statusCode: e.statusCode,
        timestamp: e.timestamp,
      })),
    };
  }

  /**
   * Get request performance statistics
   */
  getPerformanceStats(minutes: number = 5) {
    const cutoff = Date.now() - minutes * 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);

    if (recentMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        slowRequests: [],
      };
    }

    const durations = recentMetrics.map(m => m.duration);
    const slowRequests = recentMetrics.filter(m => m.duration > 1000);

    return {
      count: recentMetrics.length,
      avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowRequests: slowRequests.map(r => ({
        path: r.path,
        method: r.method,
        duration: r.duration,
        timestamp: r.timestamp,
      })),
    };
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
    this.requestCount = 0;
    this.errorCount = 0;
  }
}

// Export singleton instance
export const monitor = new Monitor();
