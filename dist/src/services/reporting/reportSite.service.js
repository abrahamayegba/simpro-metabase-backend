"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportSites = syncReportSites;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH SITE IDS
// =====================================================
async function fetchSiteIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
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
// PHASE 2 — FETCH SITE DETAIL
// =====================================================
async function fetchSiteDetail(apiUrl, apiKey, simproCompanyId, siteId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/${siteId}`;
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
function transformSite(site, archived) {
    const customer = site.Customers?.[0] ?? null;
    const primary = site.PrimaryContact;
    return {
        simproSiteId: site.ID,
        simproCustomerId: customer?.ID ?? null,
        customerName: customer?.CompanyName ?? null,
        name: site.Name ?? null,
        address: site.Address?.Address ?? null,
        city: site.Address?.City ?? null,
        state: site.Address?.State ?? null,
        postalCode: site.Address?.PostalCode ?? null,
        country: site.Address?.Country ?? null,
        suburb: null,
        latitude: null,
        longitude: null,
        billingAddress: site.BillingAddress?.Address ?? null,
        billingCity: site.BillingAddress?.City ?? null,
        billingState: site.BillingAddress?.State ?? null,
        billingPostalCode: site.BillingAddress?.PostalCode ?? null,
        billingCountry: site.BillingAddress?.Country ?? null,
        primaryContactId: primary?.Contact?.ID ?? null,
        primaryContactGivenName: primary?.GivenName ?? null,
        primaryContactFamilyName: primary?.FamilyName ?? null,
        primaryContactEmail: primary?.Email ?? null,
        primaryContactWorkPhone: primary?.WorkPhone ?? null,
        primaryContactCellPhone: primary?.CellPhone ?? null,
        zoneId: site.Zone?.ID ?? null,
        zoneName: site.Zone?.Name ?? null,
        stcZone: site.STCZone ?? null,
        veecZone: site.VEECZone ?? null,
        archived,
        dateCreated: null,
        dateModified: site.DateModified ? new Date(site.DateModified) : null,
        syncedAt: new Date(),
    };
}
// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportSite(companyId, site, archived) {
    const data = transformSite(site, archived);
    const existing = await prisma_1.prisma.reportSite.findFirst({
        where: { companyId, simproSiteId: site.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportSite.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportSite.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportSites(companyId, simproCompanyId, onProgress) {
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
        fetchSiteIds(apiUrl, apiKey, simproCompanyId, false),
        fetchSiteIds(apiUrl, apiKey, simproCompanyId, true),
    ]);
    const activeSet = new Set(activeIds);
    const uniqueArchivedIds = archivedIds.filter((id) => !activeSet.has(id));
    const allIds = [
        ...activeIds.map((id) => ({ id, archived: false })),
        ...uniqueArchivedIds.map((id) => ({ id, archived: true })),
    ];
    result.fetched = allIds.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 6, delayMs: 500 });
    let processed = 0;
    await limiter.processBatch(allIds, async ({ id, archived }) => {
        const site = await fetchSiteDetail(apiUrl, apiKey, simproCompanyId, id);
        if (!site) {
            result.skipped++;
            return;
        }
        try {
            await upsertReportSite(companyId, site, archived);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ siteId: id, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
