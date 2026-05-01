const https = require('https');

const ENDPOINT = process.env.CLAUDE_PIPELINE_URL || 'https://video.quillon.ru';
const SECRET = process.env.CLAUDE_PIPELINE_SECRET || process.env.VIDEO_PIPELINE_SECRET;
const DEFAULT_MODEL = 'sonnet';

function postJSON(path, body, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, ENDPOINT);
    const data = JSON.stringify(body);

    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${SECRET}`,
      },
    }, (res) => {
      let chunks = '';
      res.on('data', c => { chunks += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(chunks);
          if (res.statusCode >= 400) {
            return reject(new Error(`${parsed.error || 'pipeline_error'}: ${parsed.message || res.statusCode}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Invalid JSON from pipeline: ${chunks.slice(0, 200)}`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(new Error('Pipeline request timeout')); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function complete(systemPrompt, userPrompt, options = {}) {
  if (!SECRET) {
    throw new Error('CLAUDE_PIPELINE_SECRET not set in admin/.env');
  }

  const result = await postJSON('/sonnet', {
    user: userPrompt,
    system: systemPrompt,
    model: options.model || DEFAULT_MODEL,
  });

  if (typeof result.cost_usd === 'number') {
    console.log(`[claude] cost=$${result.cost_usd.toFixed(4)} model=${result.model}`);
  }
  return result.content;
}

function parseJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error('No JSON found in Claude response');
  return JSON.parse(match[1] || match[0]);
}

module.exports = { complete, parseJSON };
