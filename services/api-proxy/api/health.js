import { sendCorsPreflight, sendJson } from '../lib/catalog.js';

export const config = {
  maxDuration: 10,
};

/**
 * GET /api/health
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendCorsPreflight(req, res);
    return;
  }

  if (req.method !== 'GET') {
    sendJson(req, res, { error: 'Method not allowed' }, 405);
    return;
  }

  sendJson(req, res, { ok: true, service: 'h5-kb-api-proxy' });
}
