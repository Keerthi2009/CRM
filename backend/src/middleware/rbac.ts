import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type Role = 'AGGREGATOR' | 'ADMIN' | 'MANAGER' | 'SALES_REP';

const roleHierarchy: Record<Role, number> = {
  AGGREGATOR: 4,
  ADMIN: 3,
  MANAGER: 2,
  SALES_REP: 1,
};

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userRole = req.user.role as Role;
    const minRequired = Math.min(...roles.map(r => roleHierarchy[r]));
    if (roleHierarchy[userRole] < minRequired) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export const requireAggregator = requireRole('AGGREGATOR');
export const requireAdmin = requireRole('ADMIN');
export const requireManager = requireRole('MANAGER');
