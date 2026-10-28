// Vercel sets this at build time; local builds fall back to the dev server.
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const SITE_TITLE = "Coverage Keeper: understand your OHP letter";

export const SITE_DESCRIPTION =
  "Take a photo of a letter from the Oregon Health Plan and see what it asks you to do, the due date, and which papers to send. Your photo isn't stored.";
