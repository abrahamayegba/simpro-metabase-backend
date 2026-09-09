"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCustomers = syncCustomers;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH CUSTOMER IDS (LIST)
// =====================================================
async function fetchCustomerIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = new Set();
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customers/companies/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) {
            throw new Error(`Failed fetching customers (page ${page}): ${res.status}`);
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
// =====================================================
// PHASE 2 — FETCH CUSTOMER DETAIL (INDIVIDUAL)
// =====================================================
async function fetchCustomerDetail(apiUrl, apiKey, simproCompanyId, customerId) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customers/individuals/${customerId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
        throw new Error(`Failed fetching customer ${customerId}: ${res.status}`);
    }
    return res.json();
}
// =====================================================
// PHASE 3 — TRANSFORM & UPSERT
// =====================================================
async function upsertCustomer(companyId, customer, archived) {
    const exists = await prisma_1.prisma.customer.findUnique({
        where: {
            id_companyId: {
                id: customer.ID,
                companyId,
            },
        },
    });
    const data = {
        companyName: null,
        givenName: customer.GivenName ?? null,
        familyName: customer.FamilyName ?? null,
        phone: customer.Phone ?? null,
        altPhone: customer.AltPhone ?? null,
        email: customer.Email ?? null,
        doNotCall: customer.DoNotCall ?? false,
        address: customer.Address?.Address ?? null,
        city: customer.Address?.City ?? null,
        state: customer.Address?.State ?? null,
        postalCode: customer.Address?.PostalCode ?? null,
        country: customer.Address?.Country ?? null,
        billingAddress: customer.BillingAddress?.Address ?? null,
        billingCity: customer.BillingAddress?.City ?? null,
        billingState: customer.BillingAddress?.State ?? null,
        billingPostalCode: customer.BillingAddress?.PostalCode ?? null,
        billingCountry: customer.BillingAddress?.Country ?? null,
        customerType: customer.CustomerType ?? null,
        amountOwing: customer.AmountOwing ?? null,
        creditLimit: customer.Banking?.CreditLimit ?? null,
        onStop: customer.Banking?.OnStop ?? false,
        accountManagerId: customer.Profile?.AccountManager?.ID ?? null,
        customerProfileId: customer.Profile?.CustomerProfile?.ID ?? null,
        customerGroupId: customer.Profile?.CustomerGroup?.ID ?? null,
        dateCreated: customer.DateCreated ? new Date(customer.DateCreated) : null,
        dateModified: customer.DateModified
            ? new Date(customer.DateModified)
            : null,
        archived,
        lastSynced: new Date(),
    };
    await prisma_1.prisma.customer.upsert({
        where: {
            id_companyId: {
                id: customer.ID,
                companyId,
            },
        },
        update: data,
        create: {
            id: customer.ID,
            companyId,
            ...data,
        },
    });
    return exists ? "updated" : "created";
}
// =====================================================
// MAIN ORCHESTRATOR
// =====================================================
async function syncCustomers(companyId, simproCompanyId, includeArchived = false, onProgress) {
    const start = Date.now();
    const result = {
        fetched: 0,
        created: 0,
        updated: 0,
        archived: 0,
        errors: [],
        durationMs: 0,
    };
    // ---------------------------------------------------
    // LOAD SIMPRO INTEGRATION (NO companyIdValue HERE)
    // ---------------------------------------------------
    const integration = await prisma_1.prisma.integration.findUnique({
        where: {
            companyId_provider: {
                companyId,
                provider: "simpro",
            },
        },
    });
    if (!integration || !integration.apiUrl || !integration.apiKey) {
        throw new Error("Missing Simpro integration");
    }
    const { apiUrl, apiKey } = integration;
    // ---------------------------------------------------
    // FETCH IDS
    // ---------------------------------------------------
    const activeIds = await fetchCustomerIds(apiUrl, apiKey, simproCompanyId, false);
    let archivedIds = [];
    if (includeArchived) {
        archivedIds = await fetchCustomerIds(apiUrl, apiKey, simproCompanyId, true);
    }
    result.fetched = activeIds.length + archivedIds.length;
    // ---------------------------------------------------
    // FETCH DETAILS (RATE LIMITED)
    // ---------------------------------------------------
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 400 });
    const activeCustomers = await limiter.processBatch(activeIds, (id) => fetchCustomerDetail(apiUrl, apiKey, simproCompanyId, id), (done, total) => onProgress?.(done, total));
    const archivedCustomers = includeArchived
        ? await limiter.processBatch(archivedIds, (id) => fetchCustomerDetail(apiUrl, apiKey, simproCompanyId, id), (done) => onProgress?.(activeCustomers.length + done, result.fetched))
        : [];
    // ---------------------------------------------------
    // UPSERT
    // ---------------------------------------------------
    for (const customer of activeCustomers) {
        try {
            const r = await upsertCustomer(companyId, customer, false);
            r === "created" ? result.created++ : result.updated++;
        }
        catch (e) {
            result.errors.push({ customerId: customer.ID, error: e.message });
        }
    }
    for (const customer of archivedCustomers) {
        try {
            await upsertCustomer(companyId, customer, true);
            result.archived++;
        }
        catch (e) {
            result.errors.push({ customerId: customer.ID, error: e.message });
        }
    }
    result.durationMs = Date.now() - start;
    return result;
}
