import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { User } from '../models/index.ts';
import type { UserRole } from '../models/User.ts';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: string;
    academicProfile: any;
  };
}

export function signAuthToken(user: { _id: string; email: string; role: UserRole }) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string | undefined);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; role: UserRole };
    const user: any = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      academicProfile: user.academicProfile || {},
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string | undefined);
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      const user: any = await User.findById(decoded.sub);
      if (user && user.status !== 'suspended') {
        req.user = {
          id: String(user._id),
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          academicProfile: user.academicProfile || {},
        };
      }
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}
