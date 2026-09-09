import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproAssetListItem {
  ID: number;
  AssetType?: {
    ID?: number;
    Name?: string;
  };
  Site?: {
    ID?: number;
    Name?: string;
  };
  ServiceLevels?: Array<{
    ID?: number;
    Name?: string;
    ServiceDate?: string;
  }>;
}

interface SimproAsset {
  ID: number;
  Archived?: boolean;
  DisplayOrder?: number | null;
  ParentID?: number | null;
  DateModified?: string | null;
  StartDate?: string | null;

  AssetType?: {
    ID?: number;
    Name?: string;
  } | null;

  Customer?: {
    ID?: number;
    CompanyName?: string;
  } | null;

  Site?: {
    ID?: number;
    Name?: string;
  } | null;

  CustomerContract?: {
    ID?: number;
    Name?: string;
    StartDate?: string;
    EndDate?: string;
    ContractNo?: string;
    Expired?: boolean;
  } | null;

  LastTest?: {
    Result?: string | null;
    Date?: string | null;
    ServiceLevel?: {
      ID?: number;
      Name?: string;
    } | null;
  } | null;
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ assetId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH ASSET LIST
// =====================================================
async function fetchAssetList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproAssetListItem[]> {
  const results: SimproAssetListItem[] = [];
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

    results.push(...items);

    if (items.length < pageSize) break;
    page++;
  }

  return results;
}

// =====================================================
// PHASE 2 — FETCH ASSET DETAIL
// =====================================================
async function fetchAssetDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  assetId: number,
): Promise<SimproAsset | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/${assetId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

// =====================================================
// PHASE 3 — TRANSFORM
// =====================================================
function transformAsset(asset: SimproAsset, listItem: SimproAssetListItem) {
  return {
    simproAssetId: asset.ID,

    assetType: asset.AssetType?.Name ?? listItem.AssetType?.Name ?? null,

    simproCustomerId: asset.Customer?.ID ?? null,
    customerName: asset.Customer?.CompanyName ?? null,

    simproSiteId: asset.Site?.ID ?? listItem.Site?.ID ?? null,
    siteName: asset.Site?.Name ?? listItem.Site?.Name ?? null,

    contractId: asset.CustomerContract?.ID ?? null,
    contractName: asset.CustomerContract?.Name ?? null,

    parentAssetId: asset.ParentID ?? null,
    topParentAssetId: null,

    displayOrder: asset.DisplayOrder ?? null,

    removed: asset.Archived ?? null,

    customFields: null,

    syncedAt: new Date(),
  };
}

// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportAsset(
  companyId: string,
  asset: SimproAsset,
  listItem: SimproAssetListItem,
): Promise<void> {
  const data = transformAsset(asset, listItem);

  const existing = await prisma.reportAsset.findFirst({
    where: { companyId, simproAssetId: asset.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportAsset.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportAsset.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportAssets(
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

  const listItems = await fetchAssetList(apiUrl, apiKey, simproCompanyId);

  result.fetched = listItems.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 300 });

  let processed = 0;

  await limiter.processBatch(listItems, async (listItem) => {
    const asset = await fetchAssetDetail(
      apiUrl,
      apiKey,
      simproCompanyId,
      listItem.ID,
    );

    if (!asset) {
      result.skipped++;
      return;
    }

    try {
      await upsertReportAsset(companyId, asset, listItem);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ assetId: listItem.ID, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
