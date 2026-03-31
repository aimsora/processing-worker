import type { ConsumeMessage } from "amqplib";
import { sendToBackend } from "./backend-client";
import { config } from "./config";
import { createSchemaValidators } from "./contracts/schema-validator";
import { logger } from "./logger";
import { QueueClient } from "./messaging/queue-client";
import { normalizeRawEvent } from "./normalize";
import type { RawSourceEvent } from "./types";

async function bootstrap(): Promise<void> {
  const queue = new QueueClient(config.RABBITMQ_URL);
  const validators = createSchemaValidators(config.SHARED_CONTRACTS_DIR);

  await queue.init(config.PREFETCH);
  await queue.assertRetryTopology(
    config.QUEUE_RAW_EVENT,
    config.QUEUE_RETRY_EVENT,
    config.QUEUE_DEAD_LETTER_EVENT
  );
  await queue.assertQueue(config.QUEUE_NORMALIZED_EVENT);

  logger.info(
    {
      queueRaw: config.QUEUE_RAW_EVENT,
      queueRetry: config.QUEUE_RETRY_EVENT,
      queueDeadLetter: config.QUEUE_DEAD_LETTER_EVENT,
      queueNormalized: config.QUEUE_NORMALIZED_EVENT,
      apiGraphqlUrl: config.API_GRAPHQL_URL
    },
    "processing-worker started"
  );

  queue.consume(config.QUEUE_RAW_EVENT, async (message: ConsumeMessage) => {
    const attempt = queue.getRetryCount(message);

    try {
      const raw = queue.parseMessage<RawSourceEvent>(message);
      validators.validateRaw(raw);

      const normalized = normalizeRawEvent(raw);
      validators.validateNormalized(normalized);

      await queue.publish(config.QUEUE_NORMALIZED_EVENT, normalized);
      await sendToBackend(config.API_GRAPHQL_URL, config.API_INGEST_TOKEN, normalized);
      queue.ack(message);

      logger.info(
        { eventId: raw.eventId, source: raw.source, externalId: normalized.externalId },
        "raw event normalized and ingested"
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown worker error";
      if (attempt < config.RETRY_ATTEMPTS) {
        await queue.retry(message, config.QUEUE_RETRY_EVENT, attempt + 1, config.RETRY_BASE_DELAY_MS);
        logger.warn({ err: error, attempt: attempt + 1 }, "message scheduled for retry");
        return;
      }

      await queue.deadLetter(message, config.QUEUE_DEAD_LETTER_EVENT, reason);
      logger.error({ err: error, attempt }, "message moved to dead-letter queue");
    }
  });
}

void bootstrap().catch((error) => {
  logger.error({ err: error }, "processing-worker crashed");
  process.exit(1);
});
