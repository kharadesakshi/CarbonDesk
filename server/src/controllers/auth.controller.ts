import { Request, Response } from 'express';
import { CarbonDeveloper } from '../models';
import { hashPassword, comparePassword, signToken, sanitizeDeveloper } from '../services/auth.service';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../validators/auth.validator';
import { AppError } from '../middleware/errorHandler';

export async function register(req: Request, res: Response): Promise<void> {
  const data = registerSchema.parse(req.body);

  const existing = await CarbonDeveloper.findOne({ where: { email: data.email } });
  if (existing) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  const passwordHash = await hashPassword(data.password);

  const developer = await CarbonDeveloper.create({
    fullName: data.fullName,
    email: data.email,
    passwordHash,
    phone: data.phone ?? null,
    organizationName: data.organizationName ?? null,
    organizationType: data.organizationType ?? null,
    registrationNumber: data.registrationNumber ?? null,
    country: data.country ?? null,
    state: data.state ?? null,
    city: data.city ?? null,
    address: data.address ?? null,
  });

  const token = signToken({ developerId: developer.id, email: developer.email });

  res.status(201).json({
    message: 'Account created successfully.',
    token,
    developer: sanitizeDeveloper(developer),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const data = loginSchema.parse(req.body);

  const developer = await CarbonDeveloper.findOne({ where: { email: data.email } });
  if (!developer) {
    throw new AppError('Invalid email or password.', 401);
  }

  const valid = await comparePassword(data.password, developer.passwordHash);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Update last login
  await developer.update({ lastLoginAt: new Date() });

  const token = signToken({ developerId: developer.id, email: developer.email });

  res.json({
    message: 'Login successful.',
    token,
    developer: sanitizeDeveloper(developer),
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const developer = await CarbonDeveloper.findByPk(req.developer!.developerId);
  if (!developer) {
    throw new AppError('Developer account not found.', 404);
  }
  res.json({ developer: sanitizeDeveloper(developer) });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const data = updateProfileSchema.parse(req.body);
  const developer = await CarbonDeveloper.findByPk(req.developer!.developerId);
  if (!developer) {
    throw new AppError('Developer account not found.', 404);
  }
  await developer.update(data);
  res.json({ message: 'Profile updated.', developer: sanitizeDeveloper(developer) });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const data = changePasswordSchema.parse(req.body);
  const developer = await CarbonDeveloper.findByPk(req.developer!.developerId);
  if (!developer) {
    throw new AppError('Developer account not found.', 404);
  }

  const valid = await comparePassword(data.currentPassword, developer.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect.', 400);
  }

  const passwordHash = await hashPassword(data.newPassword);
  await developer.update({ passwordHash });

  res.json({ message: 'Password updated successfully.' });
}

