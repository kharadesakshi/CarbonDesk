import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { Project, Participant, Document } from '../models';
import { getStorageProvider, LocalStorageProvider } from '../services/storage';
import { AppError } from '../middleware/errorHandler';

async function assertProjectOwnership(projectId: string, developerId: string): Promise<Project> {
  const project = await Project.findOne({ where: { id: projectId, developerId } });
  if (!project) throw new AppError('Project not found or access denied.', 404);
  return project;
}

export async function listProjectDocuments(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;

  await assertProjectOwnership(projectId, developerId);

  const { participantId, documentType } = req.query as Record<string, string>;
  const where: any = { projectId };
  if (participantId) where.participantId = participantId;
  if (documentType) where.documentType = documentType;

  const docs = await Document.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });

  res.json({ data: docs });
}

export async function listParticipantDocuments(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const participantId = req.params.participantId as string;

  const participant = await Participant.findByPk(participantId);
  if (!participant) throw new AppError('Participant not found.', 404);

  await assertProjectOwnership(participant.projectId, developerId);

  const docs = await Document.findAll({
    where: { participantId },
    order: [['createdAt', 'DESC']],
  });

  res.json({ data: docs });
}

export async function uploadDocument(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const participantId = req.params.participantId as string;
  const file = req.file;

  if (!file) throw new AppError('No file uploaded.', 400);

  const participant = await Participant.findByPk(participantId);
  if (!participant) throw new AppError('Participant not found.', 404);

  await assertProjectOwnership(participant.projectId, developerId);

  const documentName = (req.body.documentName as string) || file.originalname;
  const documentType = (req.body.documentType as string) || 'Other';
  const notes = (req.body.notes as string) || null;

  const storage = getStorageProvider();
  const folder = `projects/${participant.projectId}/participants/${participantId}`;

  const { storagePath, storageProvider } = await storage.upload(
    file.buffer,
    file.originalname,
    file.mimetype,
    folder
  );

  const doc = await Document.create({
    projectId: participant.projectId,
    participantId: participantId as string,
    uploadedById: developerId,
    documentName,
    documentType,
    originalFileName: file.originalname,
    storageProvider,
    storagePath,
    storageUrl: null,
    fileSizeBytes: file.size,
    mimeType: file.mimetype,
    notes,
  });

  res.status(201).json({ message: 'Document uploaded.', data: doc });
}

export async function uploadProjectDocument(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const projectId = req.params.projectId as string;
  const file = req.file;

  if (!file) throw new AppError('No file uploaded.', 400);

  await assertProjectOwnership(projectId, developerId);

  const documentName = (req.body.documentName as string) || file.originalname;
  const documentType = (req.body.documentType as string) || 'Other';
  const notes = (req.body.notes as string) || null;

  const storage = getStorageProvider();
  const folder = `projects/${projectId}`;

  const { storagePath, storageProvider } = await storage.upload(
    file.buffer,
    file.originalname,
    file.mimetype,
    folder
  );

  const doc = await Document.create({
    projectId: projectId as string,
    participantId: null,
    uploadedById: developerId,
    documentName,
    documentType,
    originalFileName: file.originalname,
    storageProvider,
    storagePath,
    storageUrl: null,
    fileSizeBytes: file.size,
    mimeType: file.mimetype,
    notes,
  });

  res.status(201).json({ message: 'Document uploaded.', data: doc });
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const id = req.params.id as string;

  const doc = await Document.findByPk(id);
  if (!doc) throw new AppError('Document not found.', 404);

  await assertProjectOwnership(doc.projectId, developerId);

  // Generate download URL
  const storage = getStorageProvider();
  const downloadUrl = await storage.getDownloadUrl(doc.storagePath);

  res.json({ data: { ...doc.toJSON(), downloadUrl } });
}

export async function downloadDocument(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const id = req.params.id as string;

  const doc = await Document.findByPk(id);
  if (!doc) throw new AppError('Document not found.', 404);

  await assertProjectOwnership(doc.projectId, developerId);

  if (doc.storageProvider === 'local') {
    const storage = getStorageProvider() as LocalStorageProvider;
    const fullPath = storage.getFullPath(doc.storagePath);

    if (!fs.existsSync(fullPath)) {
      throw new AppError('File not found on server.', 404);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFileName}"`);
    res.setHeader('Content-Type', doc.mimeType);
    res.sendFile(fullPath);
  } else {
    // S3 — redirect to signed URL
    const storage = getStorageProvider();
    const url = await storage.getDownloadUrl(doc.storagePath);
    res.redirect(url);
  }
}

export async function serveLocalFile(req: Request, res: Response): Promise<void> {
  // This endpoint serves local files — always protected by auth middleware
  const developerId = req.developer!.developerId;
  const storagePath = decodeURIComponent(req.params[0]);

  const doc = await Document.findOne({ where: { storagePath } });
  if (!doc) throw new AppError('File not found.', 404);

  await assertProjectOwnership(doc.projectId, developerId);

  if (doc.storageProvider !== 'local') {
    throw new AppError('File is not stored locally.', 400);
  }

  const storage = getStorageProvider() as LocalStorageProvider;
  const fullPath = storage.getFullPath(storagePath);

  if (!fs.existsSync(fullPath)) {
    throw new AppError('File not found on server.', 404);
  }

  res.setHeader('Content-Type', doc.mimeType);
  res.sendFile(fullPath);
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  const developerId = req.developer!.developerId;
  const id = req.params.id as string;

  const doc = await Document.findByPk(id);
  if (!doc) throw new AppError('Document not found.', 404);

  await assertProjectOwnership(doc.projectId, developerId);

  const storage = getStorageProvider();
  await storage.delete(doc.storagePath);
  await doc.destroy();

  res.json({ message: 'Document deleted.' });
}
