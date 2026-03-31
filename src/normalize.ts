import type { NormalizedSourceEvent, RawSourceEvent } from "./types";

export function normalizeRawEvent(input: RawSourceEvent): NormalizedSourceEvent {
  const raw = input.raw;

  const toStringOrUndefined = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() ? value : undefined;

  const toNumberOrUndefined = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

  const title = toStringOrUndefined(raw.title) ?? "Untitled procurement";
  const externalId =
    toStringOrUndefined(raw.externalId) ??
    toStringOrUndefined(raw.ocid) ??
    toStringOrUndefined(raw.noticeNumber) ??
    `${input.source}-${input.eventId}`;

  return {
    eventId: input.eventId,
    runKey: input.runKey,
    source: input.source,
    payloadVersion: "v1",
    externalId,
    title,
    description: toStringOrUndefined(raw.description),
    customer: toStringOrUndefined(raw.customer) ?? toStringOrUndefined(raw.buyer),
    supplier: toStringOrUndefined(raw.supplier),
    amount: toNumberOrUndefined(raw.amount),
    currency: toStringOrUndefined(raw.currency) ?? "RUB",
    publishedAt: toStringOrUndefined(raw.publishedAt) ?? input.collectedAt,
    deadlineAt: toStringOrUndefined(raw.deadlineAt),
    normalizedAt: new Date().toISOString(),
    sourceUrl: input.url,
    status: "ACTIVE",
    rawRef: input.url,
    rawEvent: {
      eventId: input.eventId,
      runKey: input.runKey,
      collectedAt: input.collectedAt,
      url: input.url,
      artifacts: input.artifacts
    }
  };
}
