import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CarbonDeveloper } from '../models';
import { AppError } from '../middleware/errorHandler';
import { AuthPayload } from '../middleware/auth';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError('JWT secret not configured.', 500);
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export function sanitizeDeveloper(dev: CarbonDeveloper) {
  const data = dev.toJSON() as any;
  delete data.passwordHash;
  return data;
}
