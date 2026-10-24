/**
 * Dashboard Service
 * Aggregates stats for dashboard with caching
 * Reduces database load by caching frequently accessed data
 */

import { Project, Participant, Document } from '../../models';
import { CacheService } from '../cache/CacheService';
import sequelize from '../../config/database';
import { QueryTypes } from 'sequelize';
import { fn, col } from 'sequelize';

export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    archived: number;
  };
  participants: {
    total: number;
    active: number;
    inactive: number;
  };
  documents: {
    total: number;
    byType: Record<string, number>;
  };
  gis: {
    projectsWithBoundary: number;
    totalAreaHa: number;
  };
  recentActivity: Array<{
    type: 'project' | 'participant' | 'document';
    action: string;
    timestamp: Date;
  }>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_STATS = 'dashboard_stats_all';
const CACHE_KEY_STATS_DEV = (developerId: string) => `dashboard_stats_${developerId}`;

export class DashboardService {
  /**
   * Get complete dashboard statistics
   * Uses cache to avoid heavy database queries
   */
  static async getStats(developerId: string): Promise<DashboardStats> {
    const cacheKey = CACHE_KEY_STATS_DEV(developerId);

    // Try to get from cache first
    const cached = CacheService.get<DashboardStats>(cacheKey);
    if (cached) {
      return cached;
    }

    console.log(`[DASHBOARD] Cache miss for developer: ${developerId}, loading fresh data...`);

    // Load fresh data
    const stats: DashboardStats = {
      projects: await this.getProjectStats(developerId),
      participants: await this.getParticipantStats(developerId),
      documents: await this.getDocumentStats(developerId),
      gis: await this.getGISStats(developerId),
      recentActivity: await this.getRecentActivity(developerId),
    };

    // Cache for 5 minutes
    CacheService.set(cacheKey, stats, { ttl: CACHE_TTL });

    return stats;
  }

  /**
   * Get project statistics
   */
  private static async getProjectStats(
    developerId: string
  ): Promise<DashboardStats['projects']> {
    const where = { developerId };

    const [total, active, completed, archived] = await Promise.all([
      Project.count({ where }),
      Project.count({ where: { ...where, status: 'active' } }),
      Project.count({ where: { ...where, status: 'completed' } }),
      Project.count({ where: { ...where, status: 'archived' } }),
    ]);

    return { total, active, completed, archived };
  }

  /**
   * Get participant statistics across all developer's projects
   */
  private static async getParticipantStats(
    developerId: string
  ): Promise<DashboardStats['participants']> {
    // Get all project IDs for this developer
    const projects = await Project.findAll({
      where: { developerId },
      attributes: ['id'],
      raw: true,
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { total: 0, active: 0, inactive: 0 };
    }

    const [total, active, inactive] = await Promise.all([
      Participant.count({ where: { projectId: projectIds } }),
      Participant.count({ where: { projectId: projectIds, status: 'active' } }),
      Participant.count({ where: { projectId: projectIds, status: 'inactive' } }),
    ]);

    return { total, active, inactive };
  }

  /**
   * Get document statistics across all developer's projects
   */
  private static async getDocumentStats(
    developerId: string
  ): Promise<DashboardStats['documents']> {
    const projects = await Project.findAll({
      where: { developerId },
      attributes: ['id'],
      raw: true,
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { total: 0, byType: {} };
    }

    // Get total count
    const total = await Document.count({
      where: { projectId: projectIds },
    });

    // Get count by type (using raw query for efficiency)
    const byTypeResult = await sequelize.query(
      `SELECT file_type, COUNT(*) as count FROM documents 
       WHERE project_id = ANY($1) 
       GROUP BY file_type`,
      {
        bind: [projectIds],
        type: QueryTypes.SELECT,
      }
    );

    const byType: Record<string, number> = {};
    (byTypeResult as any[]).forEach((row) => {
      byType[row.file_type] = parseInt(row.count, 10);
    });

    return { total, byType };
  }

  /**
   * Get GIS statistics across all developer's projects
   */
  private static async getGISStats(
    developerId: string
  ): Promise<DashboardStats['gis']> {
    const projects = await Project.findAll({
      where: { developerId },
      attributes: ['id'],
      raw: true,
    });

    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) {
      return { projectsWithBoundary: 0, totalAreaHa: 0 };
    }

    // Using raw query for efficiency with aggregates
    const result = await sequelize.query(
      `SELECT 
         COUNT(*) as projects_with_boundary,
         COALESCE(SUM(CAST(calculated_area_ha AS FLOAT)), 0) as total_area_ha
       FROM project_gis 
       WHERE project_id = ANY($1) AND boundary_geojson IS NOT NULL`,
      {
        bind: [projectIds],
        type: QueryTypes.SELECT,
      }
    );

    const row = (result as any[])[0];

    return {
      projectsWithBoundary: parseInt(row.projects_with_boundary, 10) || 0,
      totalAreaHa: parseFloat(row.total_area_ha) || 0,
    };
  }

  /**
   * Get recent activity (simplified)
   * In production, use an audit table for this
   */
  private static async getRecentActivity(
    developerId: string
  ): Promise<DashboardStats['recentActivity']> {
    // Get recent projects
    const recentProjects = await Project.findAll({
      where: { developerId },
      attributes: ['id', 'name', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5,
      raw: true,
    });

    const activity: DashboardStats['recentActivity'] = recentProjects.map((p: any) => ({
      type: 'project',
      action: `Updated project: ${p.name}`,
      timestamp: p.updatedAt,
    }));

    return activity;
  }

  /**
   * Invalidate dashboard cache for developer
   * Call this after creating/updating/deleting projects, participants, documents
   */
  static invalidateForDeveloper(developerId: string): void {
    const cacheKey = CACHE_KEY_STATS_DEV(developerId);
    CacheService.delete(cacheKey);
    console.log(`[DASHBOARD] Cache invalidated for developer: ${developerId}`);
  }

  /**
   * Get cache stats (for monitoring)
   */
  static getCacheStats() {
    return CacheService.getStats();
  }
}
