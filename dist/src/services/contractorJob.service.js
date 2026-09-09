"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncContractorJobs = syncContractorJobs;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
/* =====================================================
   HELPERS
===================================================== */
function extractJobIdFromHref(href) {
    const match = href.match(/\/jobs\/(\d+)/);
    return match ? Number(match[1]) : null;
}
/* =====================================================
   FETCH LIST
===================================================== */
async function fetchContractorJobList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const res = await fetch(`${apiUrl}/api/v1.0/companies/${simproCompanyId}/contractorJobs/?page=${page}&pageSize=${pageSize}`, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!res.ok) {
            throw new Error(`Failed fetching contractor jobs (page ${page})`);
        }
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items ?? [];
        if (!items.length)
            break;
        results.push(...items);
        if (items.length < pageSize)
            break;
        page++;
    }
    return results;
}
/* =====================================================
   FETCH DETAIL
===================================================== */
async function fetchContractorJobDetail(apiUrl, apiKey, href) {
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
function transformSimproContractorJob(job) {
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
async function upsertContractorJob(companyId, detail, href) {
    const extractedJobId = extractJobIdFromHref(href);
    let jobId = null;
    if (extractedJobId) {
        const exists = await prisma_1.prisma.job.findUnique({
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
    await prisma_1.prisma.contractorJob.upsert({
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
async function syncContractorJobs(companyId, simproCompanyId) {
    const start = Date.now();
    const result = {
        fetched: 0,
        updated: 0,
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
    const list = await fetchContractorJobList(apiUrl, apiKey, simproCompanyId);
    result.fetched = list.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 500 });
    await limiter.processBatch(list, async (item) => {
        try {
            const detail = await fetchContractorJobDetail(apiUrl, apiKey, item._href);
            await upsertContractorJob(companyId, detail, item._href);
            result.updated++;
        }
        catch (e) {
            result.errors.push({ id: item.ID, error: e.message });
        }
    });
    result.durationMs = Date.now() - start;
    return result;
}
