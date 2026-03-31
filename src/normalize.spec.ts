import { describe, expect, it } from "vitest";
import { normalizeRawEvent } from "./normalize";
import type { RawSourceEvent } from "./types";

describe("normalizeRawEvent", () => {
  it("normalizes demo-source payload", () => {
    const input: RawSourceEvent = {
      eventId: "evt-1",
      runKey: "demo-run",
      source: "demo-source",
      collectedAt: "2026-03-30T10:00:00.000Z",
      url: "https://example.org",
      payloadVersion: "v1",
      artifacts: [],
      raw: {
        externalId: "demo-1",
        title: "Поставка оборудования",
        customer: "АО Демонстрационная АЭС",
        amount: 1200
      }
    };

    const normalized = normalizeRawEvent(input);

    expect(normalized.externalId).toBe("demo-1");
    expect(normalized.title).toBe("Поставка оборудования");
    expect(normalized.customer).toBe("АО Демонстрационная АЭС");
    expect(normalized.amount).toBe(1200);
    expect(normalized.sourceUrl).toBe("https://example.org");
  });

  it("normalizes find-tender payload using ocid", () => {
    const input: RawSourceEvent = {
      eventId: "evt-2",
      runKey: "find-tender-run",
      source: "find-tender",
      collectedAt: "2026-03-30T10:00:00.000Z",
      url: "https://www.find-tender.service.gov.uk/Notice/008889-2026",
      payloadVersion: "v1",
      artifacts: [],
      raw: {
        ocid: "ocds-h6vhtk-061410",
        title: "E-Disclosure Services",
        buyer: "Care Quality Commission",
        supplier: "KLDISCOVERY LIMITED",
        amount: 150000,
        currency: "GBP"
      }
    };

    const normalized = normalizeRawEvent(input);

    expect(normalized.externalId).toBe("ocds-h6vhtk-061410");
    expect(normalized.title).toBe("E-Disclosure Services");
    expect(normalized.customer).toBe("Care Quality Commission");
    expect(normalized.sourceUrl).toContain("find-tender.service.gov.uk");
  });
});
