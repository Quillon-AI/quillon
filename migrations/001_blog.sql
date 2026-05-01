-- Blog articles
CREATE TABLE IF NOT EXISTS blog_articles (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  keywords      TEXT[],
  content_md    TEXT NOT NULL DEFAULT '',
  content_html  TEXT NOT NULL DEFAULT '',

  -- SEO
  og_image_url  TEXT,
  og_image_auto BOOLEAN NOT NULL DEFAULT TRUE,
  schema_org    JSONB,
  seo_score     SMALLINT,

  -- AI pipeline state
  topic         TEXT,
  cluster       TEXT,
  outline_json  JSONB,
  generation_params JSONB,

  -- Moderation
  status        TEXT NOT NULL DEFAULT 'draft',
  -- draft | review | published | archived

  -- Metadata
  author        TEXT NOT NULL DEFAULT 'quillon',
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revision history (triggered on every PATCH)
CREATE TABLE IF NOT EXISTS article_revisions (
  id          SERIAL PRIMARY KEY,
  article_id  INTEGER NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
  content_md  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  saved_by    TEXT NOT NULL DEFAULT 'admin',
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_articles_updated_at ON blog_articles;
CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS blog_articles_status_idx ON blog_articles(status);
CREATE INDEX IF NOT EXISTS blog_articles_published_at_idx ON blog_articles(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS blog_articles_cluster_idx ON blog_articles(cluster);
CREATE INDEX IF NOT EXISTS article_revisions_article_id_idx ON article_revisions(article_id, saved_at DESC);
