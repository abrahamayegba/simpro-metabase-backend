"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportAssetServiceLevels = syncReportAssetServiceLevels;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH SERVICE LEVELS FOR ONE ASSET
// =====================================================
async function fetchAssetServiceLevels(apiUrl, apiKey, simproCompanyId, assetId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/${assetId}/serviceLevels/`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok)
            return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.items ?? []);
    }
    catch {
        return [];
    }
}
// =====================================================
// PHASE 2 — FETCH ALL ASSET IDS TO ITERATE
// =====================================================
async function fetchAssetIds(apiUrl, apiKey, simproCompanyId) {
    const ids = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/?page=${page}&pageSize=${pageSize}`;
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
// PHASE 3 — UPSERT SERVICE LEVELS FOR ONE ASSET
// =====================================================
async function upsertAssetServiceLevels(companyId, assetId, serviceLevels) {
    for (const sl of serviceLevels) {
        const data = {
            simproAssetId: assetId,
            serviceLevelName: sl.ServiceLevel?.Name ?? null,
            serviceStartDate: sl.ServiceDate ? new Date(sl.ServiceDate) : null,
            intervalYears: null,
            intervalMonths: null,
            intervalDays: null,
            nextServiceDate: null,
            syncedAt: new Date(),
        };
        const existing = await prisma_1.prisma.reportAssetServiceLevel.findFirst({
            where: {
                companyId,
                simproAssetId: assetId,
                serviceLevelName: data.serviceLevelName,
            },
            select: { id: true },
        });
        if (existing) {
            await prisma_1.prisma.reportAssetServiceLevel.update({
                where: { id: existing.id },
                data,
            });
        }
        else {
            await prisma_1.prisma.reportAssetServiceLevel.create({
                data: { companyId, ...data },
            });
        }
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportAssetServiceLevels(companyId, simproCompanyId, onProgress) {
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
    const assetIds = await fetchAssetIds(apiUrl, apiKey, simproCompanyId);
    result.fetched = assetIds.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 300 });
    let processed = 0;
    await limiter.processBatch(assetIds, async (assetId) => {
        const serviceLevels = await fetchAssetServiceLevels(apiUrl, apiKey, simproCompanyId, assetId);
        if (!serviceLevels.length) {
            result.skipped++;
            processed++;
            onProgress?.(processed, result.fetched);
            return;
        }
        try {
            await upsertAssetServiceLevels(companyId, assetId, serviceLevels);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ assetId, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
