import { prisma } from "../lib/prisma";
import { RateLimiter } from "../lib/rate-limiter";

/* =====================================================
   SIMPRO TYPES
===================================================== */

interface SimproContractorJobListItem {
  ID: number;
  _href: string;
}

interface SimproContractorJobDetail {
  ID: number;

  ProjectType?: string;
  Description?: string;
  Status?: string;

  Contractor?: {
    ID?: number;
    Name?: string;
    ContactName?: string;
  };

  CreatedBy?: {
    ID?: number;
    Name?: string;
    Type?: string;
    TypeId?: number;
  };

  ContractorSupplyMaterials?: boolean;
  Materials?: number;
  Labor?: number;

  Currency?: string;
  ExchangeRate?: number;

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

  DateIssued?: string;
  DueDate?: string;
  DateModified?: string;
}

/* =====================================================
   HELPERS
===================================================== */

function extractJobIdFromHref(href: string): number | null {
  const match = href.match(/\/jobs\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/* =====================================================
   FETCH LIST
===================================================== */

async function fetchContractorJobList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string
): Promise<SimproContractorJobListItem[]> {
  const results: SimproContractorJobListItem[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetch(
      `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorJobs/?page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      throw new Error(`Failed fetching contractor jobs (page ${page})`);
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
   FETCH DETAIL
===================================================== */

async function fetchContractorJobDetail(
  apiUrl: string,
  apiKey: string,
  href: string
): Promise<SimproContractorJobDetail> {
  const res = await fetch(`${apiUrl}${href}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error("Failed fetching contractor job detail");
  }

  return res.json();
}

/* =====================================================
   TRANSFORM
===================================================== */

function transformSimproContractorJob(job: SimproContractorJobDetail) {
  return {
    projectType: job.ProjectType ?? null,
    description: job.Description ?? null,
    status: job.Status ?? null,

    contractorId: job.Contractor?.ID ?? null,
    contractorName: job.Contractor?.Name ?? null,
    contractorContact: job.Contractor?.ContactName ?? null,

    createdById: job.CreatedBy?.ID ?? null,
    createdByName: job.CreatedBy?.Name ?? null,
    createdByType: job.CreatedBy?.Type ?? null,
    createdByTypeId: job.CreatedBy?.TypeId ?? null,

    contractorSupplyMaterials: job.ContractorSupplyMaterials ?? null,
    materials: job.Materials ?? null,
    labor: job.Labor ?? null,

    currency: job.Currency ?? null,
    exchangeRate: job.ExchangeRate ?? null,

    taxCodeId: job.TaxCode?.ID ?? null,
    taxCodeCode: job.TaxCode?.Code ?? null,
    taxCodeType: job.TaxCode?.Type ?? null,
    taxCodeRate: job.TaxCode?.Rate ?? null,

    retentionAmount: job.Retention?.Amount ?? null,
    retentionPerClaim: job.Retention?.PerClaim ?? null,
    retentionPeriodMonths: job.Retention?.PeriodMonths ?? null,

    totalExTax: job.Total?.ExTax ?? null,
    totalIncTax: job.Total?.IncTax ?? null,
    reverseChargeTax: job.Total?.ReverseChargeTax ?? null,

    dateIssued: job.DateIssued ? new Date(job.DateIssued) : null,
    dueDate: job.DueDate ? new Date(job.DueDate) : null,
    dateModified: job.DateModified ? new Date(job.DateModified) : null,

    lastSynced: new Date(),
  };
}

/* =====================================================
   UPSERT
===================================================== */

async function upsertContractorJob(
  companyId: string,
  detail: SimproContractorJobDetail,
  href: string
) {
  const extractedJobId = extractJobIdFromHref(href);

  let jobId: number | null = null;

  if (extractedJobId) {
    const exists = await prisma.job.findUnique({
      where: {
        id_companyId: {
          id: extractedJobId,
          companyId,
        },
      },
    });

    if (exists) {
      jobId = extractedJobId;
    }
  }

  const data = transformSimproContractorJob(detail);

  await prisma.contractorJob.upsert({
    where: {
      id: detail.ID,
    },
    update: {
      ...data,
      jobId,
      companyId,
    },
    create: {
      id: detail.ID,
      jobId,
      companyId,
      ...data,
    },
  });
}

/* =====================================================
   MAIN SYNC
===================================================== */

export async function syncContractorJobs(
  companyId: string,
  simproCompanyId: string
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
        provider: "Simpro",
      },
    },
  });

  if (!integration?.apiUrl || !integration.apiKey) {
    throw new Error("Missing Simpro integration");
  }

  const { apiUrl, apiKey } = integration;

  const list = await fetchContractorJobList(apiUrl, apiKey, simproCompanyId);
  result.fetched = list.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 400 });

  await limiter.processBatch(list, async (item) => {
    try {
      const detail = await fetchContractorJobDetail(apiUrl, apiKey, item._href);

      await upsertContractorJob(companyId, detail, item._href);
      result.updated++;
    } catch (e: any) {
      result.errors.push({ id: item.ID, error: e.message });
    }
  });

  result.durationMs = Date.now() - start;
  return result;
}
