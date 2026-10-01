"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncAssetTestHistory = syncAssetTestHistory;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
/* =====================================================
   FETCH ALL CUSTOMER ASSETS (PAGED)
===================================================== */
async function fetchCustomerAssetList(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const res = await fetch(`${apiUrl}/api/v1.0/companies/${simproCompanyId}/customerAssets/?page=${page}&pageSize=${pageSize}`, { headers: { Authorization: `Bearer ${apiKey}` } });
        if (!res.ok) {
            throw new Error(`Failed fetching customer assets (page ${page})`);
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
   FETCH ASSET TEST HISTORY
===================================================== */
async function fetchAssetTestHistory(apiUrl, apiKey, simproCompanyId, siteId, assetId) {
    const res = await fetch(`${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/${siteId}/assets/${assetId}/testHistory/`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) {
        throw new Error(`Failed fetching test history for asset ${assetId}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}
/* =====================================================
   TRANSFORM
===================================================== */
function transformSimproAssetTestHistory(item, assetId, companyId, assetTypeName) {
    return {
        assetId,
        companyId,
        assetType: assetTypeName,
        testDate: item.TestRecord?.Date ? new Date(item.TestRecord.Date) : null,
        nextTestDate: null,
        testEmployeeId: item.TestRecord?.Employee?.ID ?? null,
        testEmployeeName: item.TestRecord?.Employee?.Name ?? null,
        testNotes: item.TestRecord?.Notes ?? null,
        testResult: item.TestRecord?.Result ?? null,
        serviceLevelId: item.ServiceLevel?.ID ?? null,
        serviceLevelName: item.ServiceLevel?.Name ?? null,
        jobId: item.Job?.ID ?? null,
        jobDateIssued: item.Job?.DateIssued ? new Date(item.Job.DateIssued) : null,
        jobDueDate: item.Job?.DueDate ? new Date(item.Job.DueDate) : null,
        dateModified: item.DateModified ? new Date(item.DateModified) : null,
        lastSynced: new Date(),
    };
}
/* =====================================================
   MAIN SYNC
===================================================== */
async function syncAssetTestHistory(companyId, simproCompanyId) {
    const start = Date.now();
    const result = {
        assetsProcessed: 0,
        testsInserted: 0,
        errors: [],
        durationMs: 0,
    };
    const integration = await prisma_1.prisma.integration.findUnique({
        where: {
            companyId_provider: {
                companyId,
                provider: "simpro",
            },
        },
    });
    if (!integration?.apiUrl || !integration.apiKey) {
        throw new Error("Missing Simpro integration");
    }
    const { apiUrl, apiKey } = integration;
    // 🔥 CLEAR EXISTING HISTORY FIRST
    await prisma_1.prisma.assetTestHistory.deleteMany({
        where: { companyId },
    });
    const assets = await fetchCustomerAssetList(apiUrl, apiKey, simproCompanyId);
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 6, delayMs: 500 });
    await limiter.processBatch(assets, async (asset) => {
        if (!asset.ID || !asset.Site?.ID)
            return;
        try {
            // FK safety: asset must exist locally
            const localAsset = await prisma_1.prisma.customerAsset.findUnique({
                where: {
                    id_companyId: {
                        id: asset.ID,
                        companyId,
                    },
                },
                select: {
                    assetTypeName: true,
                },
            });
            if (!localAsset)
                return;
            const history = await fetchAssetTestHistory(apiUrl, apiKey, simproCompanyId, asset.Site.ID, asset.ID);
            if (!history.length)
                return;
            const rows = history.map((item) => transformSimproAssetTestHistory(item, asset.ID, companyId, localAsset.assetTypeName ?? null));
            await prisma_1.prisma.assetTestHistory.createMany({
                data: rows,
            });
            result.assetsProcessed++;
            result.testsInserted += rows.length;
        }
        catch (e) {
            result.errors.push({
                assetId: asset.ID,
                error: e.message,
            });
        }
    });
    result.durationMs = Date.now() - start;
    return result;
}
