import { Request, Response, NextFunction } from 'express';

export function requireRoles(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((role) => role.toUpperCase());

  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;

    if (!role || !normalizedAllowed.includes(String(role).toUpperCase())) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}