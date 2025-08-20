import { z } from 'zod';

/**
 * Centralized environment variable validation using Zod
 * Validates all required environment variables on startup
 */

const envSchema = z.object({
  // Required database connection
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Auth configuration
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),
  
  // Storage configuration
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required'),
  
  // Redis configuration (optional for caching)
  REDIS_URL: z.string().url().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  
  // AWS S3 configuration (optional, fallback to Vercel Blob)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // ElevenLabs AI configuration
  ELEVENLABS_API_KEY: z.string().min(1, 'ELEVENLABS_API_KEY is required'),
  
  // Email configuration (optional)
  RESEND_API_KEY: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Next.js configuration
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
});

type Environment = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Environment {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      throw new Error(
        `Environment validation failed:\n${missingVars}\n\n` +
        'Please check your .env file and ensure all required variables are set.'
      );
    }
    throw error;
  }
}

// Export validated environment
export const env = validateEnv();

// Export individual configurations for convenience
export const dbConfig = {
  url: env.DATABASE_URL,
} as const;

export const authConfig = {
  secret: env.BETTER_AUTH_SECRET,
  url: env.BETTER_AUTH_URL,
} as const;

export const storageConfig = {
  token: env.BLOB_READ_WRITE_TOKEN,
  // S3 fallback configuration
  s3: env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    region: env.AWS_REGION!,
    bucket: env.AWS_S3_BUCKET!,
  } : null,
} as const;

export const redisConfig = {
  url: env.REDIS_URL,
  restApi: env.KV_REST_API_URL ? {
    url: env.KV_REST_API_URL,
    token: env.KV_REST_API_TOKEN!,
  } : null,
} as const;

export const aiConfig = {
  elevenlabs: {
    apiKey: env.ELEVENLABS_API_KEY,
  },
} as const;

export const emailConfig = {
  resendApiKey: env.RESEND_API_KEY,
} as const;

export const appConfig = {
  env: env.NODE_ENV,
  url: env.NEXT_PUBLIC_APP_URL,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

// Type exports
export type { Environment };