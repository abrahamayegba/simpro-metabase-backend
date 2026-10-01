"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncJobCostCenters = syncJobCostCenters;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
/* =====================================================
   PHASE 1 — DISCOVER COST CENTER IDS
===================================================== */
async function fetchJobCostCenterList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const res = await fetch(`${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobCostCenters/?page=${page}&pageSize=${pageSize}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) {
            throw new Error(`Failed fetching job cost centers (page ${page})`);
        }
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
/* =====================================================
   PHASE 2 — FETCH COST CENTER DETAIL
===================================================== */
async function fetchJobCostCenterDetail(apiUrl, apiKey, href) {
    const res = await fetch(`${apiUrl}${href}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
        throw new Error(`Failed fetching job cost center detail`);
    }
    return res.json();
}
/* =====================================================
   TRANSFORM
===================================================== */
function transformSimproJobCostCenter(cc) {
    return {
        costCenterId: cc.CostCenter?.ID ?? null,
        costCenterName: cc.CostCenter?.Name ?? null,
        name: cc.Name ?? null,
        header: cc.Header ?? null,
        description: cc.Description ?? null,
        notes: cc.Notes ?? null,
        orderNo: cc.OrderNo ?? null,
        siteId: cc.Site?.ID ?? null,
        siteName: cc.Site?.Name ?? null,
        stage: cc.Stage ?? null,
        autoAdjustDates: cc.AutoAdjustDates ?? null,
        displayOrder: cc.DisplayOrder ?? null,
        variation: cc.Variation ?? null,
        variationApprovalDate: cc.VariationApprovalDate
            ? new Date(cc.VariationApprovalDate)
            : null,
        itemsLocked: cc.ItemsLocked ?? null,
        lockedType: cc.LockedInfo?.Type ?? null,
        lockedIsLocked: cc.LockedInfo?.IsLocked ?? null,
        startDate: cc.StartDate ? new Date(cc.StartDate) : null,
        endDate: cc.EndDate ? new Date(cc.EndDate) : null,
        totalExTax: cc.Total?.ExTax ?? null,
        totalTax: cc.Total?.Tax ?? null,
        totalIncTax: cc.Total?.IncTax ?? null,
        taxCodeId: cc.Total?.TaxCode?.ID ?? null,
        taxCodeCode: cc.Total?.TaxCode?.Code ?? null,
        taxCodeType: cc.Total?.TaxCode?.Type ?? null,
        taxCodeRate: cc.Total?.TaxCode?.Rate ?? null,
        claimedPercentToDate: cc.Claimed?.ToDate?.Percent ?? null,
        claimedExTaxToDate: cc.Claimed?.ToDate?.Amount?.ExTax ?? null,
        claimedIncTaxToDate: cc.Claimed?.ToDate?.Amount?.IncTax ?? null,
        claimedPercentRemaining: cc.Claimed?.Remaining?.Percent ?? null,
        claimedExTaxRemaining: cc.Claimed?.Remaining?.Amount?.ExTax ?? null,
        claimedIncTaxRemaining: cc.Claimed?.Remaining?.Amount?.IncTax ?? null,
        percentComplete: typeof cc.PercentComplete === "number"
            ? cc.PercentComplete
            : cc.PercentComplete
                ? Number(cc.PercentComplete)
                : null,
        dateModified: cc.DateModified ? new Date(cc.DateModified) : null,
        lastSynced: new Date(),
    };
}
/* =====================================================
   UPSERT
===================================================== */
async function upsertJobCostCenter(companyId, detail) {
    const data = transformSimproJobCostCenter(detail);
    await prisma_1.prisma.jobCostCenter.upsert({
        where: {
            id_jobId_companyId: {
                id: detail.ID,
                jobId: detail.JobID,
                companyId,
            },
        },
        update: {
            ...data,
            jobId: detail.JobID, // store it even if job table doesn't have it
        },
        create: {
            id: detail.ID,
            jobId: detail.JobID,
            companyId,
            ...data,
        },
    });
}
/* =====================================================
   MAIN ORCHESTRATOR
===================================================== */
async function syncJobCostCenters(companyId, simproCompanyId) {
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
    const list = await fetchJobCostCenterList(apiUrl, apiKey, simproCompanyId);
    result.fetched = list.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 400 });
    await limiter.processBatch(list, async (item) => {
        try {
            const detail = await fetchJobCostCenterDetail(apiUrl, apiKey, item._href);
            await upsertJobCostCenter(companyId, detail);
            result.updated++;
        }
        catch (e) {
            result.errors.push({ id: item.ID, error: e.message });
        }
    });
    result.durationMs = Date.now() - start;
    return result;
}
