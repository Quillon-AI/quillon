const https = require('https');
const path = require('path');
const crypto = require('crypto');

const API_URL = 'https://external.api.recraft.ai/v1/images/generations';
const API_KEY = process.env.RECRAFT_API_KEY;

/**
 * Style suffix that nudges Recraft toward Quillon visual identity.
 * Abstract geometric / blueprint aesthetic. Explicitly NO text/letters
 * because Recraft has a strong bias to render fake "magazine cover" text.
 */
const STYLE_SUFFIX = ', abstract geometric composition, isometric blueprint aesthetic, dark navy near-black #0A0F18 background, single mint green #5EF2A1 accent, hairline grid overlay, technical schematic style, Linear/Vercel/Stripe minimalist editorial vibe, NO TEXT, NO LETTERS, NO WORDS, NO LOGOS, no faces, no people, no watermarks, no UI mockups';

const DEFAULT_STYLE = 'digital_illustration';
const DEFAULT_SUBSTYLE = '2d_art_poster_2';
const DEFAULT_SIZE = '1820x1024'; // ~1.78:1, closest to OG image 1.9:1

function postJSON(url, body, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname,
      method: 'POST',
      timeout: timeoutMs,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let chunks = '';
      res.on('data', c => { chunks += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(chunks);
          if (res.statusCode >= 400) {
            return reject(new Error(`Recraft ${res.statusCode}: ${parsed.error?.message || JSON.stringify(parsed).slice(0, 200)}`));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Recraft invalid JSON: ${chunks.slice(0, 200)}`));
        }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('Recraft request timeout')); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadImage(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Image download failed: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Call Recraft API. Returns the temporary image URL hosted by Recraft.
 * Use generateAndUpload() if you want a permanent URL on Selectel S3.
 */
async function generate(prompt, options = {}) {
  if (!API_KEY) throw new Error('RECRAFT_API_KEY not set in admin/.env');
  if (!prompt) throw new Error('prompt required');

  const fullPrompt = options.skipStyleSuffix
    ? prompt
    : (prompt + STYLE_SUFFIX);

  const body = {
    prompt: fullPrompt,
    n: 1,
    style: options.style || DEFAULT_STYLE,
    size: options.size || DEFAULT_SIZE,
    model: options.model || 'recraftv3',
  };
  // substyle: undefined → default; null/'' → omit (let style decide)
  const sub = options.substyle === undefined ? DEFAULT_SUBSTYLE : options.substyle;
  if (sub) body.substyle = sub;

  const result = await postJSON(API_URL, body);
  if (!result.data?.[0]?.url) {
    throw new Error('Recraft returned no image URL');
  }
  return {
    url: result.data[0].url,
    prompt: fullPrompt,
    revised_prompt: result.data[0].revised_prompt,
  };
}

/**
 * Generate cover via Recraft, download the image, push to Selectel S3
 * under blog/covers/<slug>.png. Returns the permanent S3 URL.
 */
async function generateAndUpload(prompt, slug, options = {}) {
  const s3Service = require('./s3');
  const recraft = await generate(prompt, options);

  const buffer = await downloadImage(recraft.url);
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

  const client = new S3Client({
    region: process.env.S3_REGION || 'ru-3',
    endpoint: process.env.S3_ENDPOINT || 'https://s3.ru-3.storage.selcloud.ru',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
    },
  });

  const bucket = process.env.S3_BUCKET || 'quillon';
  const keyPrefix = (process.env.S3_KEY_PREFIX || 'blog').replace(/^\/+|\/+$/g, '');
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 8);
  const key = `${keyPrefix}/covers/${slug}-${hash}.png`;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read',
    CacheControl: 'public, max-age=2592000',
  }));

  const publicBase = (process.env.S3_PUBLIC_BASE
    || `${process.env.S3_ENDPOINT}/${bucket}`).replace(/\/+$/, '');
  const url = `${publicBase}/${key}`;

  return {
    url,
    prompt: recraft.prompt,
    revised_prompt: recraft.revised_prompt,
    bytes: buffer.length,
  };
}

module.exports = { generate, generateAndUpload, downloadImage };
