import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproInvoiceListItem {
  ID: number;
}

interface SimproInvoice {
  ID: number;
  InternalID?: number | null;
  Type?: string | null;
  Stage?: string | null;
  PerItem?: boolean | null;
  IsPaid?: boolean | null;
  IsRetainage?: boolean | null;
  DateIssued?: string | null;
  DatePaid?: string | null;
  DateCreated?: string | null;
  DateModified?: string | null;

  Customer?: {
    ID?: number;
    CompanyName?: string;
  } | null;

  Jobs?: Array<{ ID: number }> | null;

  RecurringInvoice?: {
    ID?: number;
  } | null;

  Period?: {
    StartDate?: string;
    EndDate?: string;
  } | null;

  PaymentTerms?: {
    DueDate?: string;
  } | null;

  Status?: {
    ID?: number;
    Name?: string;
  } | null;

  Description?: string | null;

  Total?: {
    ExTax?: number;
    IncTax?: number;
    Tax?: number;
  } | null;

  Retainage?: Array<{
    JobID?: number;
    ExTax?: number;
    IncTax?: number;
  }> | null;
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ invoiceId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH INVOICE IDS
// =====================================================
async function fetchInvoiceIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/?page=${page}&pageSize=${pageSize}`;

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
// PHASE 2 — FETCH INVOICE DETAIL
// =====================================================
async function fetchInvoiceDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  invoiceId: number,
): Promise<SimproInvoice | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/${invoiceId}`;

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
function transformInvoice(invoice: SimproInvoice) {
  const retentionExTax =
    invoice.Retainage?.reduce((sum, r) => sum + (r.ExTax ?? 0), 0) ?? null;
  const retentionIncTax =
    invoice.Retainage?.reduce((sum, r) => sum + (r.IncTax ?? 0), 0) ?? null;

  return {
    simproInvoiceId: invoice.InternalID ?? null,
    invoiceNo: String(invoice.ID),

    invoiceType: invoice.Type ?? null,

    simproCustomerId: invoice.Customer?.ID ?? null,
    customerName: invoice.Customer?.CompanyName ?? null,

    simproJobId: invoice.Jobs?.[0]?.ID ?? null,
    recurringInvoiceId: invoice.RecurringInvoice?.ID ?? null,
    customerContractId: null,

    claimNo: null,
    stage: invoice.Stage ?? null,

    description: invoice.Description ?? null,

    totalExTax: invoice.Total?.ExTax ?? null,
    totalIncTax: invoice.Total?.IncTax ?? null,
    totalDiscount: null,
    totalRetentionExTax: retentionExTax,
    totalRetentionIncTax: retentionIncTax,

    isCredit: invoice.Type === "CreditNote" ? true : null,
    isRecurring: invoice.RecurringInvoice != null ? true : null,
    isVoided: null,
    perItem: invoice.PerItem ?? null,

    dateIssued: invoice.DateIssued ? new Date(invoice.DateIssued) : null,
    periodStart: invoice.Period?.StartDate
      ? new Date(invoice.Period.StartDate)
      : null,
    periodEnd: invoice.Period?.EndDate
      ? new Date(invoice.Period.EndDate)
      : null,
    dueDate: invoice.PaymentTerms?.DueDate
      ? new Date(invoice.PaymentTerms.DueDate)
      : null,

    dateCreated: invoice.DateCreated ? new Date(invoice.DateCreated) : null,
    dateModified: invoice.DateModified ? new Date(invoice.DateModified) : null,

    syncedAt: new Date(),
  };
}

// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportInvoice(
  companyId: string,
  invoice: SimproInvoice,
): Promise<void> {
  const data = transformInvoice(invoice);

  const existing = await prisma.reportInvoice.findFirst({
    where: { companyId, invoiceNo: String(invoice.ID) },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportInvoice.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportInvoice.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportInvoices(
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

  const ids = await fetchInvoiceIds(apiUrl, apiKey, simproCompanyId);

  result.fetched = ids.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 300 });

  let processed = 0;

  await limiter.processBatch(ids, async (id: number) => {
    const invoice = await fetchInvoiceDetail(
      apiUrl,
      apiKey,
      simproCompanyId,
      id,
    );

    if (!invoice) {
      result.skipped++;
      processed++;
      onProgress?.(processed, result.fetched);
      return;
    }

    try {
      await upsertReportInvoice(companyId, invoice);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ invoiceId: id, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
