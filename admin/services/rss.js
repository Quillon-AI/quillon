const fs = require('fs');
const path = require('path');

const BLOG_DIR = process.env.BLOG_PUBLIC_DIR
  || path.join(__dirname, '..', '..', 'public', 'blog');
const RSS_PATH = path.join(BLOG_DIR, 'rss.xml');
const SITE = 'https://quillon.ru';

function escapeXML(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRSS(articles) {
  const items = articles.map(a => `
  <item>
    <title>${escapeXML(a.title)}</title>
    <link>${SITE}/blog/${a.slug}/</link>
    <guid isPermaLink="true">${SITE}/blog/${a.slug}/</guid>
    <description>${escapeXML(a.description)}</description>
    <pubDate>${new Date(a.published_at || a.created_at).toUTCString()}</pubDate>
    ${a.og_image_url ? `<enclosure url="${escapeXML(a.og_image_url)}" type="image/png" length="0"/>` : ''}
  </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Блог Quillon — обучение Python, ML, Flutter, QA</title>
    <link>${SITE}/blog/</link>
    <description>Статьи об IT-образовании, карьере в разработке и машинном обучении</description>
    <language>ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}

async function updateRSSFile(db) {
  const result = await db.query(
    `SELECT slug, title, description, og_image_url, published_at, created_at
     FROM blog_articles WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST LIMIT 50`
  );

  const rss = generateRSS(result.rows);
  const dir = path.dirname(RSS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(RSS_PATH, rss, 'utf-8');
}

module.exports = { generateRSS, updateRSSFile };
