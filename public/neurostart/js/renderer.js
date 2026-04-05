/* ============================================================
   NEUROSTART — Content Renderer
   Single Responsibility: fetch neurostart.json and bind data
   into DOM via [data-cms] attributes and [data-cms-each] lists.
   ============================================================ */

(function () {
  'use strict';

  const CONTENT_URL = '/content/neurostart.json';

  /** Resolve dot-path "a.b.c" on object, return undefined on miss */
  function pick(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  /** Fill [data-cms="path"] and [data-cms-html="path"] scalar bindings */
  function bindScalars(root, data) {
    root.querySelectorAll('[data-cms]').forEach((el) => {
      const v = pick(data, el.getAttribute('data-cms'));
      if (v != null) el.textContent = v;
    });
    root.querySelectorAll('[data-cms-html]').forEach((el) => {
      const v = pick(data, el.getAttribute('data-cms-html'));
      if (v != null) el.innerHTML = v;
    });
    root.querySelectorAll('[data-cms-attr]').forEach((el) => {
      // Syntax: data-cms-attr="href:meta.link,alt:meta.alt"
      const spec = el.getAttribute('data-cms-attr');
      spec.split(',').forEach((pair) => {
        const [attr, path] = pair.split(':').map((s) => s.trim());
        const v = pick(data, path);
        if (v != null) el.setAttribute(attr, v);
      });
    });
  }

  /** Substitute {{key}} and {{key.sub}} placeholders inside a string */
  function interpolate(tpl, ctx) {
    return tpl.replace(/\{\{([^}]+)\}\}/g, (_, k) => {
      const v = pick(ctx, k.trim());
      return v == null ? '' : v;
    });
  }

  /**
   * Expand [data-cms-each="path"] containers by cloning their <template>
   * child for each item in the array at `path`. Supports {{field}} tokens
   * and nested data-cms bindings inside the template.
   */
  function bindLists(root, data) {
    root.querySelectorAll('[data-cms-each]').forEach((host) => {
      const list = pick(data, host.getAttribute('data-cms-each'));
      if (!Array.isArray(list)) return;
      const tpl = host.querySelector('template');
      if (!tpl) return;
      const html = tpl.innerHTML;
      host.querySelectorAll(':scope > :not(template)').forEach((n) => n.remove());
      const frag = document.createDocumentFragment();
      list.forEach((item, idx) => {
        const ctx = typeof item === 'object' ? { ...item, _index: idx } : { value: item, _index: idx };
        const wrap = document.createElement('div');
        wrap.innerHTML = interpolate(html, ctx);
        while (wrap.firstChild) frag.appendChild(wrap.firstChild);
      });
      host.appendChild(frag);
    });
  }

  /** Apply meta tags (title, description, OG) from data.meta */
  function applyMeta(meta) {
    if (!meta) return;
    if (meta.title) document.title = meta.title;
    const setMeta = (sel, attr, val) => {
      if (val == null) return;
      const el = document.querySelector(sel);
      if (el) el.setAttribute(attr, val);
    };
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('meta[property="og:title"]', 'content', meta.og_title || meta.title);
    setMeta('meta[property="og:description"]', 'content', meta.og_description || meta.description);
    setMeta('meta[name="twitter:title"]', 'content', meta.og_title || meta.title);
    setMeta('meta[name="twitter:description"]', 'content', meta.og_description || meta.description);
  }

  /** Public API — render data into document */
  function render(data) {
    applyMeta(data.meta);
    bindLists(document, data);
    bindScalars(document, data);
    document.dispatchEvent(new CustomEvent('neurostart:rendered', { detail: data }));
  }

  /** Bootstrap */
  fetch(CONTENT_URL, { cache: 'no-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(render)
    .catch((err) => {
      console.error('[neurostart] content load failed:', err);
      document.dispatchEvent(new CustomEvent('neurostart:rendered', { detail: null }));
    });

  // Expose for debugging / tests
  window.NeuroStartRenderer = { render, pick, interpolate };
})();
