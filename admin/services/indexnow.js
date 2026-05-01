const https = require('https');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '';
const SITE = 'https://quillon.ru';

function post(hostname, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      resolve({ hostname, status: res.statusCode });
    });
    req.on('error', (err) => resolve({ hostname, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function ping(urls) {
  if (!INDEXNOW_KEY) {
    console.warn('IndexNow: INDEXNOW_KEY not set, skipping ping');
    return [];
  }

  const body = {
    host: 'quillon.ru',
    key: INDEXNOW_KEY,
    keyLocation: `${SITE}/indexnow.txt`,
    urlList: Array.isArray(urls) ? urls : [urls],
  };

  const results = await Promise.all([
    post('yandex.com', body),
    post('api.indexnow.org', body),
  ]);

  console.log('IndexNow ping:', results);
  return results;
}

module.exports = { ping };
