import multer from 'multer';
import { AppError } from './errorHandler';

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10 MB default

const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_MIME_TYPES ||
  'application/pdf,image/jpeg,image/png,image/gif,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain'
)
  .split(',')
  .map(t => t.trim());

// Use memory storage — the storage service handles persistence
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type "${file.mimetype}" is not allowed.`, 400));
    }
  },
});
