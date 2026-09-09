"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSites = syncSites;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
async function fetchSiteIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = new Set();
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) {
            throw new Error(`Failed fetching sites (page ${page}): ${res.status}`);
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
async function fetchSiteDetail(apiUrl, apiKey, simproCompanyId, siteId) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/${siteId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
        throw new Error(`Failed fetching site ${siteId}: ${res.status}`);
    }
    return res.json();
}
function transformSimproSite(site) {
    const primary = site.PrimaryContact;
    return {
        name: site.Name,
        address: site.Address?.Address ?? null,
        city: site.Address?.City ?? null,
        state: site.Address?.State ?? null,
        postalCode: site.Address?.PostalCode ?? null,
        country: site.Address?.Country ?? null,
        billingAddress: site.BillingAddress?.Address ?? null,
        billingCity: site.BillingAddress?.City ?? null,
        billingState: site.BillingAddress?.State ?? null,
        billingPostalCode: site.BillingAddress?.PostalCode ?? null,
        billingCountry: site.BillingAddress?.Country ?? null,
        billingContact: site.BillingContact ?? null,
        primaryContactId: primary?.Contact?.ID ?? null,
        primaryContactGivenName: primary?.GivenName ?? null,
        primaryContactFamilyName: primary?.FamilyName ?? null,
        primaryContactEmail: primary?.Email ?? null,
        primaryContactTitle: primary?.Title ?? null,
        primaryContactWorkPhone: primary?.WorkPhone ?? null,
        primaryContactCellPhone: primary?.CellPhone ?? null,
        primaryContactFax: primary?.Fax ?? null,
        primaryContactPosition: primary?.Position ?? null,
        primaryContactNotification: primary?.PreferredNotificationMethod ?? null,
        publicNotes: site.PublicNotes ?? null,
        privateNotes: site.PrivateNotes ?? null,
        zoneId: site.Zone?.ID ?? null,
        zoneName: site.Zone?.Name ?? null,
        stcZone: site.STCZone ?? null,
        veecZone: site.VEECZone ?? null,
        serviceFeeId: site.Rates?.ServiceFee?.ID ?? null,
        serviceFeeName: site.Rates?.ServiceFee?.Name ?? null,
        dateModified: site.DateModified ? new Date(site.DateModified) : null,
        lastSynced: new Date(),
    };
}
async function upsertSite(companyId, site, archived) {
    const customer = site.Customers?.[0] ?? null;
    const customerId = customer?.ID ?? null;
    const customerName = customer?.CompanyName ?? null;
    const data = transformSimproSite(site);
    await prisma_1.prisma.site.upsert({
        where: {
            id_companyId: {
                id: site.ID,
                companyId,
            },
        },
        update: {
            ...data,
            customerId,
            customerName,
            archived,
        },
        create: {
            id: site.ID,
            companyId,
            customerId,
            customerName,
            ...data,
            archived,
        },
    });
}
async function syncSites(companyId, simproCompanyId, includeArchived = false) {
    const start = Date.now();
    const result = {
        fetched: 0,
        updated: 0,
        archived: 0,
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
    const activeIds = await fetchSiteIds(apiUrl, apiKey, simproCompanyId, false);
    const archivedIds = includeArchived
        ? await fetchSiteIds(apiUrl, apiKey, simproCompanyId, true)
        : [];
    result.fetched = activeIds.length + archivedIds.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 600 });
    const activeSites = await limiter.processBatch(activeIds, (id) => fetchSiteDetail(apiUrl, apiKey, simproCompanyId, id));
    const archivedSites = includeArchived
        ? await limiter.processBatch(archivedIds, (id) => fetchSiteDetail(apiUrl, apiKey, simproCompanyId, id))
        : [];
    for (const site of activeSites) {
        try {
            await upsertSite(companyId, site, false);
            result.updated++;
        }
        catch (e) {
            result.skipped++;
            result.errors.push({ siteId: site.ID, error: e.message });
        }
    }
    for (const site of archivedSites) {
        try {
            await upsertSite(companyId, site, true);
            result.archived++;
        }
        catch (e) {
            result.skipped++;
            result.errors.push({ siteId: site.ID, error: e.message });
        }
    }
    result.durationMs = Date.now() - start;
    return result;
}
