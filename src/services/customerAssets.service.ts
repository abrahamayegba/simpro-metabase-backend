import { prisma } from "../lib/prisma";
import { RateLimiter } from "../lib/rate-limiter";

/* =====================================================
   SIMPRO TYPES
===================================================== */

interface SimproCustomerAssetListItem {
  ID: number;
}

interface SimproCustomerAssetDetail {
  ID: number;

  Customer?: {
    ID?: number;
    CompanyName?: string;
  };

  AssetType?: {
    ID?: number;
    Name?: string;
  };

  Site?: {
    ID?: number;
    Name?: string;
  };

  DisplayOrder?: number;
  ParentID?: number | null;

  CustomerContract?: {
    ID?: number;
    Name?: string;
    StartDate?: string;
    EndDate?: string;
    ContractNo?: string;
    Expired?: boolean;
  } | null;

  StartDate?: string;

  LastTest?: {
    Result?: string | null;
    Date?: string | null;
    ServiceLevel?: {
      ID?: number;
      Name?: string;
    } | null;
  };

  Archived?: boolean;
  DateModified?: string;
}

/* =====================================================
   FETCH LIST
===================================================== */

async function fetchCustomerAssetList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproCustomerAssetListItem[]> {
  const results: SimproCustomerAssetListItem[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetch(
      `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!res.ok) {
      throw new Error(`Failed fetching customer assets (page ${page})`);
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);

    if (!items.length) break;

    results.push(...items);

    if (items.length < pageSize) break;
    page++;
  }

  return results;
}

/* =====================================================
   FETCH DETAIL
===================================================== */

async function fetchCustomerAssetDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  assetId: number,
): Promise<SimproCustomerAssetDetail> {
  const res = await fetch(
    `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/${assetId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );

  if (!res.ok) {
    throw new Error(`Failed fetching asset ${assetId}`);
  }

  return res.json();
}

/* =====================================================
   TRANSFORM
===================================================== */

function transformSimproCustomerAsset(asset: SimproCustomerAssetDetail) {
  return {
    assetTypeId: asset.AssetType?.ID ?? null,
    assetTypeName: asset.AssetType?.Name ?? null,

    customerName: asset.Customer?.CompanyName ?? null,

    displayOrder: asset.DisplayOrder ?? null,
    parentId: asset.ParentID ?? null,

    contractId: asset.CustomerContract?.ID ?? null,
    contractName: asset.CustomerContract?.Name ?? null,
    contractStartDate: asset.CustomerContract?.StartDate
      ? new Date(asset.CustomerContract.StartDate)
      : null,
    contractEndDate: asset.CustomerContract?.EndDate
      ? new Date(asset.CustomerContract.EndDate)
      : null,
    contractNo: asset.CustomerContract?.ContractNo ?? null,
    contractExpired: asset.CustomerContract?.Expired ?? null,

    startDate: asset.StartDate ? new Date(asset.StartDate) : null,

    lastTestResult: asset.LastTest?.Result ?? null,
    lastTestDate: asset.LastTest?.Date ? new Date(asset.LastTest.Date) : null,
    lastTestServiceLevelId: asset.LastTest?.ServiceLevel?.ID ?? null,
    lastTestServiceLevelName: asset.LastTest?.ServiceLevel?.Name ?? null,

    archived: asset.Archived ?? null,
    dateModified: asset.DateModified ? new Date(asset.DateModified) : null,

    lastSynced: new Date(),
  };
}

/* =====================================================
   UPSERT
===================================================== */

async function upsertCustomerAsset(
  companyId: string,
  detail: SimproCustomerAssetDetail,
) {
  // -------------------------------
  // SAFE CUSTOMER FK
  // -------------------------------
  let customerId: number | null = null;

  if (detail.Customer?.ID) {
    const exists = await prisma.customer.findUnique({
      where: {
        id_companyId: {
          id: detail.Customer.ID,
          companyId,
        },
      },
    });

    if (exists) {
      customerId = detail.Customer.ID;
    }
  }

  // -------------------------------
  // SAFE SITE FK
  // -------------------------------
  let siteId: number | null = null;

  if (detail.Site?.ID) {
    const exists = await prisma.site.findUnique({
      where: {
        id_companyId: {
          id: detail.Site.ID,
          companyId,
        },
      },
    });

    if (exists) {
      siteId = detail.Site.ID;
    }
  }

  const data = transformSimproCustomerAsset(detail);

  await prisma.customerAsset.upsert({
    where: {
      id_companyId: {
        id: detail.ID,
        companyId,
      },
    },
    update: {
      ...data,
      customerId,
      siteId,
    },
    create: {
      id: detail.ID,
      companyId,
      ...data,
      customerId,
      siteId,
    },
  });
}

/* =====================================================
   MAIN SYNC
===================================================== */

export async function syncCustomerAssets(
  companyId: string,
  simproCompanyId: string,
  limit?: number,
) {
  const start = Date.now();

  const result = {
    fetched: 0,
    updated: 0,
    errors: [] as Array<{ id: number; error: string }>,
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

  let list = await fetchCustomerAssetList(apiUrl, apiKey, simproCompanyId);

  result.fetched = list.length;

  const limiter = new RateLimiter({ concurrency: 3, delayMs: 100 });

  await limiter.processBatch(list, async (item) => {
    try {
      const detail = await fetchCustomerAssetDetail(
        apiUrl,
        apiKey,
        simproCompanyId,
        item.ID,
      );

      await upsertCustomerAsset(companyId, detail);
      result.updated++;
    } catch (e: any) {
      result.errors.push({ id: item.ID, error: e.message });
    }
  });

  result.durationMs = Date.now() - start;
  return result;
}
