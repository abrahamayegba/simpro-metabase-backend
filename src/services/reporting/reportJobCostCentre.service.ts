import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproJobCostCentreListItem {
  ID: number;
  _href: string;
  Job?: {
    ID?: number;
  };
}

interface SimproJobCostCentreDetail {
  ID: number;
  JobID?: number | null;
  Name?: string | null;
  Header?: string | null;
  Description?: string | null;
  Notes?: string | null;
  OrderNo?: string | null;
  Stage?: string | null;
  DisplayOrder?: number | null;
  PercentComplete?: number | null;
  Variation?: boolean | null;
  VariationApprovalDate?: string | null;
  StartDate?: string | null;
  EndDate?: string | null;
  DateModified?: string | null;

  CostCenter?: {
    ID?: number;
    Name?: string;
  } | null;

  Site?: {
    ID?: number;
    Name?: string;
  } | null;

  Total?: {
    ExTax?: number;
    Tax?: number;
    IncTax?: number;
  } | null;

  Claimed?: {
    ToDate?: {
      Percent?: number;
      Amount?: {
        ExTax?: number;
        IncTax?: number;
      };
    };
  } | null;

  Totals?: {
    MaterialsCost?: {
      Actual?: number;
      Estimate?: number;
    };
    ResourcesCost?: {
      Labor?: {
        Actual?: number;
        Estimate?: number;
      };
      LaborHours?: {
        Actual?: number;
        Estimate?: number;
      };
    };
    Discount?: number;
    GrossProfitLoss?: {
      Actual?: number;
    };
    GrossMargin?: {
      Actual?: number;
    };
    InvoicedValue?: number;
    InvoicePercentage?: number;
  } | null;
}

interface SyncJobCostCentresResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ id: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH LIST
// =====================================================
async function fetchJobCostCentreList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproJobCostCentreListItem[]> {
  const results: SimproJobCostCentreListItem[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobCostCenters/?page=${page}&pageSize=${pageSize}`;

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
// PHASE 2 — FETCH DETAIL
// =====================================================
async function fetchJobCostCentreDetail(
  apiUrl: string,
  apiKey: string,
  href: string,
): Promise<SimproJobCostCentreDetail | null> {
  try {
    const res = await fetch(`${apiUrl}${href}`, {
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
function transformJobCostCentre(
  detail: SimproJobCostCentreDetail,
  listItem: SimproJobCostCentreListItem,
) {
  return {
    simproJobCostCentreId: detail.ID,
    simproJobId: detail.JobID ?? listItem.Job?.ID ?? null,

    simproSiteId: detail.Site?.ID ?? null,
    siteName: detail.Site?.Name ?? null,

    costCentreId: detail.CostCenter?.ID ?? null,
    costCentreName: detail.CostCenter?.Name ?? null,

    name: detail.Name ?? null,
    header: detail.Header ?? null,
    description: detail.Description ?? null,
    notes: detail.Notes ?? null,
    orderNo: detail.OrderNo ?? null,

    stage: detail.Stage ?? null,
    type: null,

    displayOrder: detail.DisplayOrder ?? null,

    variation: detail.Variation ?? null,
    variationApprovalDate: detail.VariationApprovalDate
      ? new Date(detail.VariationApprovalDate)
      : null,

    totalExTax: detail.Total?.ExTax ?? null,
    totalIncTax: detail.Total?.IncTax ?? null,
    totalTax: detail.Total?.Tax ?? null,

    discount: detail.Totals?.Discount ?? null,
    invoicedValue: detail.Totals?.InvoicedValue ?? null,
    invoicePercentage: detail.Totals?.InvoicePercentage ?? null,

    claimedExTaxToDate: detail.Claimed?.ToDate?.Amount?.ExTax ?? null,
    claimedIncTaxToDate: detail.Claimed?.ToDate?.Amount?.IncTax ?? null,
    claimedPercentToDate: detail.Claimed?.ToDate?.Percent ?? null,

    laborActual: detail.Totals?.ResourcesCost?.Labor?.Actual ?? null,
    laborEstimate: detail.Totals?.ResourcesCost?.Labor?.Estimate ?? null,
    laborHoursActual: detail.Totals?.ResourcesCost?.LaborHours?.Actual ?? null,
    laborHoursEstimate:
      detail.Totals?.ResourcesCost?.LaborHours?.Estimate ?? null,

    materialsCostActual: detail.Totals?.MaterialsCost?.Actual ?? null,
    materialsCostEstimate: detail.Totals?.MaterialsCost?.Estimate ?? null,

    grossProfitActual: detail.Totals?.GrossProfitLoss?.Actual ?? null,
    grossMarginActual: detail.Totals?.GrossMargin?.Actual ?? null,

    startDate: detail.StartDate ? new Date(detail.StartDate) : null,
    endDate: detail.EndDate ? new Date(detail.EndDate) : null,
    dateModified: detail.DateModified ? new Date(detail.DateModified) : null,

    syncedAt: new Date(),
  };
}

// =====================================================
// PHASE 4 — UPSERT
// =====================================================
async function upsertReportJobCostCentre(
  companyId: string,
  detail: SimproJobCostCentreDetail,
  listItem: SimproJobCostCentreListItem,
): Promise<void> {
  const data = transformJobCostCentre(detail, listItem);

  const existing = await prisma.reportJobCostCentre.findFirst({
    where: { companyId, simproJobCostCentreId: detail.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportJobCostCentre.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportJobCostCentre.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportJobCostCentres(
  companyId: string,
  simproCompanyId: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<SyncJobCostCentresResult> {
  const start = Date.now();

  const result: SyncJobCostCentresResult = {
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

  const list = await fetchJobCostCentreList(apiUrl, apiKey, simproCompanyId);

  result.fetched = list.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 300 });

  let processed = 0;

  await limiter.processBatch(list, async (listItem) => {
    const detail = await fetchJobCostCentreDetail(
      apiUrl,
      apiKey,
      listItem._href,
    );

    if (!detail) {
      result.skipped++;
      processed++;
      onProgress?.(processed, result.fetched);
      return;
    }

    try {
      await upsertReportJobCostCentre(companyId, detail, listItem);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ id: listItem.ID, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
