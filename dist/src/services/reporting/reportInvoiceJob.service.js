"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportInvoiceJobs = syncReportInvoiceJobs;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH INVOICE LIST
// =====================================================
async function fetchInvoiceList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/?page=${page}&pageSize=${pageSize}`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
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
// =====================================================
// PHASE 2 — FETCH INVOICE DETAIL
// =====================================================
async function fetchInvoiceDetail(apiUrl, apiKey, simproCompanyId, invoiceId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/invoices/${invoiceId}`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
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
// PHASE 3 — UPSERT INVOICE JOB
// =====================================================
async function upsertInvoiceJob(companyId, invoice, simproJobId) {
    const data = {
        simproInvoiceId: invoice.ID,
        simproJobId,
        invoiceNo: invoice.InvoiceNo ?? null,
        stage: invoice.Stage ?? null,
        status: invoice.Status?.Name ?? null,
        syncedAt: new Date(),
    };
    const existing = await prisma_1.prisma.reportInvoiceJob.findFirst({
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
        await prisma_1.prisma.reportInvoiceJob.update({
            where: {
                id: existing.id,
            },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportInvoiceJob.create({
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
async function syncReportInvoiceJobs(companyId, simproCompanyId, onProgress) {
    const start = Date.now();
    const result = {
        fetched: 0,
        upserted: 0,
        skipped: 0,
        errors: [],
        durationMs: 0,
    };
    const integration = await prisma_1.prisma.integration.findUnique({
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
    const limiter = new rate_limiter_1.RateLimiter({
        concurrency: 5,
        delayMs: 300,
    });
    let processed = 0;
    await limiter.processBatch(invoices, async (invoiceItem) => {
        const invoice = await fetchInvoiceDetail(apiUrl, apiKey, simproCompanyId, invoiceItem.ID);
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
        }
        catch (e) {
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
