export type ArtifactRef = {
  kind: "RAW_JSON" | "RAW_HTML" | "REPORT_FILE" | "OTHER";
  bucket: string;
  objectKey: string;
  mimeType?: string;
  checksum?: string;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
};

export type RawSourceEvent = {
  eventId: string;
  runKey: string;
  source: string;
  collectedAt: string;
  url: string;
  payloadVersion: "v1";
  artifacts: ArtifactRef[];
  metadata?: Record<string, unknown>;
  raw: Record<string, unknown>;
};

export type NormalizedSourceEvent = {
  eventId: string;
  runKey: string;
  source: string;
  payloadVersion: "v1";
  externalId: string;
  title: string;
  description?: string;
  customer?: string;
  supplier?: string;
  amount?: number;
  currency?: string;
  publishedAt?: string;
  deadlineAt?: string;
  normalizedAt: string;
  sourceUrl: string;
  status: "ACTIVE" | "CLOSED" | "ARCHIVED" | "DRAFT";
  rawRef?: string;
  rawEvent: {
    eventId: string;
    runKey: string;
    collectedAt: string;
    url: string;
    artifacts: ArtifactRef[];
  };
};
