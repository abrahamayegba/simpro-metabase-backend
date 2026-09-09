"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportInvoices = syncReportInvoices;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH INVOICE IDS
// =====================================================
async function fetchInvoiceIds(apiUrl, apiKey, simproCompanyId) {
    const ids = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/?page=${page}&pageSize=${pageSize}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok)
            break;
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items ?? []);
        if (!items.length)
            break;
        for (const item of items) {
            if (item.ID)
                ids.push(item.ID);
        }
        if (items.length < pageSize)
            break;
        page++;
    }
    return ids;
}
// =====================================================
// PHASE 2 — FETCH INVOICE DETAIL
// =====================================================
async function fetchInvoiceDetail(apiUrl, apiKey, simproCompanyId, invoiceId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/${invoiceId}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok)
            return null;
        return res.json();
    }
    catch {
        return null;
    }
}
// =====================================================
// PHASE 3 — TRANSFORM
// =====================================================
function transformInvoice(invoice) {
    const retentionExTax = invoice.Retainage?.reduce((sum, r) => sum + (r.ExTax ?? 0), 0) ?? null;
    const retentionIncTax = invoice.Retainage?.reduce((sum, r) => sum + (r.IncTax ?? 0), 0) ?? null;
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
async function upsertReportInvoice(companyId, invoice) {
    const data = transformInvoice(invoice);
    const existing = await prisma_1.prisma.reportInvoice.findFirst({
        where: { companyId, invoiceNo: String(invoice.ID) },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportInvoice.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportInvoice.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportInvoices(companyId, simproCompanyId, onProgress) {
    const start = Date.now();
    const result = {
        fetched: 0,
        upserted: 0,
        skipped: 0,
        errors: [],
        durationMs: 0,
    };
    const integration = await prisma_1.prisma.integration.findUnique({
        where: { companyId_provider: { companyId, provider: "Simpro" } },
    });
    if (!integration?.apiUrl || !integration?.apiKey) {
        throw new Error("Missing Simpro integration");
    }
    const { apiUrl, apiKey } = integration;
    const ids = await fetchInvoiceIds(apiUrl, apiKey, simproCompanyId);
    result.fetched = ids.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 300 });
    let processed = 0;
    await limiter.processBatch(ids, async (id) => {
        const invoice = await fetchInvoiceDetail(apiUrl, apiKey, simproCompanyId, id);
        if (!invoice) {
            result.skipped++;
            processed++;
            onProgress?.(processed, result.fetched);
            return;
        }
        try {
            await upsertReportInvoice(companyId, invoice);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ invoiceId: id, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
