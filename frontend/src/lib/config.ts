// Single source of truth for backend base URL. Works in both server and
// client components — `NEXT_PUBLIC_` so it's inlined at build time.
export const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
