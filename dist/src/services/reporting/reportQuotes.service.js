"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportQuotes = syncReportQuotes;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH QUOTE IDS
// =====================================================
async function fetchQuoteIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/quotes/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
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
// PHASE 2 — FETCH QUOTE DETAIL
// =====================================================
async function fetchQuoteDetail(apiUrl, apiKey, simproCompanyId, quoteId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/quotes/${quoteId}`;
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
function transformQuote(quote, archived) {
    return {
        simproQuoteId: quote.ID,
        reference: quote.Name ?? null,
        name: quote.Name ?? null,
        description: quote.Description ?? null,
        notes: quote.Notes ?? null,
        orderNo: quote.OrderNo ?? null,
        requestNo: quote.RequestNo ?? null,
        simproCustomerId: quote.Customer?.ID ?? null,
        customerName: quote.Customer?.CompanyName ?? null,
        customerGivenName: quote.Customer?.GivenName ?? null,
        customerFamilyName: quote.Customer?.FamilyName ?? null,
        customerStage: quote.CustomerStage ?? null,
        customerContactId: quote.CustomerContact?.ID ?? null,
        customerContactGivenName: quote.CustomerContact?.GivenName ?? null,
        customerContactFamilyName: quote.CustomerContact?.FamilyName ?? null,
        simproSiteId: quote.Site?.ID ?? null,
        siteName: quote.Site?.Name ?? null,
        siteContactId: quote.SiteContact?.ID ?? null,
        siteContactGivenName: quote.SiteContact?.GivenName ?? null,
        siteContactFamilyName: quote.SiteContact?.FamilyName ?? null,
        simproJobId: typeof quote.LinkedJobID === "number" ? quote.LinkedJobID : null,
        jobNo: quote.JobNo ? String(quote.JobNo) : null,
        linkedJobId: typeof quote.LinkedJobID === "number" ? quote.LinkedJobID : null,
        stage: quote.Stage ?? null,
        statusId: quote.Status?.ID ?? null,
        statusName: quote.Status?.Name ?? null,
        statusColor: quote.Status?.Color ?? null,
        type: quote.Type ?? null,
        isVariation: quote.IsVariation ?? null,
        isClosed: quote.IsClosed ?? null,
        validityDays: quote.ValidityDays ?? null,
        technicianId: quote.Technician?.ID ?? null,
        technicianName: quote.Technician?.Name ?? null,
        projectManagerId: quote.ProjectManager?.ID ?? null,
        projectManagerName: quote.ProjectManager?.Name ?? null,
        salespersonId: quote.Salesperson?.ID ?? null,
        salespersonName: quote.Salesperson?.Name ?? null,
        archiveReasonId: quote.ArchiveReason?.ID ?? null,
        archiveReasonName: quote.ArchiveReason?.ArchiveReason ?? null,
        convertedToJob: typeof quote.LinkedJobID === "number" && quote.LinkedJobID > 0,
        convertedFromLeadId: quote.ConvertedFromLead?.ID ?? null,
        convertedFromLeadName: quote.ConvertedFromLead?.LeadName ?? null,
        totalExTax: quote.Total?.ExTax ?? null,
        totalTax: quote.Total?.Tax ?? null,
        totalIncTax: quote.Total?.IncTax ?? null,
        discount: quote.Totals?.Discount ?? null,
        forecastMonth: quote.Forecast?.Month ?? null,
        forecastYear: quote.Forecast?.Year ?? null,
        forecastPercent: quote.Forecast?.Percent ?? null,
        laborEstimate: quote.Totals?.ResourcesCost?.Labor?.Estimate ?? null,
        laborHoursEstimate: quote.Totals?.ResourcesCost?.LaborHours?.Estimate ?? null,
        materialsCostEstimate: quote.Totals?.MaterialsCost?.Estimate ?? null,
        dueDate: quote.DueDate ? new Date(quote.DueDate) : null,
        dateIssued: quote.DateIssued ? new Date(quote.DateIssued) : null,
        dateSent: quote.DateSent ? new Date(quote.DateSent) : null,
        dateAccepted: quote.DateAccepted ? new Date(quote.DateAccepted) : null,
        dateApproved: quote.DateApproved ? new Date(quote.DateApproved) : null,
        dateExpires: quote.DateExpires ? new Date(quote.DateExpires) : null,
        dateCreated: quote.DateCreated ? new Date(quote.DateCreated) : null,
        dateModified: quote.DateModified ? new Date(quote.DateModified) : null,
        syncedAt: new Date(),
    };
}
// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportQuote(companyId, quote, archived) {
    const data = transformQuote(quote, archived);
    const existing = await prisma_1.prisma.reportQuote.findFirst({
        where: { companyId, simproQuoteId: quote.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportQuote.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportQuote.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportQuotes(companyId, simproCompanyId, onProgress) {
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
    const [activeIds, archivedIds] = await Promise.all([
        fetchQuoteIds(apiUrl, apiKey, simproCompanyId, false),
        fetchQuoteIds(apiUrl, apiKey, simproCompanyId, true),
    ]);
    const activeSet = new Set(activeIds);
    const uniqueArchivedIds = archivedIds.filter((id) => !activeSet.has(id));
    const allIds = [
        ...activeIds.map((id) => ({ id, archived: false })),
        ...uniqueArchivedIds.map((id) => ({ id, archived: true })),
    ];
    result.fetched = allIds.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 500 });
    let processed = 0;
    await limiter.processBatch(allIds, async ({ id, archived }) => {
        const quote = await fetchQuoteDetail(apiUrl, apiKey, simproCompanyId, id);
        if (!quote) {
            result.skipped++;
            return;
        }
        try {
            await upsertReportQuote(companyId, quote, archived);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ quoteId: id, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
