import { StorageProvider } from './StorageService';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  const providerName = process.env.STORAGE_PROVIDER || 'local';

  switch (providerName) {
    case 's3':
      _provider = new S3StorageProvider();
      break;
    case 'local':
    default:
      _provider = new LocalStorageProvider();
      break;
  }

  console.log(`[Storage] Using provider: ${providerName}`);
  return _provider;
}

export { LocalStorageProvider, S3StorageProvider };
export type { StorageProvider, UploadResult } from './StorageService';
