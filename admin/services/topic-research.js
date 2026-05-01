const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 QuillonBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function getYandexSuggestions(query) {
  try {
    const url = `https://suggest-maps.yandex.ru/suggest-geo?part=${encodeURIComponent(query)}&lang=ru_RU&v=9`;
    const data = await fetchJSON(url);
    return Array.isArray(data) ? data.flat().filter(s => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

async function getGoogleSuggestions(query) {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ru&q=${encodeURIComponent(query)}`;
    const data = await fetchJSON(url);
    return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

async function getPeopleAlsoAsk(query) {
  // PAA via DuckDuckGo Instant Answer API (no auth required, RU-friendly)
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const data = await fetchJSON(url);
    if (!data) return [];
    const topics = (data.RelatedTopics || [])
      .filter(t => t.Text)
      .map(t => t.Text)
      .slice(0, 5);
    return topics;
  } catch {
    return [];
  }
}

async function researchTopic(topic) {
  const [yandex, google, paa] = await Promise.all([
    getYandexSuggestions(topic),
    getGoogleSuggestions(topic),
    getPeopleAlsoAsk(topic),
  ]);

  const allSuggestions = [...new Set([...yandex, ...google])].slice(0, 20);

  return {
    topic,
    suggestions: allSuggestions,
    paa,
    researched_at: new Date().toISOString(),
  };
}

module.exports = { researchTopic, getYandexSuggestions, getGoogleSuggestions, getPeopleAlsoAsk };
