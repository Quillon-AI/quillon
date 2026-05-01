const express = require('express');
const router = express.Router();
const db = require('../db');
const topicResearch = require('../services/topic-research');
const blogGenerator = require('../services/blog-generator');
const staticRenderer = require('../services/static-renderer');
const seo = require('../services/seo');

// Step 1: Research topic → suggestions + PAA
router.post('/research', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic required' });

    const research = await topicResearch.researchTopic(topic);

    // Check for cannibalization by cluster
    const clusterCheck = await seo.checkCannibalization(topic.toLowerCase().slice(0, 50));
    if (clusterCheck.length) {
      research.cannibalization_warning = clusterCheck;
    }

    res.json(research);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Generate outline from research data
router.post('/outline', async (req, res) => {
  try {
    const { topic, research } = req.body;
    if (!topic || !research) return res.status(400).json({ error: 'topic and research required' });

    const outline = await blogGenerator.generateOutline(topic, research);
    res.json(outline);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 3: Generate full article from outline (saves to DB as draft)
router.post('/article', async (req, res) => {
  try {
    const { outline, topic } = req.body;
    if (!outline) return res.status(400).json({ error: 'outline required' });

    // Check cannibalization before generating
    const existing = await seo.checkCannibalization(outline.cluster);
    if (existing.length) {
      return res.status(409).json({
        error: 'Cannibalization detected',
        existing,
        message: 'An article for this cluster already exists. Edit it instead of creating a duplicate.',
      });
    }

    const content_md = await blogGenerator.generateArticle(outline);
    const content_html = staticRenderer.markdownToHtml(content_md);
    const schemaOrg = seo.generateSchemaOrg({ ...outline, content_md });
    const { score } = seo.calculateScore({ ...outline, content_md });

    // Slug from title: transliterate + lowercase + hyphens
    const slug = translitSlug(outline.title);

    const result = await db.query(
      `INSERT INTO blog_articles
         (slug, title, description, keywords, content_md, content_html, schema_org, seo_score, topic, cluster, outline_json, generation_params)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        slug,
        outline.title,
        outline.description,
        outline.keywords || [],
        content_md,
        content_html,
        schemaOrg,
        score,
        topic || outline.title,
        outline.cluster || null,
        JSON.stringify(outline),
        JSON.stringify({ generated_at: new Date().toISOString() }),
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Slug already exists', detail: err.detail });
    }
    res.status(500).json({ error: err.message });
  }
});

// Regenerate article for existing draft (re-runs Claude on existing outline)
router.post('/:id/regenerate', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blog_articles WHERE id = $1', [req.params.id]);
    const article = result.rows[0];
    if (!article) return res.status(404).json({ error: 'Not found' });
    if (article.status === 'published') return res.status(400).json({ error: 'Cannot regenerate published article' });

    const outline = article.outline_json || { title: article.title, keywords: article.keywords, sections: [], faq: [] };
    const content_md = await blogGenerator.generateArticle(outline);
    const content_html = staticRenderer.markdownToHtml(content_md);
    const { score } = seo.calculateScore({ ...article, content_md });

    await db.query(
      'UPDATE blog_articles SET content_md = $1, content_html = $2, seo_score = $3 WHERE id = $4',
      [content_md, content_html, score, article.id]
    );

    const updated = await db.query('SELECT * FROM blog_articles WHERE id = $1', [article.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-fill SEO fields for existing article
router.post('/:id/autoseo', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM blog_articles WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });

    const filled = await blogGenerator.autoFillSEO(result.rows[0]);
    const { score } = seo.calculateScore(filled);
    const schemaOrg = seo.generateSchemaOrg(filled);

    await db.query(
      'UPDATE blog_articles SET title = $1, description = $2, keywords = $3, seo_score = $4, schema_org = $5 WHERE id = $6',
      [filled.title, filled.description, filled.keywords, score, schemaOrg, result.rows[0].id]
    );

    const updated = await db.query('SELECT * FROM blog_articles WHERE id = $1', [result.rows[0].id]);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function translitSlug(title) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch',
    'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  };
  return title.toLowerCase()
    .split('')
    .map(c => map[c] !== undefined ? map[c] : c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

module.exports = router;
