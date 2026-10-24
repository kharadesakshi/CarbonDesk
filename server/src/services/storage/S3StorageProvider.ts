/**
 * AWS S3 Storage Provider
 * Activated when STORAGE_PROVIDER=s3
 * 
 * Requires: @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
 * The rest of the application requires zero changes when switching from local to S3.
 */
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider, UploadResult } from './StorageService';

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.region = process.env.AWS_REGION || 'us-east-1';

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required when STORAGE_PROVIDER=s3');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required when STORAGE_PROVIDER=s3');
    }

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string
  ): Promise<UploadResult> {
    const ext = path.extname(originalName);
    const key = `${folder}/${uuidv4()}${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
          ServerSideEncryption: 'AES256',
        })
      );

      return {
        storagePath: key,
        storageProvider: 's3',
      };
    } catch (err) {
      console.error('[S3] Upload error:', err);
      throw new Error(`Failed to upload file to S3: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async getDownloadUrl(storagePath: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      // Generate signed URL valid for 1 hour
      const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });
      return url;
    } catch (err) {
      console.error('[S3] Download URL generation error:', err);
      throw new Error(`Failed to generate download URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async delete(storagePath: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storagePath,
        })
      );
    } catch (err) {
      console.error('[S3] Delete error:', err);
      // Don't throw — if file already deleted, that's okay
      // throw new Error(`Failed to delete file from S3: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}
