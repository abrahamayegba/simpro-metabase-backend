import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproAssetServiceLevel {
  ServiceLevel?: {
    ID?: number;
    Name?: string;
  };
  ServiceDate?: string | null;
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ assetId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH SERVICE LEVELS FOR ONE ASSET
// =====================================================
async function fetchAssetServiceLevels(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  assetId: number,
): Promise<SimproAssetServiceLevel[]> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/${assetId}/serviceLevels/`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data) ? data : (data.items ?? []);
  } catch {
    return [];
  }
}

// =====================================================
// PHASE 2 — FETCH ALL ASSET IDS TO ITERATE
// =====================================================
async function fetchAssetIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/?page=${page}&pageSize=${pageSize}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);

    if (!items.length) break;

    for (const item of items) {
      if (item.ID) ids.push(item.ID);
    }

    if (items.length < pageSize) break;
    page++;
  }

  return ids;
}

// =====================================================
// PHASE 3 — UPSERT SERVICE LEVELS FOR ONE ASSET
// =====================================================
async function upsertAssetServiceLevels(
  companyId: string,
  assetId: number,
  serviceLevels: SimproAssetServiceLevel[],
): Promise<void> {
  for (const sl of serviceLevels) {
    const data = {
      simproAssetId: assetId,
      serviceLevelName: sl.ServiceLevel?.Name ?? null,
      serviceStartDate: sl.ServiceDate ? new Date(sl.ServiceDate) : null,
      intervalYears: null,
      intervalMonths: null,
      intervalDays: null,
      nextServiceDate: null,
      syncedAt: new Date(),
    };

    const existing = await prisma.reportAssetServiceLevel.findFirst({
      where: {
        companyId,
        simproAssetId: assetId,
        serviceLevelName: data.serviceLevelName,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.reportAssetServiceLevel.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.reportAssetServiceLevel.create({
        data: { companyId, ...data },
      });
    }
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportAssetServiceLevels(
  companyId: string,
  simproCompanyId: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<SyncResult> {
  const start = Date.now();

  const result: SyncResult = {
    fetched: 0,
    upserted: 0,
    skipped: 0,
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

  const assetIds = await fetchAssetIds(apiUrl, apiKey, simproCompanyId);

  result.fetched = assetIds.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 300 });

  let processed = 0;

  await limiter.processBatch(assetIds, async (assetId) => {
    const serviceLevels = await fetchAssetServiceLevels(
      apiUrl,
      apiKey,
      simproCompanyId,
      assetId,
    );

    if (!serviceLevels.length) {
      result.skipped++;
      processed++;
      onProgress?.(processed, result.fetched);
      return;
    }

    try {
      await upsertAssetServiceLevels(companyId, assetId, serviceLevels);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ assetId, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
