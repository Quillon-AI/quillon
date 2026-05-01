const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const hljs = require('highlight.js');
const db = require('../db');

const BLOG_DIR = process.env.BLOG_PUBLIC_DIR
  || path.join(__dirname, '..', '..', 'public', 'blog');
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'article.html');

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  gfm: true,
  breaks: false,
});

function markdownToHtml(md) {
  return marked.parse(md || '');
}

function renderArticle(article, template) {
  const schemaOrg = article.schema_org || {};
  const keywords = (article.keywords || []).join(', ');
  const ogImage = article.og_image_url || 'https://quillon.ru/blog/og-default.png';
  const url = `https://quillon.ru/blog/${article.slug}/`;
  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return template
    .replace(/{{TITLE}}/g, escapeHtml(article.title))
    .replace(/{{DESCRIPTION}}/g, escapeHtml(article.description || ''))
    .replace(/{{KEYWORDS}}/g, escapeHtml(keywords))
    .replace(/{{SLUG}}/g, article.slug)
    .replace(/{{URL}}/g, url)
    .replace(/{{OG_IMAGE}}/g, ogImage)
    .replace(/{{PUBLISHED_DATE}}/g, publishedDate)
    .replace(/{{PUBLISHED_ISO}}/g, article.published_at || article.created_at)
    .replace(/{{UPDATED_ISO}}/g, article.updated_at)
    .replace(/{{CONTENT_HTML}}/g, article.content_html)
    .replace(/{{SCHEMA_ORG}}/g, JSON.stringify(schemaOrg, null, 2));
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function publishArticle(articleId) {
  const result = await db.query('SELECT * FROM blog_articles WHERE id = $1', [articleId]);
  const article = result.rows[0];
  if (!article) throw new Error('Article not found');

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  const html = renderArticle(article, template);

  const dir = path.join(BLOG_DIR, article.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');

  return path.join(dir, 'index.html');
}

async function regenerateListing() {
  const result = await db.query(
    `SELECT slug, title, description, og_image_url, published_at, keywords
     FROM blog_articles WHERE status = 'published'
     ORDER BY published_at DESC NULLS LAST`
  );

  const articles = result.rows;
  const listingTemplate = fs.readFileSync(path.join(__dirname, '..', 'templates', 'listing.html'), 'utf-8');

  const cards = articles.map(a => {
    const date = a.published_at
      ? new Date(a.published_at).toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' })
      : '';
    return `<article class="blog-card">
  <a href="/blog/${a.slug}/">
    ${a.og_image_url ? `<img src="${escapeHtml(a.og_image_url)}" alt="${escapeHtml(a.title)}" loading="lazy">` : ''}
    <h2>${escapeHtml(a.title)}</h2>
    <p>${escapeHtml(a.description || '')}</p>
    <time datetime="${a.published_at || ''}">${date}</time>
  </a>
</article>`;
  }).join('\n');

  const html = listingTemplate.replace('{{ARTICLES}}', cards).replace('{{COUNT}}', articles.length);
  if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(BLOG_DIR, 'index.html'), html, 'utf-8');
}

async function republishAll() {
  const result = await db.query("SELECT id FROM blog_articles WHERE status = 'published'");
  for (const row of result.rows) {
    await publishArticle(row.id);
  }
  await regenerateListing();
}

module.exports = { markdownToHtml, renderArticle, publishArticle, regenerateListing, republishAll };
