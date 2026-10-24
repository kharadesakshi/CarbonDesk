/**
 * File Validator Middleware
 * Validates file uploads: MIME type, file size, extension
 * Prevents malicious or oversized file uploads
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Allowed MIME types for document uploads
 * Based on common document, spreadsheet, presentation, and image formats
 */
export const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',

  // Spreadsheets
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',

  // Presentations
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',

  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',

  // GIS Data
  'application/json': 'json', // GeoJSON
  'application/geo+json': 'geojson',

  // Archive (for batch uploads)
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

/**
 * Allowed file extensions (lowercase)
 */
export const ALLOWED_EXTENSIONS = new Set(Object.values(ALLOWED_MIME_TYPES));

/**
 * Maximum file size in bytes
 * 10 MB default
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Maximum total upload size in bytes
 * 100 MB default (for batch operations)
 */
export const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB

/**
 * Validate file MIME type
 */
export function validateMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES;
}

/**
 * Validate file extension
 */
export function validateExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.has(ext) : false;
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string | null {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Sanitize filename to prevent directory traversal attacks
 * Removes path separators, null bytes, and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  return (
    filename
      // Remove path separators
      .replace(/[\/\\]/g, '_')
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove leading dots
      .replace(/^\.+/, '')
      // Remove special characters except . - _
      .replace(/[^a-zA-Z0-9._\-]/g, '_')
      // Collapse multiple underscores
      .replace(/_+/g, '_')
      // Limit length to 255 chars (filesystem limit)
      .substring(0, 255)
  );
}

/**
 * Middleware to validate single file upload
 * Attach to multer middleware: fileValidator('file')
 */
export function fileValidator(fieldName: string = 'file') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = (req as any).file;

    // Check file exists
    if (!file) {
      throw new AppError(`No file provided in field: ${fieldName}`, 400);
    }

    // Check MIME type
    if (!validateMimeType(file.mimetype)) {
      throw new AppError(
        `File type not allowed: ${file.mimetype}. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`,
        400
      );
    }

    // Check extension
    if (!validateExtension(file.originalname)) {
      throw new AppError(
        `File extension not allowed. Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
        400
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
      throw new AppError(`File too large. Maximum size: ${sizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`, 400);
    }

    // Check file size is not zero
    if (file.size === 0) {
      throw new AppError('File is empty. Please upload a file with content.', 400);
    }

    // Sanitize filename for storage
    file.sanitizedName = sanitizeFilename(file.originalname);

    next();
  };
}

/**
 * Middleware to validate multiple file uploads (batch)
 * Attach to multer middleware: batchFileValidator('files')
 */
export function batchFileValidator(fieldName: string = 'files') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const files = (req as any).files;

    // Check files exist
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new AppError(`No files provided in field: ${fieldName}`, 400);
    }

    let totalSize = 0;
    const errors: string[] = [];

    files.forEach((file: any, index: number) => {
      const fileNum = index + 1;

      // Check MIME type
      if (!validateMimeType(file.mimetype)) {
        errors.push(`File ${fileNum} (${file.originalname}): Invalid type ${file.mimetype}`);
      }

      // Check extension
      if (!validateExtension(file.originalname)) {
        errors.push(`File ${fileNum} (${file.originalname}): Invalid extension`);
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
        errors.push(`File ${fileNum} (${file.originalname}): Too large (max ${sizeMB}MB)`);
      }

      // Check for empty files
      if (file.size === 0) {
        errors.push(`File ${fileNum} (${file.originalname}): Empty file`);
      }

      totalSize += file.size;

      // Sanitize filename
      file.sanitizedName = sanitizeFilename(file.originalname);
    });

    // Check total upload size
    if (totalSize > MAX_TOTAL_SIZE) {
      const totalMB = (MAX_TOTAL_SIZE / 1024 / 1024).toFixed(1);
      errors.push(`Total upload size too large (max ${totalMB}MB, current ${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    if (errors.length > 0) {
      throw new AppError(`File validation failed:\n${errors.join('\n')}`, 400);
    }

    next();
  };
}

/**
 * Middleware to check file size limit
 * Use as a preliminary check before multer
 */
export function checkFileSizeLimit(req: Request, res: Response, next: NextFunction): void {
  const contentLength = req.get('content-length');

  if (!contentLength) {
    next();
    return;
  }

  const bytes = parseInt(contentLength, 10);

  if (bytes > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(1);
    throw new AppError(
      `Request too large. Maximum file size: ${sizeMB}MB (request: ${(bytes / 1024 / 1024).toFixed(2)}MB)`,
      413 // Payload Too Large
    );
  }

  next();
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file before S3 upload
 * Used by S3StorageProvider
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedName?: string;
}

export function validateFileForStorage(filename: string, mimeType: string, sizeBytes: number): FileValidationResult {
  // Check MIME type
  if (!validateMimeType(mimeType)) {
    return {
      isValid: false,
      error: `Invalid MIME type: ${mimeType}`,
    };
  }

  // Check extension
  if (!validateExtension(filename)) {
    return {
      isValid: false,
      error: `Invalid file extension`,
    };
  }

  // Check size
  if (sizeBytes > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large (max ${formatFileSize(MAX_FILE_SIZE)})`,
    };
  }

  // Check not empty
  if (sizeBytes === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    };
  }

  return {
    isValid: true,
    sanitizedName: sanitizeFilename(filename),
  };
}
