const express = require('express');
const router = express.Router();
const db = require('../db');
const seo = require('../services/seo');
const s3 = require('../services/s3');
const staticRenderer = require('../services/static-renderer');
const rss = require('../services/rss');
const indexnow = require('../services/indexnow');
const ogImage = require('../services/og-image');
const s3service = require('../services/s3');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// List articles
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const where = status ? 'WHERE status = $1' : '';
    const params = status ? [status, limit, offset] : [limit, offset];
    const limitParam = status ? '$2' : '$1';
    const offsetParam = status ? '$3' : '$2';

    const result = await db.query(
      `SELECT id, slug, title, description, status, seo_score, published_at, created_at, updated_at, cluster, topic
       FROM blog_articles ${where} ORDER BY updated_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );
    const countResult = await db.query(
      `SELECT COUNT(*) FROM blog_articles ${where}`,
      status ? [status] : []
    );
    res.json({ articles: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single article
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blog_articles WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create article (manual, blank)
router.post('/', async (req, res) => {
  try {
    const { slug, title, description, keywords, content_md, topic, cluster } = req.body;
    const errors = seo.validateMeta({ slug, title, description });
    if (errors.length) return res.status(400).json({ errors });

    const existing = await db.query('SELECT id FROM blog_articles WHERE slug = $1', [slug]);
    if (existing.rows.length) return res.status(409).json({ error: 'Slug already exists' });

    const content_html = staticRenderer.markdownToHtml(content_md || '');
    const schemaOrg = seo.generateSchemaOrg({ slug, title, description, keywords });
    const { score } = seo.calculateScore({ title, description, keywords, content_md });

    const result = await db.query(
      `INSERT INTO blog_articles (slug, title, description, keywords, content_md, content_html, schema_org, seo_score, topic, cluster)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [slug, title, description || null, keywords || [], content_md || '', content_html, schemaOrg, score, topic || null, cluster || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update article (save revision)
router.patch('/:id', async (req, res) => {
  try {
    const current = await db.query('SELECT * FROM blog_articles WHERE id = $1', [req.params.id]);
    if (!current.rows[0]) return res.status(404).json({ error: 'Not found' });
    const prev = current.rows[0];

    const updates = req.body;
    if (updates.content_md !== undefined) {
      updates.content_html = staticRenderer.markdownToHtml(updates.content_md);
    }

    const fields = Object.keys(updates).filter(k => !['id','created_at','updated_at'].includes(k));
    if (!fields.length) return res.json(prev);

    // Save revision before updating
    await db.query(
      'INSERT INTO article_revisions (article_id, content_md, title, description, saved_by) VALUES ($1,$2,$3,$4,$5)',
      [prev.id, prev.content_md, prev.title, prev.description, req.user?.username || 'admin']
    );

    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = [prev.id, ...fields.map(f => updates[f])];

    // Recalculate SEO score
    const merged = { ...prev, ...updates };
    const { score } = seo.calculateScore(merged);
    const schemaOrg = seo.generateSchemaOrg(merged);

    await db.query(`UPDATE blog_articles SET ${setClauses}, seo_score = $${values.length + 1}, schema_org = $${values.length + 2} WHERE id = $1`, [
      ...values, score, schemaOrg
    ]);

    const updated = await db.query('SELECT * FROM blog_articles WHERE id = $1', [prev.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete article (draft/review only)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT status FROM blog_articles WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (result.rows[0].status === 'published') {
      return res.status(400).json({ error: 'Archive the article before deleting' });
    }
    await db.query('DELETE FROM blog_articles WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish article
router.post('/:id/publish', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blog_articles WHERE id = $1', [req.params.id]);
    const article = result.rows[0];
    if (!article) return res.status(404).json({ error: 'Not found' });

    const errors = seo.validateMeta(article);
    if (errors.length) return res.status(400).json({ errors });

    // Auto-generate OG image if needed
    if (article.og_image_auto || !article.og_image_url) {
      try {
        const imgBuffer = ogImage.generateOGImage(article.title, article.description);
        const url = await s3service.uploadOGImage(imgBuffer, article.slug);
        await db.query('UPDATE blog_articles SET og_image_url = $1 WHERE id = $2', [url, article.id]);
        article.og_image_url = url;
      } catch (e) {
        console.warn('OG image generation failed:', e.message);
      }
    }

    await db.query(
      "UPDATE blog_articles SET status = 'published', published_at = COALESCE(published_at, NOW()) WHERE id = $1",
      [article.id]
    );

    // Render static HTML
    await staticRenderer.publishArticle(article.id);
    await staticRenderer.regenerateListing();
    await rss.updateRSSFile(db);

    // Ping search engines
    const url = `https://quillon.ru/blog/${article.slug}/`;
    indexnow.ping([url, 'https://quillon.ru/blog/']).catch(() => {});

    const updated = await db.query('SELECT * FROM blog_articles WHERE id = $1', [article.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive article
router.post('/:id/archive', async (req, res) => {
  try {
    await db.query("UPDATE blog_articles SET status = 'archived' WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get revisions
router.get('/:id/revisions', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, saved_by, saved_at FROM article_revisions WHERE article_id = $1 ORDER BY saved_at DESC LIMIT 20',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore revision
router.post('/:id/revisions/:revId/restore', async (req, res) => {
  try {
    const rev = await db.query('SELECT * FROM article_revisions WHERE id = $1 AND article_id = $2', [req.params.revId, req.params.id]);
    if (!rev.rows[0]) return res.status(404).json({ error: 'Revision not found' });
    const r = rev.rows[0];
    const content_html = staticRenderer.markdownToHtml(r.content_md);
    await db.query(
      'UPDATE blog_articles SET content_md = $1, content_html = $2, title = $3, description = $4 WHERE id = $5',
      [r.content_md, content_html, r.title, r.description, req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload inline image → S3
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const url = await s3.uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEO analysis for article
router.get('/:id/seo', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blog_articles WHERE id = $1', [req.params.id]);
    const article = result.rows[0];
    if (!article) return res.status(404).json({ error: 'Not found' });

    const { score, checks } = seo.calculateScore(article);
    const preview = seo.getSerpPreview(article.title, article.description, article.slug);
    const density = seo.getKeywordDensity(article.content_md, article.keywords?.[0]);
    const cannibalization = await seo.checkCannibalization(article.cluster, article.id);
    const internalLinks = await seo.suggestInternalLinks(article.content_md, article.slug);

    res.json({ score, checks, preview, density, cannibalization, internalLinks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
