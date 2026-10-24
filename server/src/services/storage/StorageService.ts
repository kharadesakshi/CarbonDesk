/**
 * Storage abstraction layer.
 * Swap providers by changing STORAGE_PROVIDER env var.
 * The rest of the application always calls StorageService methods.
 */

export interface UploadResult {
  storagePath: string;     // internal identifier (file path or S3 key)
  storageProvider: 'local' | 's3';
}

export interface StorageProvider {
  upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string
  ): Promise<UploadResult>;

  getDownloadUrl(storagePath: string): Promise<string>;
  delete(storagePath: string): Promise<void>;
}
