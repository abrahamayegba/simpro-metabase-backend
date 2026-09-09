"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportResponseTimes = syncReportResponseTimes;
const prisma_1 = require("../../lib/prisma");
async function fetchResponseTimes(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/setup/responseTimes/?page=${page}&pageSize=${pageSize}`;
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
async function syncReportResponseTimes(companyId, simproCompanyId) {
    const start = Date.now();
    const result = {
        fetched: 0,
        upserted: 0,
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
    const items = await fetchResponseTimes(apiUrl, apiKey, simproCompanyId);
    result.fetched = items.length;
    for (const item of items) {
        try {
            const data = {
                simproResponseTimeId: item.ID,
                name: item.Name ?? null,
                archived: item.Archived ?? null,
                syncedAt: new Date(),
            };
            const existing = await prisma_1.prisma.reportResponseTime.findFirst({
                where: { companyId, simproResponseTimeId: item.ID },
                select: { id: true },
            });
            if (existing) {
                await prisma_1.prisma.reportResponseTime.update({
                    where: { id: existing.id },
                    data,
                });
            }
            else {
                await prisma_1.prisma.reportResponseTime.create({
                    data: { companyId, ...data },
                });
            }
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ id: item.ID, error: e.message });
        }
    }
    result.durationMs = Date.now() - start;
    return result;
}
