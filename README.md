# processing-worker

Сервис нормализации и ingest для пайплайна NPPWEB.

## Что делает

- читает `source.raw.v1` из RabbitMQ;
- валидирует raw-события;
- нормализует payload до формата `source.normalized.v1`;
- отправляет `ingestNormalizedItem` в `npp-backend` с заголовком `x-ingest-token`;
- публикует успешные нормализованные события в `source.normalized.v1`;
- при transient ошибках использует retry queue, а poison messages отправляет в DLQ.

## Переменные окружения

- `RABBITMQ_URL`
- `QUEUE_RAW_EVENT`
- `QUEUE_RETRY_EVENT`
- `QUEUE_DEAD_LETTER_EVENT`
- `QUEUE_NORMALIZED_EVENT`
- `API_BASE_URL`
- `GRAPHQL_PATH`
- `API_GRAPHQL_URL`
- `API_INGEST_TOKEN`
- `SHARED_CONTRACTS_DIR`
- `RETRY_ATTEMPTS`
- `RETRY_BASE_DELAY_MS`
- `PREFETCH`

По умолчанию `SHARED_CONTRACTS_DIR` указывает на `../contracts`.

## Локальный запуск

```bash
cd ../infra
cp .env.example .env
docker compose --env-file .env -f docker-compose.yml -f docker-compose.apps.yml up -d rabbitmq backend-api

cd ../processing-worker
npm install
npm run start:dev
```

## Ожидаемые очереди

- `source.raw.v1`
- `source.raw.retry.v1`
- `source.raw.dlq.v1`
- `source.normalized.v1`

## Проверка качества

```bash
npm run check
npm run test
npm run build
```

## Связи

- получает события от `scrape-helper`;
- использует схемы из `contracts`;
- отправляет результаты в `npp-backend`.
