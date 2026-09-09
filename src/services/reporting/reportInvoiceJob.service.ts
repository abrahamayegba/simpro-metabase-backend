import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproInvoiceListItem {
  ID: number;
}

interface SimproInvoiceDetail {
  ID: number;
  InvoiceNo?: string | null;
  Stage?: string | null;

  Status?: {
    ID?: number;
    Name?: string;
  } | null;

  Jobs?: Array<{
    ID: number;
  }>;
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ invoiceId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH INVOICE LIST
// =====================================================
async function fetchInvoiceList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproInvoiceListItem[]> {
  const results: SimproInvoiceListItem[] = [];

  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/?page=${page}&pageSize=${pageSize}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
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
// PHASE 2 — FETCH INVOICE DETAIL
// =====================================================
async function fetchInvoiceDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  invoiceId: number,
): Promise<SimproInvoiceDetail | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/${invoiceId}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

// =====================================================
// PHASE 3 — UPSERT INVOICE JOB
// =====================================================
async function upsertInvoiceJob(
  companyId: string,
  invoice: SimproInvoiceDetail,
  simproJobId: number,
): Promise<void> {
  const data = {
    simproInvoiceId: invoice.ID,
    simproJobId,

    invoiceNo: invoice.InvoiceNo ?? null,

    stage: invoice.Stage ?? null,
    status: invoice.Status?.Name ?? null,

    syncedAt: new Date(),
  };

  const existing = await prisma.reportInvoiceJob.findFirst({
    where: {
      companyId,
      simproInvoiceId: invoice.ID,
      simproJobId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    await prisma.reportInvoiceJob.update({
      where: {
        id: existing.id,
      },
      data,
    });
  } else {
    await prisma.reportInvoiceJob.create({
      data: {
        companyId,
        ...data,
      },
    });
  }
}

// =====================================================
// MAIN SYNC
// =====================================================
export async function syncReportInvoiceJobs(
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

  // Get invoice IDs
  const invoices = await fetchInvoiceList(apiUrl, apiKey, simproCompanyId);

  result.fetched = invoices.length;

  const limiter = new RateLimiter({
    concurrency: 5,
    delayMs: 300,
  });

  let processed = 0;

  await limiter.processBatch(invoices, async (invoiceItem) => {
    const invoice = await fetchInvoiceDetail(
      apiUrl,
      apiKey,
      simproCompanyId,
      invoiceItem.ID,
    );

    if (!invoice) {
      result.skipped++;

      processed++;

      onProgress?.(processed, result.fetched);

      return;
    }

    const jobs = invoice.Jobs ?? [];

    if (!jobs.length) {
      result.skipped++;

      processed++;

      onProgress?.(processed, result.fetched);

      return;
    }

    try {
      for (const job of jobs) {
        await upsertInvoiceJob(companyId, invoice, job.ID);
      }

      result.upserted++;
    } catch (e: any) {
      result.errors.push({
        invoiceId: invoice.ID,
        error: e.message,
      });
    }

    processed++;

    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;

  return result;
}
