"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportContractorInvoices = syncReportContractorInvoices;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
async function fetchContractorInvoiceList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorInvoices/?page=${page}&pageSize=${pageSize}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok)
            break;
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items ?? []);
        if (!items.length)
            break;
        results.push(...items);
        if (items.length < pageSize)
            break;
        page++;
    }
    return results;
}
async function fetchContractorInvoiceDetail(apiUrl, apiKey, simproCompanyId, invoiceId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorInvoices/${invoiceId}`;
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
function transformContractorInvoice(invoice) {
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
        datePaid: invoice.DatePaid && invoice.DatePaid !== ""
            ? new Date(invoice.DatePaid)
            : null,
        dateApproved: null,
        dueDate: invoice.DueDate ? new Date(invoice.DueDate) : null,
        dateModified: invoice.DateModified ? new Date(invoice.DateModified) : null,
        syncedAt: new Date(),
    };
}
async function upsertReportContractorInvoice(companyId, invoice) {
    const data = transformContractorInvoice(invoice);
    const existing = await prisma_1.prisma.reportContractorInvoice.findFirst({
        where: { companyId, simproContractorInvoiceId: invoice.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportContractorInvoice.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportContractorInvoice.create({
            data: { companyId, ...data },
        });
    }
}
async function syncReportContractorInvoices(companyId, simproCompanyId, onProgress) {
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
    const list = await fetchContractorInvoiceList(apiUrl, apiKey, simproCompanyId);
    result.fetched = list.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 300 });
    let processed = 0;
    await limiter.processBatch(list, async (listItem) => {
        const invoice = await fetchContractorInvoiceDetail(apiUrl, apiKey, simproCompanyId, listItem.ID);
        if (!invoice) {
            result.skipped++;
            processed++;
            onProgress?.(processed, result.fetched);
            return;
        }
        try {
            await upsertReportContractorInvoice(companyId, invoice);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ id: listItem.ID, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
