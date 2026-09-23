export function siteConfig(env = process.env) {
  const onPages = env.CF_PAGES === '1';
  const preview = onPages && env.CF_PAGES_BRANCH !== (env.PRODUCTION_BRANCH || 'main');
  if (onPages && !preview && !env.SITE_URL) {
    throw new Error('Set SITE_URL to the production HTTPS URL in Cloudflare Pages environment variables.');
  }
  const url = new URL(env.SITE_URL || (onPages && env.CF_PAGES_URL) || 'http://localhost:4173');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.');
  }
  if (onPages && !preview && url.protocol !== 'https:') throw new Error('Production SITE_URL must use HTTPS.');
  return { origin: url.origin, indexable: Boolean(env.SITE_URL) && !preview };
}
