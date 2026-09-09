"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportContractorJobs = syncReportContractorJobs;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// HELPERS
// =====================================================
function extractJobIdFromHref(href) {
    const match = href.match(/\/jobs\/(\d+)/);
    return match ? Number(match[1]) : null;
}
// =====================================================
// PHASE 1 — FETCH LIST
// =====================================================
async function fetchContractorJobList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorJobs/?page=${page}&pageSize=${pageSize}`;
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
// =====================================================
// PHASE 2 — FETCH DETAIL
// =====================================================
async function fetchContractorJobDetail(apiUrl, apiKey, href) {
    try {
        const res = await fetch(`${apiUrl}${href}`, {
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
function transformContractorJob(detail, href) {
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
async function upsertReportContractorJob(companyId, detail, href) {
    const data = transformContractorJob(detail, href);
    const existing = await prisma_1.prisma.reportContractorJob.findFirst({
        where: { companyId, simproContractorJobId: detail.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportContractorJob.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportContractorJob.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportContractorJobs(companyId, simproCompanyId, onProgress) {
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
    const list = await fetchContractorJobList(apiUrl, apiKey, simproCompanyId);
    result.fetched = list.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 500 });
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
        }
        catch (e) {
            result.errors.push({ id: item.ID, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
