import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproContractorJobListItem {
  ID: number;
  _href: string;
  ProjectType?: string;
  Contractor?: {
    ID?: number;
    Name?: string;
    ContactName?: string;
  };
  Total?: {
    ExTax?: number;
    IncTax?: number;
    ReverseChargeTax?: number;
  };
}

interface SimproContractorJobDetail {
  ID: number;
  ProjectType?: string;
  Description?: string;
  Status?: string;
  DateIssued?: string;
  DueDate?: string;
  DateModified?: string;
  ContractorSupplyMaterials?: boolean;
  Materials?: number;
  Labor?: number;
  Currency?: string;
  ExchangeRate?: number;
  _href?: string;

  Contractor?: {
    ID?: number;
    Name?: string;
    ContactName?: string;
  };

  TaxCode?: {
    ID?: number;
    Code?: string;
    Type?: string;
    Rate?: number;
  };

  Retention?: {
    Amount?: number;
    PerClaim?: number;
    PeriodMonths?: number;
  };

  Total?: {
    ExTax?: number;
    IncTax?: number;
    ReverseChargeTax?: number;
  };
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ id: number; error: string }>;
  durationMs: number;
}

// =====================================================
// HELPERS
// =====================================================
function extractJobIdFromHref(href: string): number | null {
  const match = href.match(/\/jobs\/(\d+)/);
  return match ? Number(match[1]) : null;
}

// =====================================================
// PHASE 1 — FETCH LIST
// =====================================================
async function fetchContractorJobList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproContractorJobListItem[]> {
  const results: SimproContractorJobListItem[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorJobs/?page=${page}&pageSize=${pageSize}`;

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
async function fetchContractorJobDetail(
  apiUrl: string,
  apiKey: string,
  href: string,
): Promise<SimproContractorJobDetail | null> {
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
function transformContractorJob(
  detail: SimproContractorJobDetail,
  href: string,
) {
  return {
    simproContractorJobId: detail.ID,
    simproJobId: extractJobIdFromHref(href),

    contractorId: detail.Contractor?.ID ?? null,
    contractorName: detail.Contractor?.Name ?? null,
    contractorContact: detail.Contractor?.ContactName ?? null,
    contractorSupplyMaterials: detail.ContractorSupplyMaterials ?? null,

    projectType: detail.ProjectType ?? null,
    status: detail.Status ?? null,
    description: detail.Description ?? null,
    currency: detail.Currency ?? null,

    exchangeRate: detail.ExchangeRate ?? null,

    contractedAmount: null,

    totalExTax: detail.Total?.ExTax ?? null,
    totalIncTax: detail.Total?.IncTax ?? null,

    labor: detail.Labor ?? null,
    materials: detail.Materials ?? null,

    retentionAmount: detail.Retention?.Amount ?? null,
    retentionPerClaim: detail.Retention?.PerClaim ?? null,
    retentionPeriodMonths: detail.Retention?.PeriodMonths ?? null,

    reverseChargeTax: detail.Total?.ReverseChargeTax ?? null,

    taxCodeId: detail.TaxCode?.ID ?? null,
    taxCodeCode: detail.TaxCode?.Code ?? null,
    taxCodeRate: detail.TaxCode?.Rate ?? null,
    taxCodeType: detail.TaxCode?.Type ?? null,

    dateIssued: detail.DateIssued ? new Date(detail.DateIssued) : null,
    dueDate: detail.DueDate ? new Date(detail.DueDate) : null,
    dateModified: detail.DateModified ? new Date(detail.DateModified) : null,

    syncedAt: new Date(),
  };
}

// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportContractorJob(
  companyId: string,
  detail: SimproContractorJobDetail,
  href: string,
): Promise<void> {
  const data = transformContractorJob(detail, href);

  const existing = await prisma.reportContractorJob.findFirst({
    where: { companyId, simproContractorJobId: detail.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportContractorJob.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportContractorJob.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportContractorJobs(
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

  const list = await fetchContractorJobList(apiUrl, apiKey, simproCompanyId);

  result.fetched = list.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 500 });

  let processed = 0;

  await limiter.processBatch(list, async (item) => {
    const detail = await fetchContractorJobDetail(apiUrl, apiKey, item._href);

    if (!detail) {
      result.skipped++;
      processed++;
      onProgress?.(processed, result.fetched);
      return;
    }

    try {
      await upsertReportContractorJob(companyId, detail, item._href);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ id: item.ID, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
