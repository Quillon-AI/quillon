"""
Quillon — Telegram Ad Parser
Парсит рекламные посевы конкурентов (SkyPro, Eduson, etc.) в IT/карьера каналах.
Находит повторяющиеся креативы (= работающие, раз масштабируют).

Использование:
  python3 tg_parser.py --api-id YOUR_ID --api-hash YOUR_HASH

Требования:
  pip3 install telethon pandas
"""

import asyncio
import argparse
import json
import re
import csv
from datetime import datetime, timedelta
from collections import Counter
from telethon import TelegramClient
from telethon.tl.types import (
    MessageEntityTextUrl,
    MessageEntityUrl,
    MessageEntityMention,
)

# ─── Конкуренты для отслеживания ───────────────────────────────────
COMPETITORS = {
    # Бренды, чьи посевы ищем (в тексте или ссылках)
    "keywords": [
        # Бренды
        "skypro", "sky pro", "скайпро",
        "eduson", "эдюсон", "эдусон",
        "skillfactory", "скилфактори", "скилфэктори",
        "hexlet", "хекслет",
        "kata academy", "ката академия",
        "elbrus", "эльбрус",
        "productstar", "продакт стар",
        "нетология", "netology",
        "skillbox", "скилбокс", "скиллбокс",
        "яндекс практикум", "practicum",
        "geekbrains", "гикбрейнс",
        # ООО (маркировка 38-ФЗ)
        "скайпро", "скилфэктори",
        "ооо «нетология»", "нетология-групп",
        "ооо «скайпро»", "ооо «эдюсон»",
        "ооо «скилбокс»", "ооо «яндекс»",
        "7736646540",  # ИНН SkyPro
        "9702009530",  # ИНН Skillfactory
        # Общие EdTech-маркеры
        "пройди тест", "тест на профориентацию", "тест на профессию",
        "бесплатный интенсив", "бесплатный вебинар",
        "смени профессию", "новая профессия",
        "войти в it", "войти в ит",
        "it профессия", "it-профессия",
        "курсы python", "курсы программирования",
        "обучение it", "обучение ит",
        "erid",  # Маркировка рекламы — значит это посев
    ],
    # Домены конкурентов (в ссылках)
    "domains": [
        "skypro.ru", "sky.pro",
        "eduson.academy", "eduson.tv",
        "skillfactory.ru",
        "hexlet.io",
        "kata.academy",
        "elbrusboot.camp",
        "productstar.ru",
        "netology.ru",
        # Общие квиз/лендинг домены
        "quiz.", "test.", "prof-test.",
    ],
}

# ─── IT/карьера каналы для парсинга ────────────────────────────────
# Каналы, где EdTech-компании покупают посевы
TARGET_CHANNELS = [
    # IT/разработка (проверенные, работают)
    "tproger",
    "proglib",
    "habr_com",
    "pythonl",
    "python_academy",
    "python_job_interview",
    "python_pro",
    "python_job",
    "nuancesprog",
    "devby",
    "codecamp",
    "javarush",
    "machinelearning_ru",
    "ai_machinelearning",
    "neurohive",
    "datascienceiot",
    "ds_notes",
    "left_join",
    "product_analytics",
    # Frontend/Mobile
    "frontend_info",
    "mobile_jobs",
    "flutterdeveloper",
    # QA
    "qa_chillout",
    "qa_guru",
    # Карьера/вакансии
    "careerspace",
    "habr_career",
    "career_ru",
    "getmatch_ru",
    "itrecruiter",
    # Бизнес/финансы/саморазвитие (ЦА 25-35 офис)
    "bitkogan",
    "thebell_io",
    "startupoftheday",
    "rusven",
    "lemonfortea",
    "div_invest",
    "oskarhartmann",
    "productive_person",
    "mozgoprav",
    # Новости/общество (широкий охват)
    "breakingmash",
    "varlamov_news",
    "banksta",
    "maboratory",
    "obrazovach",
    # EdTech каналы (контент конкурентов)
    "edtechmedia",
    "netology_official",
    "skillfactoryoff",
    "hexaborelabs",
]

# ─── Настройки ─────────────────────────────────────────────────────
DAYS_BACK = 90  # Парсим за последние N дней
POSTS_PER_CHANNEL = 500  # Максимум постов на канал
MIN_VIEWS = 1000  # Минимум просмотров (фильтр мусора)


def is_ad_post(text, entities):
    """Определяет, является ли пост рекламным посевом."""
    if not text:
        return False, []

    text_lower = text.lower()
    matched_keywords = []

    # Проверка ключевых слов
    for kw in COMPETITORS["keywords"]:
        if kw in text_lower:
            matched_keywords.append(kw)

    # Проверка ссылок в entities
    if entities:
        for entity in entities:
            url = None
            if isinstance(entity, MessageEntityTextUrl):
                url = entity.url
            elif isinstance(entity, MessageEntityUrl):
                start = entity.offset
                end = start + entity.length
                url = text[start:end]

            if url:
                url_lower = url.lower()
                for domain in COMPETITORS["domains"]:
                    if domain in url_lower:
                        matched_keywords.append(f"link:{domain}")

    # Маркировка рекламы — сильный сигнал
    if "реклама" in text_lower or "erid" in text_lower:
        matched_keywords.append("маркировка_рекламы")

    return len(matched_keywords) > 0, matched_keywords


def extract_links(text, entities):
    """Извлекает все ссылки из поста."""
    links = []
    if entities:
        for entity in entities:
            if isinstance(entity, MessageEntityTextUrl):
                links.append(entity.url)
            elif isinstance(entity, MessageEntityUrl):
                start = entity.offset
                end = start + entity.length
                links.append(text[start:end])
    # Также regex для ссылок в тексте
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    links.extend(re.findall(url_pattern, text or ""))
    return list(set(links))


def calculate_engagement(views, forwards, reactions_count):
    """Рассчитывает engagement rate."""
    if not views or views == 0:
        return 0
    total_engagement = (forwards or 0) + (reactions_count or 0)
    return round(total_engagement / views * 100, 3)


async def parse_channel(client, channel_username, cutoff_date):
    """Парсит один канал на предмет рекламных постов."""
    ads = []
    try:
        entity = await client.get_entity(channel_username)
        channel_title = getattr(entity, "title", channel_username)

        count = 0
        async for message in client.iter_messages(
            entity, limit=POSTS_PER_CHANNEL, offset_date=None
        ):
            # Фильтр по дате
            if message.date.replace(tzinfo=None) < cutoff_date:
                break

            count += 1
            text = message.text or message.message or ""

            # Проверяем — реклама?
            is_ad, keywords = is_ad_post(text, message.entities)
            if not is_ad:
                continue

            # Фильтр по просмотрам
            views = getattr(message, "views", 0) or 0
            if views < MIN_VIEWS:
                continue

            # Реакции
            reactions_count = 0
            if hasattr(message, "reactions") and message.reactions:
                for r in message.reactions.results:
                    reactions_count += r.count

            forwards = getattr(message, "forwards", 0) or 0
            er = calculate_engagement(views, forwards, reactions_count)
            links = extract_links(text, message.entities)

            ads.append({
                "channel": channel_username,
                "channel_title": channel_title,
                "date": message.date.strftime("%Y-%m-%d %H:%M"),
                "text": text[:500],  # Обрезаем длинные
                "full_text": text,
                "views": views,
                "forwards": forwards,
                "reactions": reactions_count,
                "er": er,
                "links": links,
                "keywords": keywords,
                "post_url": f"https://t.me/{channel_username}/{message.id}",
            })

        print(f"  ✅ {channel_title}: {count} постов проверено, {len(ads)} рекламных")

    except Exception as e:
        print(f"  ❌ {channel_username}: {e}")

    return ads


async def main(api_id, api_hash, phone=None):
    """Основной процесс парсинга."""
    print("=" * 60)
    print("🔍 QUILLON — Парсер рекламных посевов конкурентов")
    print("=" * 60)
    print(f"Каналов: {len(TARGET_CHANNELS)}")
    print(f"Период: последние {DAYS_BACK} дней")
    print(f"Ключевых слов: {len(COMPETITORS['keywords'])}")
    print(f"Доменов: {len(COMPETITORS['domains'])}")
    print()

    session_path = "/tmp/quillon_tg_parser"
    client = TelegramClient(session_path, api_id, api_hash)
    await client.start(phone=phone)

    cutoff_date = datetime.now() - timedelta(days=DAYS_BACK)
    all_ads = []

    for i, channel in enumerate(TARGET_CHANNELS, 1):
        print(f"[{i}/{len(TARGET_CHANNELS)}] Парсим @{channel}...")
        ads = await parse_channel(client, channel, cutoff_date)
        all_ads.extend(ads)
        await asyncio.sleep(2)  # Пауза чтобы не забанили

    await client.disconnect()

    print()
    print("=" * 60)
    print(f"📊 РЕЗУЛЬТАТЫ: {len(all_ads)} рекламных постов найдено")
    print("=" * 60)

    if not all_ads:
        print("Ничего не найдено. Попробуй расширить список каналов или ключевых слов.")
        return

    # ─── Анализ ────────────────────────────────────────────────────
    # 1. Самые просматриваемые посевы
    all_ads.sort(key=lambda x: x["views"], reverse=True)

    print("\n🏆 ТОП-10 по просмотрам:")
    print("-" * 60)
    for ad in all_ads[:10]:
        print(f"  👁 {ad['views']:,} | ER {ad['er']}% | @{ad['channel']}")
        print(f"  📅 {ad['date']}")
        print(f"  📝 {ad['text'][:120]}...")
        print(f"  🔗 {ad['post_url']}")
        print(f"  🏷 {', '.join(ad['keywords'][:5])}")
        print()

    # 2. Повторяющиеся домены (= масштабируемые кампании)
    all_domains = []
    for ad in all_ads:
        for link in ad["links"]:
            # Извлекаем домен
            match = re.search(r'https?://([^/\s]+)', link)
            if match:
                all_domains.append(match.group(1))

    domain_counts = Counter(all_domains).most_common(20)
    print("\n🔗 Самые частые домены в посевах (повторение = работает):")
    print("-" * 60)
    for domain, count in domain_counts:
        print(f"  {count:3d}x | {domain}")

    # 3. Самые частые ключевые слова
    all_kw = []
    for ad in all_ads:
        all_kw.extend(ad["keywords"])
    kw_counts = Counter(all_kw).most_common(15)
    print("\n🏷 Самые частые триггеры:")
    print("-" * 60)
    for kw, count in kw_counts:
        print(f"  {count:3d}x | {kw}")

    # 4. Лучшие по ER (engagement rate)
    ads_with_er = [a for a in all_ads if a["er"] > 0]
    ads_with_er.sort(key=lambda x: x["er"], reverse=True)

    print("\n🔥 ТОП-10 по вовлечённости (ER):")
    print("-" * 60)
    for ad in ads_with_er[:10]:
        print(f"  ER {ad['er']}% | 👁 {ad['views']:,} | @{ad['channel']}")
        print(f"  📝 {ad['text'][:120]}...")
        print(f"  🔗 {ad['post_url']}")
        print()

    # ─── Сохранение ────────────────────────────────────────────────
    # CSV
    csv_path = "/Users/maksimpozdnysev/Desktop/quillon-site/marketing_output/competitor_ads.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "channel", "channel_title", "views", "forwards",
            "reactions", "er", "text", "links", "keywords", "post_url"
        ])
        writer.writeheader()
        for ad in all_ads:
            row = {**ad}
            row["links"] = " | ".join(ad["links"])
            row["keywords"] = ", ".join(ad["keywords"])
            row["text"] = ad["text"]
            del row["full_text"]
            writer.writerow(row)

    print(f"\n💾 CSV сохранён: {csv_path}")

    # JSON (полный)
    json_path = "/Users/maksimpozdnysev/Desktop/quillon-site/marketing_output/competitor_ads.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_ads, f, ensure_ascii=False, indent=2)

    print(f"💾 JSON сохранён: {json_path}")
    print(f"\n✅ Готово! {len(all_ads)} постов проанализировано.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quillon TG Ad Parser")
    parser.add_argument("--api-id", type=int, required=True, help="Telegram API ID")
    parser.add_argument("--api-hash", type=str, required=True, help="Telegram API Hash")
    parser.add_argument("--phone", type=str, help="Номер телефона для авторизации")
    parser.add_argument("--days", type=int, default=90, help="За сколько дней парсить")
    parser.add_argument("--min-views", type=int, default=1000, help="Мин. просмотров")
    args = parser.parse_args()

    DAYS_BACK = args.days
    MIN_VIEWS = args.min_views

    asyncio.run(main(args.api_id, args.api_hash, args.phone))
