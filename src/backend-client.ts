import type { NormalizedSourceEvent } from "./types";

const INGEST_MUTATION = `
mutation IngestNormalizedItem($input: IngestNormalizedItemInput!) {
  ingestNormalizedItem(input: $input) {
    accepted
    idempotencyKey
    procurementId
  }
}
`;

export async function sendToBackend(
  graphqlUrl: string,
  ingestToken: string,
  event: NormalizedSourceEvent
): Promise<void> {
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-token": ingestToken
    },
    body: JSON.stringify({
      query: INGEST_MUTATION,
      variables: {
        input: {
          externalId: event.externalId,
          source: event.source,
          title: event.title,
          description: event.description,
          customer: event.customer,
          supplier: event.supplier,
          amount: event.amount,
          currency: event.currency,
          publishedAt: event.publishedAt,
          deadlineAt: event.deadlineAt,
          payloadVersion: event.payloadVersion,
          sourceUrl: event.sourceUrl,
          status: event.status,
          rawPayload: { rawRef: event.rawRef, eventId: event.eventId },
          rawEvent: event.rawEvent
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Backend API ответил с кодом ${response.status}`);
  }

  const payload = (await response.json()) as {
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(`Ошибка GraphQL ingest: ${payload.errors.map((e) => e.message).join("; ")}`);
  }
}
