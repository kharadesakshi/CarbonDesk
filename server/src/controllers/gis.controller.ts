import { Request, Response } from 'express';
import { Project, ProjectGIS } from '../models';
import { saveGISSchema } from '../validators/gis.validator';
import { AppError } from '../middleware/errorHandler';
import { GISService } from '../services/gis/GISService';

async function assertProjectOwnership(projectId: string, developerId: string): Promise<Project> {
  const project = await Project.findOne({ where: { id: projectId, developerId } });
  if (!project) throw new AppError('Project not found or access denied.', 404);
  return project;
}

export async function getGIS(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;

  await assertProjectOwnership(projectId, developerId);

  const gis = await ProjectGIS.findOne({ where: { projectId } });

  res.json({ data: gis ?? null });
}

export async function saveGIS(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;

  const project = await assertProjectOwnership(projectId, developerId);
  const data = saveGISSchema.parse(req.body);

  // Validate GeoJSON and calculate metrics if provided
  if (data.boundaryGeoJSON) {
    try {
      const metrics = GISService.calculateMetrics(data.boundaryGeoJSON);

      if (!metrics.isValid) {
        throw new AppError('Invalid GeoJSON geometry', 400);
      }

      // Use calculated values from server-side validation
      data.calculatedAreaHa = metrics.areaHa;
      data.perimeterKm = metrics.perimeterKm;

      // Log warnings for unusual sizes
      if (metrics.areaHa > 1_000_000) {
        console.warn(`[GIS] Large project boundary: ${metrics.areaHa} ha for project ${projectId}`);
      }
    } catch (err) {
      throw new AppError(
        `GIS validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        400
      );
    }
  }

  const existing = await ProjectGIS.findOne({ where: { projectId } });

  let gis: ProjectGIS;
  if (existing) {
    await existing.update({ ...data, lastEditedAt: new Date() });
    gis = existing;
  } else {
    gis = await ProjectGIS.create({
      projectId: projectId as string,
      ...data,
      coordinateSystem: data.coordinateSystem || 'WGS84',
      lastEditedAt: new Date(),
    });
  }

  // Mark project as having GIS data
  const hasGIS = !!(data.boundaryGeoJSON);
  await project.update({ hasGIS });

  res.json({ message: 'GIS data saved.', data: gis });
}

export async function deleteGIS(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;

  const project = await assertProjectOwnership(projectId, developerId);

  const gis = await ProjectGIS.findOne({ where: { projectId } });
  if (!gis) throw new AppError('No GIS data found for this project.', 404);

  await gis.destroy();
  await project.update({ hasGIS: false });

  res.json({ message: 'GIS data deleted.' });
}
