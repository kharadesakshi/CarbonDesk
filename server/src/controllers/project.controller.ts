import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Project, Participant } from '../models';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { AppError } from '../middleware/errorHandler';
import { DashboardService } from '../services/dashboard/DashboardService';

export async function listProjects(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const { search, status, type, page = '1', limit = '20', sortBy, sortOrder = 'DESC' } = req.query as Record<string, string>;

  const where: any = { developerId };
  if (status) where.status = status;
  if (type) where.projectType = type;
  if (search) {
    where[Op.or as any] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { projectCode: { [Op.iLike]: `%${search}%` } },
      { country: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  const validSortFields = ['updatedAt', 'createdAt', 'name', 'status'];
  const order: any[] = sortBy && validSortFields.includes(sortBy)
    ? [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']]
    : [['updatedAt', 'DESC'], ['createdAt', 'DESC']];

  const { count, rows } = await Project.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order,
  });

  res.json({
    data: rows,
    pagination: {
      total: count,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(count / pageSize),
    },
  });
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const data = createProjectSchema.parse(req.body);

  const project = await Project.create({
    ...data,
    developerId,
    status: data.status ?? 'draft',
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    startDate: data.startDate ? new Date(data.startDate) : null,
  });

  // Invalidate dashboard cache
  DashboardService.invalidateForDeveloper(developerId);

  res.status(201).json({ message: 'Project created.', data: project });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const { id } = req.params;

  const project = await Project.findOne({ where: { id, developerId } });
  if (!project) {
    throw new AppError('Project not found or access denied.', 404);
  }

  // Get fresh participant count
  const participantCount = await Participant.count({ where: { projectId: id } });
  await project.update({ participantCount });

  res.json({ data: project });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const { id } = req.params;

  const project = await Project.findOne({ where: { id, developerId } });
  if (!project) {
    throw new AppError('Project not found or access denied.', 404);
  }

  const data = updateProjectSchema.parse(req.body);
  const { startDate, ...rest } = data;
  await project.update({
    ...rest,
    ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
  });

  // Invalidate dashboard cache
  DashboardService.invalidateForDeveloper(developerId);

  res.json({ message: 'Project updated.', data: project });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const { id } = req.params;

  const project = await Project.findOne({ where: { id, developerId } });
  if (!project) {
    throw new AppError('Project not found or access denied.', 404);
  }

  await project.destroy();

  // Invalidate dashboard cache
  DashboardService.invalidateForDeveloper(developerId);

  res.json({ message: 'Project deleted.' });
}
