import { connect, type Channel, type ChannelModel, type ConsumeMessage, type Options } from "amqplib";

export class QueueClient {
  private connection?: ChannelModel;
  private channel?: Channel;

  constructor(private readonly rabbitmqUrl: string) {}

  async init(prefetch = 10): Promise<void> {
    this.connection = await connect(this.rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.prefetch(prefetch);
  }

  async assertQueue(queue: string): Promise<void> {
    if (!this.channel) {
      throw new Error("QueueClient не инициализирован");
    }
    await this.channel.assertQueue(queue, { durable: true });
  }

  async assertRetryTopology(mainQueue: string, retryQueue: string, deadLetterQueue: string): Promise<void> {
    if (!this.channel) {
      throw new Error("QueueClient не инициализирован");
    }

    await this.channel.assertQueue(deadLetterQueue, { durable: true });
    await this.channel.assertQueue(retryQueue, {
      durable: true,
      deadLetterExchange: "",
      deadLetterRoutingKey: mainQueue
    });
    await this.channel.assertQueue(mainQueue, { durable: true });
  }

  async publish(queue: string, payload: unknown, options?: Options.Publish): Promise<void> {
    if (!this.channel) {
      throw new Error("QueueClient не инициализирован");
    }

    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      contentType: "application/json",
      persistent: true,
      ...options
    });
  }

  consume(queue: string, handler: (message: ConsumeMessage) => Promise<void>): void {
    if (!this.channel) {
      throw new Error("QueueClient не инициализирован");
    }

    void this.channel.consume(queue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        await handler(msg);
        this.channel?.ack(msg);
      } catch (error) {
        throw error;
      }
    });
  }

  parseMessage<T>(message: ConsumeMessage): T {
    return JSON.parse(message.content.toString("utf-8")) as T;
  }

  ack(message: ConsumeMessage): void {
    this.channel?.ack(message);
  }

  async retry(
    message: ConsumeMessage,
    retryQueue: string,
    attempt: number,
    baseDelayMs: number
  ): Promise<void> {
    await this.publish(retryQueue, JSON.parse(message.content.toString("utf-8")), {
      expiration: String(baseDelayMs * 2 ** attempt),
      headers: {
        ...(message.properties.headers ?? {}),
        "x-retry-count": attempt
      }
    });
    this.ack(message);
  }

  async deadLetter(
    message: ConsumeMessage,
    deadLetterQueue: string,
    reason: string
  ): Promise<void> {
    await this.publish(deadLetterQueue, {
      reason,
      failedAt: new Date().toISOString(),
      payload: JSON.parse(message.content.toString("utf-8"))
    });
    this.ack(message);
  }

  getRetryCount(message: ConsumeMessage): number {
    const raw = message.properties.headers?.["x-retry-count"];
    return typeof raw === "number" ? raw : Number(raw ?? 0);
  }
}
