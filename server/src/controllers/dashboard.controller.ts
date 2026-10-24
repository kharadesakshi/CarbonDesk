/**
 * Dashboard Controller
 * Provides endpoints for dashboard data
 */

import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard/DashboardService';
import { CacheService } from '../services/cache/CacheService';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;

  const stats = await DashboardService.getStats(developerId);

  res.json({
    data: stats,
    cached: CacheService.has(`dashboard_stats_${developerId}`),
  });
}

export async function getCacheStatus(req: Request, res: Response): Promise<void> {
  const stats = CacheService.getStats();

  res.json({
    data: {
      size: stats.size,
      entries: stats.entries,
    },
  });
}

export async function clearCache(req: Request, res: Response): Promise<void> {
  CacheService.clear();

  res.json({ message: 'Cache cleared.' });
}
