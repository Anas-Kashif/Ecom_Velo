import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

interface BucketState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketState>();

function getClientKey(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function createRateLimiter({ windowMs, max, message }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${getClientKey(req)}:${req.method}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      res.setHeader('Retry-After', Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }

    existing.count += 1;
    buckets.set(key, existing);
    next();
  };
}