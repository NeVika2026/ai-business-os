# Scout Worker for Business-Zavod

Небольшой API-слой над `kiryano/Scout`.

## Зачем отдельно от Vercel

Scout — Python scraper/enrichment worker. Его лучше запускать отдельным контейнером/VPS,
а Бизнес-Завод на Vercel обращается к нему по HTTPS.

## API

- `GET /health`
- `POST /scrape`

Пример:

```json
{
  "platform": "instagram",
  "identifier": "username",
  "enrich": true
}
```

Если задан `SCOUT_WORKER_TOKEN`, запрос к `/scrape` должен содержать:

```
Authorization: Bearer <token>
```

## Переменные среды

- `SCOUT_WORKER_TOKEN` — защита API.
- `HUNTER_API_KEY` — опционально, для дополнительного email enrichment.
- переменные Scout для прокси/платформенных интеграций — по документации Scout.

## Docker

```bash
docker build -t business-zavod-scout .
docker run --rm -p 8080:8080 \
  -e SCOUT_WORKER_TOKEN=change-me \
  business-zavod-scout
```

После публикации контейнера в Бизнес-Заводе задаются:

- `SCOUT_API_URL=https://scout.example.com`
- `SCOUT_API_TOKEN=change-me`

Использовать только открытые данные и соблюдать правила площадок, применимое законодательство
и основания для последующей связи с человеком.
