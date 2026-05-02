const claude = require('./claude');
const seo = require('./seo');
const topicResearch = require('./topic-research');

const MODEL_OUTLINE = 'opus';   // structure/strategy needs reasoning
const MODEL_ARTICLE = 'sonnet'; // long-form prose — Sonnet is 2× faster, fits VPS 5-min limit

const ARTICLE_SYSTEM_PROMPT = `Ты пишешь для блога Quillon (IT-школа). Аудитория — люди 22-40 без опыта в разработке, уставшие от маркетинговой воды.

ГОЛОС: друг-разработчик, не методист. Честно, с энергией, иногда саркастично. На «ты». Без «уважаемая аудитория».

РИТМ: короткое. Среднее. Длинное когда нужно. Опять короткое. Не два абзаца подряд с одного слова.

СВЯЗКИ 2-3 раза за статью: «короче», «ну», «вот», «если честно», «кстати», «к слову», «по правде», «забегая вперёд».

ЛИЧНЫЙ ОПЫТ ОК: «я месяц убил», «когда начинал», «помню в 2024». Без «легендарный», «гениальный».

КОНКРЕТИКА: реальные компании (Авито, Яндекс, Тинькофф, Сбер, Озон), реальные цифры (hh.ru), реальные тулзы. Не «крупная IT-компания».

H2 ЖИВЫЕ: «Зачем вообще Python», «Где деньги», «Так стоит ли». НЕ «Преимущества X», «Введение в Y».

ЗАПРЕЩЕНО (AI-маркеры):
«в современном мире», «прежде всего», «важно отметить», «таким образом», «следовательно», «благодаря этому», «это позволяет», «погружение в мир», «не секрет», «как известно», тройки с «и», «в этой статье мы рассмотрим», «подводя итог», эмоджи, восклицательные знаки в каждом абзаце, многоточия для драмы.

CTA в конце: «Не уверен, какое направление твоё — Python, QA, Flutter? Пройди тест на профориентацию: quillon.ru/quiz».

Возвращай только Markdown. Без вступлений «Вот ваша статья:».`;

const OUTLINE_SYSTEM_PROMPT = `Ты редактор блога Quillon (IT-школа для людей без опыта).
Твоя задача — спроектировать структуру статьи, которая ХОЧЕТСЯ читать. Без воды, без AI-формул.

Заголовки H2 — живые, разговорные. Не «Преимущества Python», а «Зачем вообще Python».
Не «Что такое Django», а «Django: чем отличается от того что показывают на ютубе».
Не «Заключение», а «Что в итоге» / «Так стоит ли» / конкретный финал.

Хорошая статья закрывает 3-5 реальных вопросов аудитории. Каждый раздел отвечает на один из них.`;

async function generateOutline(topic, researchData) {
  const userPrompt = `Спроектируй структуру статьи для блога Quillon на тему: "${topic}"

Что ищут люди (Яндекс/Google саджесты):
${researchData.suggestions.slice(0, 12).map(s => `— ${s}`).join('\n')}

Вопросы аудитории (PAA):
${researchData.paa.map(p => `— ${p}`).join('\n')}

Верни строго JSON в этом формате:
{
  "title": "SEO-заголовок (40-70 символов, primary keyword в первой трети, без клише)",
  "description": "Мета-описание (120-160 символов, не пересказ заголовка, добавляет ценность)",

  "primary_keyword": "Python",
  "secondary_keywords": ["Python-разработчик", "обучение Python", "Django", "FastAPI", "Python джун"],
  "longtail_queries": ["стоит ли учить python в 2026", "сколько платят python разработчику", "python для начинающих с нуля"],

  "cluster": "короткий идентификатор кластера (1-3 слова, латиница или транслит)",
  "cover_prompt": "Visual concept для обложки на английском. Конкретные предметы и формы для Recraft AI: «Python code flowing as serpentine lines, abstract data structures, server architecture in isometric blueprint». БЕЗ текста, БЕЗ людей. 1-2 предложения.",
  "sections": [
    { "h2": "Живой заголовок раздела", "points": ["конкретный тезис 1", "тезис 2", "тезис 3"] }
  ],
  "faq": [
    { "q": "Реальный вопрос которого нет в текстах статьи", "a": "Краткий честный ответ" }
  ]
}

ПРО KEYWORDS (это критично, не путай группы):

primary_keyword — ОДНО короткое слово (1-2 слова), которое будет употреблено в тексте 30-50 раз (1.5-2.5% density при 2000 слов). Это «Python», «QA», «Flutter», «бэкенд», «нейросеть». НЕ длинная search-фраза.

secondary_keywords — 3-5 LSI/семантически связанных терминов. Каждое будет употреблено 5-15 раз. Это синонимы, варианты, инструменты («Django», «FastAPI», «Python-разработчик», «джун Python»). НЕ длинные фразы.

longtail_queries — 3-5 поисковых фраз вида «стоит ли учить X в 2026», «сколько платят Y разработчику», «X для начинающих». Они прозвучат в H2-заголовках или FAQ-вопросах хотя бы по разу. ЭТО единственные фразы.

ОСТАЛЬНЫЕ ТРЕБОВАНИЯ:
— 6-8 разделов H2
— Первый раздел — НЕ «Введение», а сразу по делу (например «Зачем вообще X», «Где это применяется реально»)
— Последний раздел — НЕ «Заключение», а конкретный финал («Что в итоге», «С чего начать сегодня», «Так стоит ли»)
— 3-5 вопросов в FAQ — те, которых НЕТ в основных разделах. Вопросы из реальных PAA выше — приоритет
— Заголовки H2 не должны быть «Что такое X» / «Преимущества Y» / «Виды Z». Будь живее
— cover_prompt: 1-2 предложения на английском, описывают визуальные предметы и формы (не текст)`;

  const text = await claude.complete(OUTLINE_SYSTEM_PROMPT, userPrompt, { model: MODEL_OUTLINE });
  return claude.parseJSON(text);
}

async function generateArticle(outline) {
  const sectionsPrompt = (outline.sections || [])
    .map((s, i) => {
      const points = Array.isArray(s.points) && s.points.length
        ? `\n   Тезисы: ${s.points.join('; ')}`
        : '';
      return `${i + 1}. ## ${s.h2 || s.title || ''}${points}`;
    })
    .join('\n\n');

  const faqPrompt = (outline.faq || [])
    .map(f => `— Q: ${f.q || ''}\n  A: ${f.a || ''}`)
    .join('\n');

  // Backward compat: support both new schema and old keywords[]
  const primary = outline.primary_keyword || outline.keywords?.[0] || '';
  const secondary = outline.secondary_keywords || (outline.keywords || []).slice(1, 6);
  const longtail = outline.longtail_queries || [];

  const userPrompt = `Напиши статью 1200-1500 слов в Markdown.

Заголовок: ${outline.title}
Описание: ${outline.description}

H2-разделы (точно эти, не переименовывай):
${sectionsPrompt}

FAQ (отдельный раздел ## Частые вопросы перед CTA):
${faqPrompt}

КЛЮЧИ (органично, без насилия):
— PRIMARY «${primary}»: 20-30 раз в разных формах (склонения)
— SECONDARY (по 3-8 раз каждое): ${secondary.map(k => `«${k}»`).join(', ')}
— LONG-TAIL (каждая в H2 или FAQ-вопросе): ${longtail.map(q => `«${q}»`).join(', ')}

Каждый H2 минимум 130 слов. Минимум 3 конкретных факта (цифры, названия компаний). 2-3 разговорные связки. 1-2 раза личный опыт в первом лице.

CTA в конце: тест на профориентацию quillon.ru/quiz.`;

  return claude.complete(ARTICLE_SYSTEM_PROMPT, userPrompt, { model: MODEL_ARTICLE, maxTokens: 16000, timeoutMs: 540000 });
}

async function autoFillSEO(article) {
  if (article.title && article.description && article.keywords?.length >= 3) {
    return article;
  }

  const userPrompt = `На основе этой статьи заполни SEO-поля. Заголовок и описание должны быть живыми,
без клише и AI-маркеров. Описание не пересказывает заголовок — добавляет ценность.

Текст статьи (первые 2000 символов):
${article.content_md.slice(0, 2000)}

Верни JSON:
{
  "title": "SEO-заголовок (40-70 символов, без воды)",
  "description": "Мета-описание (120-160 символов, добавляет ценность)",
  "keywords": ["5 реальных ключевых слов"]
}`;

  const text = await claude.complete(OUTLINE_SYSTEM_PROMPT, userPrompt, { model: MODEL_OUTLINE });
  const filled = claude.parseJSON(text);
  return { ...article, ...filled };
}

module.exports = { generateOutline, generateArticle, autoFillSEO };
