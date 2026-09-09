import { prisma } from "../lib/prisma";
import { RateLimiter } from "../lib/rate-limiter";

/* =====================================================
   SIMPRO TYPES
===================================================== */

interface SimproAssetListItem {
  ID: number;
  Site?: {
    ID?: number;
  };
}

interface SimproAssetTestHistoryItem {
  Job?: {
    ID?: number;
    DateIssued?: string;
    DueDate?: string;
  };

  Quote?: {
    ID?: number;
    DateIssued?: string;
    DueDate?: string;
  };

  ServiceLevel?: {
    ID?: number;
    Name?: string;
  };

  TestRecord?: {
    Employee?: {
      ID?: number;
      Name?: string;
    };
    Date?: string;
    Notes?: string;
    Result?: string;
  };

  DateModified?: string;
}

/* =====================================================
   FETCH ALL CUSTOMER ASSETS (PAGED)
===================================================== */

async function fetchCustomerAssetList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string
): Promise<SimproAssetListItem[]> {
  const results: SimproAssetListItem[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetch(
      `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      throw new Error(`Failed fetching customer assets (page ${page})`);
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items ?? [];

    if (!items.length) break;

    results.push(...items);
    if (items.length < pageSize) break;

    page++;
  }

  return results;
}

/* =====================================================
   FETCH ASSET TEST HISTORY
===================================================== */

async function fetchAssetTestHistory(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  siteId: number,
  assetId: number
): Promise<SimproAssetTestHistoryItem[]> {
  const res = await fetch(
    `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/${siteId}/assets/${assetId}/testHistory/`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  if (!res.ok) {
    throw new Error(`Failed fetching test history for asset ${assetId}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/* =====================================================
   TRANSFORM
===================================================== */

function transformSimproAssetTestHistory(
  item: SimproAssetTestHistoryItem,
  assetId: number,
  companyId: string,
  assetTypeName: string | null
) {
  return {
    assetId,
    companyId,
    assetType: assetTypeName,

    testDate: item.TestRecord?.Date ? new Date(item.TestRecord.Date) : null,

    nextTestDate: null,

    testEmployeeId: item.TestRecord?.Employee?.ID ?? null,
    testEmployeeName: item.TestRecord?.Employee?.Name ?? null,

    testNotes: item.TestRecord?.Notes ?? null,
    testResult: item.TestRecord?.Result ?? null,

    serviceLevelId: item.ServiceLevel?.ID ?? null,
    serviceLevelName: item.ServiceLevel?.Name ?? null,

    jobId: item.Job?.ID ?? null,
    jobDateIssued: item.Job?.DateIssued ? new Date(item.Job.DateIssued) : null,
    jobDueDate: item.Job?.DueDate ? new Date(item.Job.DueDate) : null,

    dateModified: item.DateModified ? new Date(item.DateModified) : null,

    lastSynced: new Date(),
  };
}

/* =====================================================
   MAIN SYNC
===================================================== */

export async function syncAssetTestHistory(
  companyId: string,
  simproCompanyId: string
) {
  const start = Date.now();

  const result = {
    assetsProcessed: 0,
    testsInserted: 0,
    errors: [] as Array<{ assetId: number; error: string }>,
    durationMs: 0,
  };

  const integration = await prisma.integration.findUnique({
    where: {
      companyId_provider: {
        companyId,
        provider: "simpro",
      },
    },
  });

  if (!integration?.apiUrl || !integration.apiKey) {
    throw new Error("Missing Simpro integration");
  }

  const { apiUrl, apiKey } = integration;

  // 🔥 CLEAR EXISTING HISTORY FIRST
  await prisma.assetTestHistory.deleteMany({
    where: { companyId },
  });

  const assets = await fetchCustomerAssetList(apiUrl, apiKey, simproCompanyId);

  const limiter = new RateLimiter({ concurrency: 6, delayMs: 500 });

  await limiter.processBatch(assets, async (asset) => {
    if (!asset.ID || !asset.Site?.ID) return;

    try {
      // FK safety: asset must exist locally
      const localAsset = await prisma.customerAsset.findUnique({
        where: {
          id_companyId: {
            id: asset.ID,
            companyId,
          },
        },
        select: {
          assetTypeName: true,
        },
      });

      if (!localAsset) return;

      const history = await fetchAssetTestHistory(
        apiUrl,
        apiKey,
        simproCompanyId,
        asset.Site.ID,
        asset.ID
      );

      if (!history.length) return;

      const rows = history.map((item) =>
        transformSimproAssetTestHistory(
          item,
          asset.ID,
          companyId,
          localAsset.assetTypeName ?? null
        )
      );

      await prisma.assetTestHistory.createMany({
        data: rows,
      });

      result.assetsProcessed++;
      result.testsInserted += rows.length;
    } catch (e: any) {
      result.errors.push({
        assetId: asset.ID,
        error: e.message,
      });
    }
  });

  result.durationMs = Date.now() - start;
  return result;
}
