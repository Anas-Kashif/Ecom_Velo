import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7);
    const secret = getJwtSecret();
    
    try {
      const decoded = jwt.verify(token, secret) as any;
      req.userId = decoded.id;
      req.user = decoded;
      next();
    } catch (error) {
      logger.warn('Invalid authentication token rejected');
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    logger.error('Authentication middleware failure', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
