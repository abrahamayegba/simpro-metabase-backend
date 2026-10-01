"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportEmployees = syncReportEmployees;
const prisma_1 = require("../../lib/prisma");
const rate_limiter_1 = require("../../lib/rate-limiter");
// =====================================================
// PHASE 1 — FETCH EMPLOYEE IDS
// =====================================================
async function fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
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
// PHASE 2 — FETCH EMPLOYEE DETAIL
// =====================================================
async function fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, employeeId) {
    try {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/${employeeId}`;
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
function transformEmployee(employee, archived) {
    return {
        simproEmployeeId: employee.ID,
        name: employee.Name ?? null,
        position: employee.Position ?? null,
        email: employee.PrimaryContact?.Email ?? null,
        secondaryEmail: employee.PrimaryContact?.SecondaryEmail ?? null,
        workPhone: employee.PrimaryContact?.WorkPhone ?? null,
        cellPhone: employee.PrimaryContact?.CellPhone ?? null,
        address: employee.Address?.Address ?? null,
        city: employee.Address?.City ?? null,
        state: employee.Address?.State ?? null,
        postalCode: employee.Address?.PostalCode ?? null,
        country: employee.Address?.Country ?? null,
        payRate: employee.PayRates?.PayRate ?? null,
        employmentCost: employee.PayRates?.EmploymentCost ?? null,
        overheadCost: employee.PayRates?.Overhead ?? null,
        isSalesperson: employee.UserProfile?.IsSalesperson ?? null,
        isProjectManager: employee.UserProfile?.IsProjectManager ?? null,
        archived,
        dateOfHire: employee.DateOfHire ? new Date(employee.DateOfHire) : null,
        dateOfBirth: employee.DateOfBirth ? new Date(employee.DateOfBirth) : null,
        dateCreated: employee.DateCreated ? new Date(employee.DateCreated) : null,
        dateModified: employee.DateModified
            ? new Date(employee.DateModified)
            : null,
        syncedAt: new Date(),
    };
}
// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportEmployee(companyId, employee, archived) {
    const data = transformEmployee(employee, archived);
    const existing = await prisma_1.prisma.reportEmployee.findFirst({
        where: { companyId, simproEmployeeId: employee.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportEmployee.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportEmployee.create({
            data: { companyId, ...data },
        });
    }
}
// =====================================================
// MAIN
// =====================================================
async function syncReportEmployees(companyId, simproCompanyId, onProgress) {
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
        fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, false),
        fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, true),
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
        const employee = await fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, id);
        if (!employee) {
            result.skipped++;
            return;
        }
        try {
            await upsertReportEmployee(companyId, employee, archived);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ employeeId: id, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    });
    result.durationMs = Date.now() - start;
    return result;
}
