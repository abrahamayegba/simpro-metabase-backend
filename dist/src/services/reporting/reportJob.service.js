"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportJobs = syncReportJobs;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH JOB IDS
// =====================================================
async function fetchJobIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobs/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
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
// PHASE 2 — FETCH JOB DETAIL
// =====================================================
async function fetchJobDetail(apiUrl, apiKey, simproCompanyId, jobId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobs/${jobId}`;
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
function transformJob(job, archived) {
    const accountManagerComments = job.CustomFields?.find((cf) => cf.CustomField?.Name === "Account Manager Comments")?.Value ?? null;
    return {
        simproJobId: job.ID,
        reference: job.OrderNo ?? null,
        name: job.Name ?? null,
        description: job.Description ?? null,
        notes: job.Notes ?? null,
        orderNo: job.OrderNo ?? null,
        requestNo: job.RequestNo ?? null,
        simproCustomerId: job.Customer?.ID ?? null,
        customerName: job.Customer?.CompanyName ?? null,
        customerGivenName: job.Customer?.GivenName ?? null,
        customerFamilyName: job.Customer?.FamilyName ?? null,
        customerContactId: job.CustomerContact?.ID ?? null,
        customerContactGivenName: job.CustomerContact?.GivenName ?? null,
        customerContactFamilyName: job.CustomerContact?.FamilyName ?? null,
        customerContractId: job.CustomerContract?.ID ?? null,
        customerContractName: job.CustomerContract?.Name ?? null,
        customerContractNo: job.CustomerContract?.ContractNo ?? null,
        customerContractStartDate: job.CustomerContract?.StartDate
            ? new Date(job.CustomerContract.StartDate)
            : null,
        customerContractEndDate: job.CustomerContract?.EndDate
            ? new Date(job.CustomerContract.EndDate)
            : null,
        simproSiteId: job.Site?.ID ?? null,
        siteName: job.Site?.Name ?? null,
        siteContactId: job.SiteContact?.ID ?? null,
        siteContactGivenName: job.SiteContact?.GivenName ?? null,
        siteContactFamilyName: job.SiteContact?.FamilyName ?? null,
        stage: job.Stage ?? null,
        statusId: job.Status?.ID ?? null,
        statusName: job.Status?.Name ?? null,
        statusColor: job.Status?.Color ?? null,
        jobType: job.Type ?? null,
        type: job.Type ?? null,
        isVariation: job.IsVariation ?? null,
        isRetentionEnabled: job.IsRetentionEnabled ?? null,
        technicianId: job.Technician?.ID ?? null,
        technicianName: job.Technician?.Name ?? null,
        projectManagerId: job.ProjectManager?.ID ?? null,
        projectManagerName: job.ProjectManager?.Name ?? null,
        salespersonId: job.Salesperson?.ID ?? null,
        salespersonName: job.Salesperson?.Name ?? null,
        accountManagerComments,
        responseTimeId: job.ResponseTime?.ID ?? null,
        responseTimeName: job.ResponseTime?.Name ?? null,
        responseTimeDays: job.ResponseTime?.Days ?? null,
        responseTimeHours: job.ResponseTime?.Hours ?? null,
        responseTimeMinutes: job.ResponseTime?.Minutes ?? null,
        totalExTax: job.Total?.ExTax ?? null,
        totalTax: job.Total?.Tax ?? null,
        totalIncTax: job.Total?.IncTax ?? null,
        discount: job.Totals?.Discount ?? null,
        invoicedValue: job.Totals?.InvoicedValue ?? null,
        invoicePercentage: job.Totals?.InvoicePercentage ?? null,
        grossProfitActual: job.Totals?.GrossProfitLoss?.Actual ?? null,
        grossMarginActual: job.Totals?.GrossMargin?.Actual ?? null,
        laborActual: job.Totals?.ResourcesCost?.Labor?.Actual ?? null,
        laborEstimate: job.Totals?.ResourcesCost?.Labor?.Estimate ?? null,
        laborHoursActual: job.Totals?.ResourcesCost?.LaborHours?.Actual ?? null,
        laborHoursEstimate: job.Totals?.ResourcesCost?.LaborHours?.Estimate ?? null,
        materialsCostActual: job.Totals?.MaterialsCost?.Actual ?? null,
        materialsCostEstimate: job.Totals?.MaterialsCost?.Estimate ?? null,
        convertedFromQuoteId: job.ConvertedFrom?.ID ?? null,
        convertedFromDate: job.ConvertedFrom?.Date
            ? new Date(job.ConvertedFrom.Date)
            : null,
        archived,
        dueDate: job.DueDate ? new Date(job.DueDate) : null,
        dueTime: job.DueTime ?? null,
        dateIssued: job.DateIssued ? new Date(job.DateIssued) : null,
        dateCreated: job.DateIssued ? new Date(job.DateIssued) : null,
        dateScheduled: job.DueDate ? new Date(job.DueDate) : null,
        dateCompleted: job.CompletedDate ? new Date(job.CompletedDate) : null,
        dateInvoiced: null,
        dateModified: job.DateModified ? new Date(job.DateModified) : null,
        syncedAt: new Date(),
    };
}
// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportJob(companyId, job, archived) {
    const data = transformJob(job, archived);
    const existing = await prisma_1.prisma.reportJob.findFirst({
        where: { companyId, simproJobId: job.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportJob.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportJob.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportJobs(companyId, simproCompanyId, onProgress) {
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
        fetchJobIds(apiUrl, apiKey, simproCompanyId, false),
        fetchJobIds(apiUrl, apiKey, simproCompanyId, true),
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
        const job = await fetchJobDetail(apiUrl, apiKey, simproCompanyId, id);
        if (!job) {
            result.skipped++;
            return;
        }
        try {
            await upsertReportJob(companyId, job, archived);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ jobId: id, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
