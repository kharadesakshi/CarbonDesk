/**
 * Environment validation utility
 * Validates required environment variables on startup
 * Warns about insecure or missing settings
 */

export interface EnvConfig {
  // Database
  DATABASE_URL: string;

  // Authentication
  JWT_SECRET: string;

  // Storage
  STORAGE_PROVIDER: 'local' | 's3';
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;

  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;

  // Optional features
  USE_POSTGIS?: boolean;
  LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Validate environment configuration
 * Throws error if required vars missing, warns about insecure settings
 */
export function validateEnv(): EnvConfig {
  const env = process.env;
  const errors: string[] = [];
  const warnings: string[] = [];

  // ============ REQUIRED VARIABLES ============

  // Database
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required (PostgreSQL connection string)');
  } else if (!env.DATABASE_URL.includes('postgres')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // JWT Secret
  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is required for authentication');
  } else if (env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters (current: ' + env.JWT_SECRET.length + ')');
  }

  // Storage Provider
  const storageProvider = env.STORAGE_PROVIDER?.toLowerCase() || 'local';
  if (!['local', 's3'].includes(storageProvider)) {
    errors.push(`STORAGE_PROVIDER must be 'local' or 's3' (current: ${storageProvider})`);
  }

  // S3 Validation
  if (storageProvider === 's3') {
    if (!env.AWS_REGION) errors.push('AWS_REGION is required when STORAGE_PROVIDER=s3');
    if (!env.AWS_S3_BUCKET) errors.push('AWS_S3_BUCKET is required when STORAGE_PROVIDER=s3');
    if (!env.AWS_ACCESS_KEY_ID) errors.push('AWS_ACCESS_KEY_ID is required when STORAGE_PROVIDER=s3');
    if (!env.AWS_SECRET_ACCESS_KEY) errors.push('AWS_SECRET_ACCESS_KEY is required when STORAGE_PROVIDER=s3');
  }

  // Port
  const port = parseInt(env.PORT || '3000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push(`PORT must be a valid port number (1-65535, current: ${env.PORT || 'undefined'})`);
  }

  // Node Environment
  const nodeEnv = env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    errors.push(`NODE_ENV must be 'development', 'production', or 'test' (current: ${nodeEnv})`);
  }

  // CORS Origin
  if (!env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN is required (e.g., http://localhost:5173)');
  }

  // ============ WARNINGS (Non-blocking) ============

  // Development environment warning
  if (nodeEnv === 'production') {
    // Production-specific checks
    if (env.DATABASE_URL?.includes('localhost')) {
      warnings.push('[WARN] DATABASE_URL points to localhost in production');
    }
    if (!env.CORS_ORIGIN || env.CORS_ORIGIN.includes('localhost')) {
      warnings.push('[WARN] CORS_ORIGIN allows localhost in production');
    }
  }

  // JWT Secret strength
  if (env.JWT_SECRET && env.JWT_SECRET.length < 64) {
    warnings.push(`[WARN] JWT_SECRET is only ${env.JWT_SECRET.length} chars (32-64 recommended for production)`);
  }

  // S3 warnings
  if (storageProvider === 's3') {
    if (env.AWS_REGION === 'us-east-1') {
      warnings.push('[WARN] AWS_REGION is us-east-1 (default, verify this is intentional)');
    }
    if (!env.AWS_ACCESS_KEY_ID?.startsWith('AKIA')) {
      warnings.push('[WARN] AWS_ACCESS_KEY_ID looks invalid (should start with AKIA)');
    }
  }

  // Debug logging
  if (env.LOG_LEVEL === 'debug' && nodeEnv === 'production') {
    warnings.push('[WARN] LOG_LEVEL is set to debug in production (may expose sensitive data)');
  }

  // ============ ERROR HANDLING ============

  if (errors.length > 0) {
    console.error('\n❌ Environment Configuration Errors:');
    errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
    console.error('\nPlease check your .env file and restart the server.\n');
    process.exit(1);
  }

  // ============ WARNINGS DISPLAY ============

  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Warnings:');
    warnings.forEach((warn) => console.warn(`  ${warn}`));
    console.warn('');
  }

  // ============ RETURN VALIDATED CONFIG ============

  const config: EnvConfig = {
    // Database
    DATABASE_URL: env.DATABASE_URL!,

    // Authentication
    JWT_SECRET: env.JWT_SECRET!,

    // Storage
    STORAGE_PROVIDER: (storageProvider as 'local' | 's3'),
    AWS_REGION: env.AWS_REGION,
    AWS_S3_BUCKET: env.AWS_S3_BUCKET,
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,

    // Server
    PORT: port,
    NODE_ENV: (nodeEnv as 'development' | 'production' | 'test'),
    CORS_ORIGIN: env.CORS_ORIGIN!,

    // Optional
    USE_POSTGIS: env.USE_POSTGIS === 'true',
    LOG_LEVEL: (env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  };

  // Log configuration (redacting secrets)
  console.log('[Boot] Environment Configuration Loaded:');
  console.log(`  📊 NODE_ENV: ${config.NODE_ENV}`);
  console.log(`  🗄️  Database: ${maskUrl(config.DATABASE_URL)}`);
  console.log(`  📁 Storage Provider: ${config.STORAGE_PROVIDER}`);
  if (config.STORAGE_PROVIDER === 's3') {
    console.log(`     S3 Bucket: ${config.AWS_S3_BUCKET}`);
    console.log(`     AWS Region: ${config.AWS_REGION}`);
  }
  console.log(`  🌐 CORS Origin: ${config.CORS_ORIGIN}`);
  if (config.USE_POSTGIS) {
    console.log(`  🐘 PostGIS: Enabled`);
  }
  console.log('');

  return config;
}

/**
 * Mask database URL for logging (keep host visible, hide password)
 */
function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) {
      u.password = '***';
    }
    return u.toString();
  } catch {
    return url.replace(/:[^:@]+@/, ':***@');
  }
}

/**
 * Mask token for logging (show first 10 and last 5 chars)
 */
function maskToken(token: string): string {
  if (!token || token.length < 15) return '***';
  return `${token.substring(0, 10)}...${token.substring(token.length - 5)}`;
}

/**
 * Get validated config (singleton pattern)
 * Use this throughout the app to access env config
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
  }
  return cachedConfig;
}

/**
 * Check if in production
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === 'production';
}

/**
 * Check if in development
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === 'development';
}

/**
 * Check if using S3 storage
 */
export function isS3Enabled(): boolean {
  return getEnvConfig().STORAGE_PROVIDER === 's3';
}

/**
 * Check if PostGIS is enabled
 */
export function isPostGISEnabled(): boolean {
  return getEnvConfig().USE_POSTGIS === true;
}
