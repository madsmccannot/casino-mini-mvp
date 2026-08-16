const isProduction = process.env.NODE_ENV === 'production';

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const getJwtSecret = (): string => {
  const value = process.env.JWT_SECRET?.trim();
  if (value) {
    if (isProduction && value.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters in production');
    }
    return value;
  }

  if (isProduction) return required('JWT_SECRET');
  return 'local-development-only-secret-change-me';
};

export const getAllowedOrigins = (): string[] => {
  const configured = process.env.CORS_ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured?.length) return configured;
  if (isProduction) return required('CORS_ALLOWED_ORIGINS').split(',').map((origin) => origin.trim());
  return ['http://localhost:3000'];
};

export const getCustodyMode = (): 'disabled' | 'hot_wallet' => {
  const mode = process.env.CUSTODY_MODE?.trim() || 'disabled';
  if (mode !== 'disabled' && mode !== 'hot_wallet') {
    throw new Error('CUSTODY_MODE must be either disabled or hot_wallet');
  }
  return mode;
};

export const assertProductionConfig = (): void => {
  getJwtSecret();
  getAllowedOrigins();
  if (isProduction) {
    required('MONGO_URI');
    required('SOLANA_RPC_URL');
  }
  if (getCustodyMode() === 'hot_wallet') required('CASINO_PRIVATE_KEY');
};
