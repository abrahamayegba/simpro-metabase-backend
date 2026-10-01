"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportJobCostCentres = syncReportJobCostCentres;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH LIST
// =====================================================
async function fetchJobCostCentreList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobCostCenters/?page=${page}&pageSize=${pageSize}`;
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
async function fetchJobCostCentreDetail(apiUrl, apiKey, href) {
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
function transformJobCostCentre(detail, listItem) {
    return {
        simproJobCostCentreId: detail.ID,
        simproJobId: detail.JobID ?? listItem.Job?.ID ?? null,
        simproSiteId: detail.Site?.ID ?? null,
        siteName: detail.Site?.Name ?? null,
        costCentreId: detail.CostCenter?.ID ?? null,
        costCentreName: detail.CostCenter?.Name ?? null,
        name: detail.Name ?? null,
        header: detail.Header ?? null,
        description: detail.Description ?? null,
        notes: detail.Notes ?? null,
        orderNo: detail.OrderNo ?? null,
        stage: detail.Stage ?? null,
        type: null,
        displayOrder: detail.DisplayOrder ?? null,
        variation: detail.Variation ?? null,
        variationApprovalDate: detail.VariationApprovalDate
            ? new Date(detail.VariationApprovalDate)
            : null,
        totalExTax: detail.Total?.ExTax ?? null,
        totalIncTax: detail.Total?.IncTax ?? null,
        totalTax: detail.Total?.Tax ?? null,
        discount: detail.Totals?.Discount ?? null,
        invoicedValue: detail.Totals?.InvoicedValue ?? null,
        invoicePercentage: detail.Totals?.InvoicePercentage ?? null,
        claimedExTaxToDate: detail.Claimed?.ToDate?.Amount?.ExTax ?? null,
        claimedIncTaxToDate: detail.Claimed?.ToDate?.Amount?.IncTax ?? null,
        claimedPercentToDate: detail.Claimed?.ToDate?.Percent ?? null,
        laborActual: detail.Totals?.ResourcesCost?.Labor?.Actual ?? null,
        laborEstimate: detail.Totals?.ResourcesCost?.Labor?.Estimate ?? null,
        laborHoursActual: detail.Totals?.ResourcesCost?.LaborHours?.Actual ?? null,
        laborHoursEstimate: detail.Totals?.ResourcesCost?.LaborHours?.Estimate ?? null,
        materialsCostActual: detail.Totals?.MaterialsCost?.Actual ?? null,
        materialsCostEstimate: detail.Totals?.MaterialsCost?.Estimate ?? null,
        grossProfitActual: detail.Totals?.GrossProfitLoss?.Actual ?? null,
        grossMarginActual: detail.Totals?.GrossMargin?.Actual ?? null,
        startDate: detail.StartDate ? new Date(detail.StartDate) : null,
        endDate: detail.EndDate ? new Date(detail.EndDate) : null,
        dateModified: detail.DateModified ? new Date(detail.DateModified) : null,
        syncedAt: new Date(),
    };
}
// =====================================================
// PHASE 4 — UPSERT
// =====================================================
async function upsertReportJobCostCentre(companyId, detail, listItem) {
    const data = transformJobCostCentre(detail, listItem);
    const existing = await prisma_1.prisma.reportJobCostCentre.findFirst({
        where: { companyId, simproJobCostCentreId: detail.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportJobCostCentre.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportJobCostCentre.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportJobCostCentres(companyId, simproCompanyId, onProgress) {
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
    const list = await fetchJobCostCentreList(apiUrl, apiKey, simproCompanyId);
    result.fetched = list.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 300 });
    let processed = 0;
    await limiter.processBatch(list, async (listItem) => {
        const detail = await fetchJobCostCentreDetail(apiUrl, apiKey, listItem._href);
        if (!detail) {
            result.skipped++;
            processed++;
            onProgress?.(processed, result.fetched);
            return;
        }
        try {
            await upsertReportJobCostCentre(companyId, detail, listItem);
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
