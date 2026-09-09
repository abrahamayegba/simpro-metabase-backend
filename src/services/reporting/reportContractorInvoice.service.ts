import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

// =====================================================
// CONTRACTOR INVOICES
// =====================================================

interface SimproContractorInvoiceListItem {
  ID: number;
  InvoiceNo?: string | null;
  ContractorJobs?: number[];
}

interface SimproContractorInvoice {
  ID: number;
  InvoiceNo?: string | null;
  ContractorJobs?: number[];
  Currency?: string | null;
  ExchangeRate?: number | null;
  DateIssued?: string | null;
  DueDate?: string | null;
  DatePaid?: string | null;
  DateModified?: string | null;
  CISDeduction?: number | null;
  RCTDeduction?: number | null;

  Contractor?: {
    ID?: number;
    Name?: string;
  } | null;

  Total?: {
    ExTax?: number;
    IncTax?: number;
  } | null;
}

interface SyncContractorInvoicesResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ id: number; error: string }>;
  durationMs: number;
}

async function fetchContractorInvoiceList(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproContractorInvoiceListItem[]> {
  const results: SimproContractorInvoiceListItem[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorInvoices/?page=${page}&pageSize=${pageSize}`;

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

async function fetchContractorInvoiceDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  invoiceId: number,
): Promise<SimproContractorInvoice | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorInvoices/${invoiceId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

function transformContractorInvoice(invoice: SimproContractorInvoice) {
  return {
    simproContractorInvoiceId: invoice.ID,

    invoiceNo: invoice.InvoiceNo ?? null,

    contractorId: invoice.Contractor?.ID ?? null,
    contractorName: invoice.Contractor?.Name ?? null,

    contractorJobIds: invoice.ContractorJobs?.[0] ?? null,

    totalExTax: invoice.Total?.ExTax ?? null,
    totalIncTax: invoice.Total?.IncTax ?? null,

    currency: invoice.Currency ?? null,
    exchangeRate: invoice.ExchangeRate ?? null,

    isPaid: invoice.DatePaid ? true : false,

    cisDeduction: invoice.CISDeduction ?? null,
    rctDeduction: invoice.RCTDeduction ?? null,

    dateIssued: invoice.DateIssued ? new Date(invoice.DateIssued) : null,
    datePaid:
      invoice.DatePaid && invoice.DatePaid !== ""
        ? new Date(invoice.DatePaid)
        : null,
    dateApproved: null,
    dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
    dateModified: invoice.DateModified ? new Date(invoice.DateModified) : null,

    syncedAt: new Date(),
  };
}

async function upsertReportContractorInvoice(
  companyId: string,
  invoice: SimproContractorInvoice,
): Promise<void> {
  const data = transformContractorInvoice(invoice);

  const existing = await prisma.reportContractorInvoice.findFirst({
    where: { companyId, simproContractorInvoiceId: invoice.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportContractorInvoice.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportContractorInvoice.create({
      data: { companyId, ...data },
    });
  }
}

export async function syncReportContractorInvoices(
  companyId: string,
  simproCompanyId: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<SyncContractorInvoicesResult> {
  const start = Date.now();

  const result: SyncContractorInvoicesResult = {
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

  const list = await fetchContractorInvoiceList(
    apiUrl,
    apiKey,
    simproCompanyId,
  );

  result.fetched = list.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 300 });

  let processed = 0;

  await limiter.processBatch(list, async (listItem) => {
    const invoice = await fetchContractorInvoiceDetail(
      apiUrl,
      apiKey,
      simproCompanyId,
      listItem.ID,
    );

    if (!invoice) {
      result.skipped++;
      processed++;
      onProgress?.(processed, result.fetched);
      return;
    }

    try {
      await upsertReportContractorInvoice(companyId, invoice);
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
