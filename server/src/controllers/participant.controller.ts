import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Project, Participant, Document } from '../models';
import { createParticipantSchema, updateParticipantSchema } from '../validators/participant.validator';
import { AppError } from '../middleware/errorHandler';

async function assertProjectOwnership(projectId: string, developerId: string): Promise<Project> {
  const project = await Project.findOne({ where: { id: projectId, developerId } });
  if (!project) {
    throw new AppError('Project not found or access denied.', 404);
  }
  return project;
}

export async function listParticipants(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;
  const { search, status, page = '1', limit = '50' } = req.query as Record<string, string>;

  await assertProjectOwnership(projectId, developerId);

  const where: any = { projectId };
  if (status) where.status = status;
  if (search) {
    where[Op.or as any] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { participantCode: { [Op.iLike]: `%${search}%` } },
      { plotId: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(200, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  // Optimized query: use LEFT OUTER JOIN and COUNT aggregate
  // This eliminates N+1 by fetching participants and document counts in one query
  const { count, rows } = await Participant.findAndCountAll({
    where,
    limit: pageSize,
    offset,
    order: [['fullName', 'ASC']],
    include: [
      {
        association: 'documents',  // Use the alias defined in model
        attributes: [],  // Don't select document fields, just count them
        required: false, // LEFT JOIN to include participants with 0 documents
        duplicating: false,
      },
    ],
    attributes: {
      include: [
        // Count documents for each participant
        [fn('COUNT', col('documents.id')), 'documentCount'],
      ],
    },
    subQuery: false,  // Prevent Sequelize from creating subqueries
    group: ['Participant.id'],  // Group by participant to get accurate counts
    raw: true,
  });

  res.json({
    data: rows.map((p: any) => ({
      ...p,
      documentCount: parseInt(p.documentCount || 0, 10),
    })),
    pagination: {
      total: count.length,
      page: pageNum,
      limit: pageSize,
      totalPages: Math.ceil(count.length / pageSize),
    },
  });
}

export async function createParticipant(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;

  const project = await assertProjectOwnership(projectId, developerId);
  const data = createParticipantSchema.parse(req.body);

  const participant = await Participant.create({
    ...data,
    projectId: projectId as string,
    email: data.email || null,
    enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : null,
    consentDate: data.consentDate ? new Date(data.consentDate) : null,
  });

  // Update project participant count
  const count = await Participant.count({ where: { projectId } });
  await project.update({ participantCount: count });

  res.status(201).json({ message: 'Participant added.', data: participant });
}

export async function getParticipant(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const id = req.params.id as string;

  // Optimized: use include with COUNT aggregate instead of separate count query
  const participant = await Participant.findByPk(id, {
    include: [
      {
        association: 'documents',  // Use the alias defined in model
        attributes: [],
        required: false,
      },
    ],
    attributes: {
      include: [
        [fn('COUNT', col('documents.id')), 'documentCount'],
      ],
    },
    group: ['Participant.id'],
    raw: true,
    subQuery: false,
  });

  if (!participant) throw new AppError('Participant not found.', 404);

  await assertProjectOwnership(participant.projectId, developerId);

  res.json({
    data: {
      ...participant,
      documentCount: parseInt((participant as any).documentCount || 0, 10),
    },
  });
}

export async function updateParticipant(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const id = req.params.id as string;

  const participant = await Participant.findByPk(id);
  if (!participant) throw new AppError('Participant not found.', 404);

  await assertProjectOwnership(participant.projectId, developerId);

  const data = updateParticipantSchema.parse(req.body);
  const { enrollmentDate, consentDate, ...rest } = data;
  await participant.update({
    ...rest,
    ...(enrollmentDate !== undefined ? { enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : null } : {}),
    ...(consentDate !== undefined ? { consentDate: consentDate ? new Date(consentDate) : null } : {}),
  });

  res.json({ message: 'Participant updated.', data: participant });
}

export async function deleteParticipant(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const id = req.params.id as string;

  const participant = await Participant.findByPk(id);
  if (!participant) throw new AppError('Participant not found.', 404);

  const project = await assertProjectOwnership(participant.projectId, developerId);

  await participant.destroy();

  // Update participant count
  const count = await Participant.count({ where: { projectId: project.id } });
  await project.update({ participantCount: count });

  res.json({ message: 'Participant deleted.' });
}
