const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const crypto = require('crypto');

const ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.ru-3.storage.selcloud.ru';
const REGION = process.env.S3_REGION || 'ru-3';
const BUCKET = process.env.S3_BUCKET || 'quillon';
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE || `${ENDPOINT}/${BUCKET}`).replace(/\/+$/, '');
const KEY_PREFIX = (process.env.S3_KEY_PREFIX || 'blog').replace(/^\/+|\/+$/g, '');

const client = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

function publicUrl(key) {
  return `${PUBLIC_BASE}/${key}`;
}

async function uploadImage(buffer, originalName, mimeType) {
  const ext = path.extname(originalName) || '.jpg';
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const key = `${KEY_PREFIX}/images/${hash}${ext}`;

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType || 'image/jpeg',
    ACL: 'public-read',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return publicUrl(key);
}

async function uploadOGImage(buffer, slug) {
  const key = `${KEY_PREFIX}/og/${slug}.png`;

  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: 'image/png',
    ACL: 'public-read',
    CacheControl: 'public, max-age=604800',
  }));

  return publicUrl(key);
}

async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

module.exports = { uploadImage, uploadOGImage, getPresignedUrl };
