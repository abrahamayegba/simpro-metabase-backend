import { prisma } from "../../lib/prisma";

// =====================================================
// RESPONSE TIMES
// =====================================================

interface SimproResponseTime {
  ID: number;
  Name?: string | null;
  Archived?: boolean | null;
}

interface SyncResponseTimesResult {
  fetched: number;
  upserted: number;
  errors: Array<{ id: number; error: string }>;
  durationMs: number;
}

async function fetchResponseTimes(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproResponseTime[]> {
  const results: SimproResponseTime[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/setup/responseTimes/?page=${page}&pageSize=${pageSize}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);

    if (!items.length) break;

    results.push(...items);

    if (items.length < pageSize) break;
    page++;
  }

  return results;
}

export async function syncReportResponseTimes(
  companyId: string,
  simproCompanyId: string,
): Promise<SyncResponseTimesResult> {
  const start = Date.now();

  const result: SyncResponseTimesResult = {
    fetched: 0,
    upserted: 0,
    errors: [],
    durationMs: 0,
  };

  const integration = await prisma.integration.findUnique({
    where: { companyId_provider: { companyId, provider: "Simpro" } },
  });

  if (!integration?.apiUrl || !integration?.apiKey) {
    throw new Error("Missing Simpro integration");
  }

  const { apiUrl, apiKey } = integration;

  const items = await fetchResponseTimes(apiUrl, apiKey, simproCompanyId);

  result.fetched = items.length;

  for (const item of items) {
    try {
      const data = {
        simproResponseTimeId: item.ID,
        name: item.Name ?? null,
        archived: item.Archived ?? null,
        syncedAt: new Date(),
      };

      const existing = await prisma.reportResponseTime.findFirst({
        where: { companyId, simproResponseTimeId: item.ID },
        select: { id: true },
      });

      if (existing) {
        await prisma.reportResponseTime.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.reportResponseTime.create({
          data: { companyId, ...data },
        });
      }

      result.upserted++;
    } catch (e: any) {
      result.errors.push({ id: item.ID, error: e.message });
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}
