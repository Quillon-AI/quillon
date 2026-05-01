const db = require('../db');

function getKeywordDensity(text, keyword) {
  if (!text || !keyword) return 0;
  const words = text.toLowerCase().split(/\s+/).length;
  const regex = new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = (text.match(regex) || []).length;
  return words > 0 ? Math.round((matches / words) * 1000) / 10 : 0;
}

function getSerpPreview(title, description, slug) {
  return {
    title: title?.slice(0, 70) || '',
    description: description?.slice(0, 160) || '',
    url: `https://quillon.ru/blog/${slug}`,
    titleLength: title?.length || 0,
    descriptionLength: description?.length || 0,
    titleOk: title?.length >= 40 && title?.length <= 70,
    descriptionOk: description?.length >= 120 && description?.length <= 160,
  };
}

function calculateScore(article) {
  let score = 0;
  const checks = [];

  // Title: 40-70 chars
  const titleLen = article.title?.length || 0;
  if (titleLen >= 40 && titleLen <= 70) { score += 15; checks.push({ ok: true, msg: 'Title length OK' }); }
  else checks.push({ ok: false, msg: `Title length ${titleLen} (need 40-70)` });

  // Description: 120-160 chars
  const descLen = article.description?.length || 0;
  if (descLen >= 120 && descLen <= 160) { score += 15; checks.push({ ok: true, msg: 'Description length OK' }); }
  else checks.push({ ok: false, msg: `Description length ${descLen} (need 120-160)` });

  // Keywords set
  if (article.keywords?.length >= 3) { score += 10; checks.push({ ok: true, msg: 'Keywords set' }); }
  else checks.push({ ok: false, msg: 'Need ≥3 keywords' });

  // OG image
  if (article.og_image_url) { score += 15; checks.push({ ok: true, msg: 'OG image set' }); }
  else checks.push({ ok: false, msg: 'No OG image' });

  // Content length: 1500+ words
  const wordCount = article.content_md?.split(/\s+/).length || 0;
  if (wordCount >= 1500) { score += 20; checks.push({ ok: true, msg: `Content ${wordCount} words` }); }
  else checks.push({ ok: false, msg: `Content ${wordCount} words (need 1500+)` });

  // H2 headings
  const h2count = (article.content_md?.match(/^##\s/gm) || []).length;
  if (h2count >= 3) { score += 10; checks.push({ ok: true, msg: `${h2count} H2 headings` }); }
  else checks.push({ ok: false, msg: `Only ${h2count} H2 headings (need ≥3)` });

  // Keyword in title
  const kw = article.keywords?.[0]?.toLowerCase() || '';
  if (kw && article.title?.toLowerCase().includes(kw)) {
    score += 15;
    checks.push({ ok: true, msg: 'Primary keyword in title' });
  } else {
    checks.push({ ok: false, msg: 'Primary keyword missing from title' });
  }

  return { score, checks };
}

function generateSchemaOrg(article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `https://quillon.ru/blog/${article.slug}`,
    image: article.og_image_url || 'https://quillon.ru/blog/og-default.png',
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Quillon',
      url: 'https://quillon.ru',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Quillon',
      logo: {
        '@type': 'ImageObject',
        url: 'https://quillon.ru/favicon/apple-touch-icon.png',
      },
    },
    keywords: (article.keywords || []).join(', '),
  };
}

function validateMeta(article) {
  const errors = [];
  if (!article.title) errors.push('title required');
  if (!article.description) errors.push('description required');
  if (!article.slug) errors.push('slug required');
  if (!/^[a-z0-9-]+$/.test(article.slug || '')) errors.push('slug must be lowercase letters, numbers, hyphens');
  return errors;
}

async function checkCannibalization(cluster, excludeId) {
  if (!cluster) return [];
  const query = excludeId
    ? 'SELECT id, slug, title, status FROM blog_articles WHERE cluster = $1 AND id != $2'
    : 'SELECT id, slug, title, status FROM blog_articles WHERE cluster = $1';
  const params = excludeId ? [cluster, excludeId] : [cluster];
  const result = await db.query(query, params);
  return result.rows;
}

async function suggestInternalLinks(content, excludeSlug) {
  const result = await db.query(
    "SELECT slug, title FROM blog_articles WHERE status = 'published' AND slug != $1",
    [excludeSlug || '']
  );
  const published = result.rows;
  const suggestions = [];

  for (const article of published) {
    const words = article.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    for (const word of words) {
      if (content.toLowerCase().includes(word)) {
        suggestions.push({ slug: article.slug, title: article.title, matchedTerm: word });
        break;
      }
    }
  }

  return suggestions.slice(0, 5);
}

module.exports = {
  calculateScore,
  generateSchemaOrg,
  validateMeta,
  getKeywordDensity,
  getSerpPreview,
  checkCannibalization,
  suggestInternalLinks,
};
