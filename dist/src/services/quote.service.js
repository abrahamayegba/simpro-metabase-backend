"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncQuotes = syncQuotes;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
async function fetchQuoteIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = new Set();
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/quotes/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) {
            throw new Error(`Failed fetching quotes (page ${page}): ${res.status}`);
        }
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items ?? [];
        if (!items.length)
            break;
        for (const item of items) {
            if (item.ID)
                ids.add(item.ID);
        }
        if (items.length < pageSize)
            break;
        page++;
    }
    return [...ids];
}
async function fetchQuoteDetail(apiUrl, apiKey, simproCompanyId, quoteId) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/quotes/${quoteId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
        throw new Error(`Failed fetching quote ${quoteId}: ${res.status}`);
    }
    return res.json();
}
function transformSimproQuote(quote) {
    return {
        reference: quote.Reference ?? null,
        name: quote.Name ?? null,
        description: quote.Description ?? null,
        notes: quote.Notes ?? null,
        type: quote.Type ?? null,
        customerName: quote.Customer?.CompanyName ?? null,
        customerGivenName: quote.Customer?.GivenName ?? null,
        customerFamilyName: quote.Customer?.FamilyName ?? null,
        customerContactId: quote.CustomerContact?.ID ?? null,
        customerContactGivenName: quote.CustomerContact?.GivenName ?? null,
        customerContactFamilyName: quote.CustomerContact?.FamilyName ?? null,
        siteName: quote.Site?.Name ?? null,
        siteContactId: quote.SiteContact?.ID ?? null,
        siteContactGivenName: quote.SiteContact?.GivenName ?? null,
        siteContactFamilyName: quote.SiteContact?.FamilyName ?? null,
        convertedFromLeadId: quote.ConvertedFromLead?.ID ?? null,
        convertedFromLeadName: quote.ConvertedFromLead?.Name ?? null,
        convertedFromLeadDateCreated: quote.ConvertedFromLead?.DateCreated
            ? new Date(quote.ConvertedFromLead.DateCreated)
            : null,
        salespersonId: quote.Salesperson?.ID ?? null,
        salespersonName: quote.Salesperson?.Name ?? null,
        salespersonType: quote.Salesperson?.Type ?? null,
        salespersonTypeId: quote.Salesperson?.TypeId ?? null,
        projectManagerId: quote.ProjectManager?.ID ?? null,
        projectManagerName: quote.ProjectManager?.Name ?? null,
        projectManagerType: quote.ProjectManager?.Type ?? null,
        projectManagerTypeId: quote.ProjectManager?.TypeId ?? null,
        technicianId: quote.Technician?.ID ?? null,
        technicianName: quote.Technician?.Name ?? null,
        technicianType: quote.Technician?.Type ?? null,
        technicianTypeId: quote.Technician?.TypeId ?? null,
        dateIssued: quote.DateIssued ? new Date(quote.DateIssued) : null,
        dateApproved: quote.DateApproved ? new Date(quote.DateApproved) : null,
        dueDate: quote.DueDate ? new Date(quote.DueDate) : null,
        dateCreated: quote.DateCreated ? new Date(quote.DateCreated) : null,
        dateSent: quote.DateSent ? new Date(quote.DateSent) : null,
        dateAccepted: quote.DateAccepted ? new Date(quote.DateAccepted) : null,
        dateExpires: quote.DateExpires ? new Date(quote.DateExpires) : null,
        dateModified: quote.DateModified ? new Date(quote.DateModified) : null,
        validityDays: quote.ValidityDays ?? null,
        orderNo: quote.OrderNo ?? null,
        requestNo: quote.RequestNo ?? null,
        statusId: quote.Status?.ID ?? null,
        statusName: quote.Status?.Name ?? null,
        statusColor: quote.Status?.Color ?? null,
        stage: quote.Stage ?? null,
        customerStage: quote.CustomerStage ?? null,
        isClosed: quote.IsClosed ?? null,
        isVariation: quote.IsVariation ?? null,
        archiveReasonId: quote.ArchiveReason?.ID ?? null,
        archiveReasonName: quote.ArchiveReason?.Name ?? null,
        linkedJobId: typeof quote.LinkedJobID === "number" ? quote.LinkedJobID : null,
        jobNo: quote.JobNo !== null && quote.JobNo !== undefined
            ? String(quote.JobNo)
            : null,
        forecastYear: quote.Forecast?.Year ?? null,
        forecastMonth: quote.Forecast?.Month ?? null,
        forecastPercent: quote.Forecast?.Percent ?? null,
        totalExTax: quote.Total?.ExTax ?? null,
        totalTax: quote.Total?.Tax ?? null,
        totalIncTax: quote.Total?.IncTax ?? null,
        materialsCostEstimate: quote.Totals?.MaterialsCost?.Estimate ?? null,
        materialsCostRevised: quote.Totals?.MaterialsCost?.Revised ?? null,
        laborEstimate: quote.Totals?.ResourcesCost?.Labor?.Estimate ?? null,
        laborRevised: quote.Totals?.ResourcesCost?.Labor?.Revised ?? null,
        laborHoursEstimate: quote.Totals?.ResourcesCost?.LaborHours?.Estimate ?? null,
        laborHoursRevised: quote.Totals?.ResourcesCost?.LaborHours?.Revised ?? null,
        commissionEstimate: quote.Totals?.ResourcesCost?.Commission?.Estimate ?? null,
        commissionRevised: quote.Totals?.ResourcesCost?.Commission?.Revised ?? null,
        overheadEstimate: quote.Totals?.ResourcesCost?.Overhead?.Estimate ?? null,
        overheadRevised: quote.Totals?.ResourcesCost?.Overhead?.Revised ?? null,
        stcsEligible: quote.STC?.STCsEligible ?? null,
        veecsEligible: quote.STC?.VEECsEligible ?? null,
        stcValue: quote.STC?.STCValue ?? null,
        veecValue: quote.STC?.VEECValue ?? null,
        lastSynced: new Date(),
    };
}
async function upsertQuote(companyId, quote, archived) {
    const data = transformSimproQuote(quote);
    // -------------------------------
    // SAFE CUSTOMER FK
    // -------------------------------
    let customerId = null;
    if (quote.Customer?.ID) {
        const exists = await prisma_1.prisma.customer.findUnique({
            where: {
                id_companyId: {
                    id: quote.Customer.ID,
                    companyId,
                },
            },
        });
        if (exists) {
            customerId = quote.Customer.ID;
        }
    }
    let siteId = null;
    if (quote.Site?.ID) {
        const siteExists = await prisma_1.prisma.site.findUnique({
            where: {
                id_companyId: {
                    id: quote.Site.ID,
                    companyId,
                },
            },
        });
        if (siteExists) {
            siteId = quote.Site.ID;
        }
    }
    await prisma_1.prisma.quote.upsert({
        where: {
            id_companyId: {
                id: quote.ID,
                companyId,
            },
        },
        update: {
            ...data,
            customerId,
            siteId,
            convertedToJob: Boolean(quote.LinkedJobID),
        },
        create: {
            id: quote.ID,
            companyId,
            ...data,
            customerId,
            siteId,
            convertedToJob: Boolean(quote.LinkedJobID),
        },
    });
}
async function syncQuotes(companyId, simproCompanyId, includeArchived = false) {
    const start = Date.now();
    const result = {
        fetched: 0,
        updated: 0,
        archived: 0,
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
    const activeIds = await fetchQuoteIds(apiUrl, apiKey, simproCompanyId, false);
    const archivedIds = includeArchived
        ? await fetchQuoteIds(apiUrl, apiKey, simproCompanyId, true)
        : [];
    result.fetched = activeIds.length + archivedIds.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 400 });
    const activeQuotes = await limiter.processBatch(activeIds, (id) => fetchQuoteDetail(apiUrl, apiKey, simproCompanyId, id));
    const archivedQuotes = includeArchived
        ? await limiter.processBatch(archivedIds, (id) => fetchQuoteDetail(apiUrl, apiKey, simproCompanyId, id))
        : [];
    for (const quote of activeQuotes) {
        try {
            await upsertQuote(companyId, quote, false);
            result.updated++;
        }
        catch (e) {
            result.errors.push({ quoteId: quote.ID, error: e.message });
        }
    }
    for (const quote of archivedQuotes) {
        try {
            await upsertQuote(companyId, quote, true);
            result.archived++;
        }
        catch (e) {
            result.errors.push({ quoteId: quote.ID, error: e.message });
        }
    }
    result.durationMs = Date.now() - start;
    return result;
}
