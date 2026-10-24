import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, UploadResult } from './StorageService';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(process.env.LOCAL_STORAGE_PATH || './uploads');
    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string
  ): Promise<UploadResult> {
    const ext = path.extname(originalName);
    const safeFileName = `${uuidv4()}${ext}`;
    const folderPath = path.join(this.basePath, folder);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, safeFileName);
    fs.writeFileSync(filePath, fileBuffer);

    // storagePath is the relative path from basePath — never expose full server path
    const storagePath = path.join(folder, safeFileName);

    return {
      storagePath,
      storageProvider: 'local',
    };
  }

  async getDownloadUrl(storagePath: string): Promise<string> {
    // Returns a relative API path — the document controller serves the file
    return `/api/documents/file/${encodeURIComponent(storagePath)}`;
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  /** Used by document controller to read file for streaming */
  getFullPath(storagePath: string): string {
    return path.join(this.basePath, storagePath);
  }
}
