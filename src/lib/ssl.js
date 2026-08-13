import https from 'https';

/**
 * SSL configuration for corporate networks.
 *
 * Corporate proxies often intercept HTTPS with their own CA.
 * This module provides a reusable https.Agent that accepts any certificate,
 * plus a global env flag so Node.js fetch/undici also skip verification.
 *
 * Usage:
 *   import { httpsAgent, enableCorporateSsl } from '@/lib/ssl';
 *   enableCorporateSsl(); // call once at module load
 *   fetch(url, { agent: httpsAgent });
 */

// Disable TLS verification globally for this process.
// This covers Node.js native fetch, undici, and the https.Agent below.
// SAFE only in a controlled intranet environment — never expose to the public internet.
export function enableCorporateSsl() {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

/**
 * Reusable https.Agent that does not verify certificates.
 * Pass as `agent` option in fetch() calls to handle corporate CA bundles.
 */
export const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Enable on import so every route benefits automatically.
enableCorporateSsl();
