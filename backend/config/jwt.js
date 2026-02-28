// Centralized JWT configuration — single source of truth for secret and expiry.
// Both the User model and auth middleware import from here to avoid duplication.

if (!process.env.JWT_SECRET) {
   console.warn(
      '[JWT Config] WARNING: JWT_SECRET is not set. Using insecure default. Set JWT_SECRET in your .env file for production.'
   );
}

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
