"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEmployees = syncEmployees;
const prisma_1 = require("../lib/prisma");
const rate_limiter_1 = require("../lib/rate-limiter");
async function fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, archived) {
    const ids = new Set();
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) {
            throw new Error(`Failed fetching employees (page ${page}): ${res.status}`);
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
async function fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, employeeId) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/${employeeId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
        throw new Error(`Failed fetching employee ${employeeId}: ${res.status}`);
    }
    return res.json();
}
function transformSimproEmployee(employee) {
    return {
        name: employee.Name,
        position: employee.Position ?? null,
        email: employee.PrimaryContact?.Email ?? null,
        secondaryEmail: employee.PrimaryContact?.SecondaryEmail ?? null,
        workPhone: employee.PrimaryContact?.WorkPhone ?? null,
        extension: employee.PrimaryContact?.Extension ?? null,
        cellPhone: employee.PrimaryContact?.CellPhone ?? null,
        fax: employee.PrimaryContact?.Fax ?? null,
        preferredNotificationMethod: employee.PrimaryContact?.PreferredNotificationMethod ?? null,
        address: employee.Address?.Address ?? null,
        city: employee.Address?.City ?? null,
        state: employee.Address?.State ?? null,
        postalCode: employee.Address?.PostalCode ?? null,
        country: employee.Address?.Country ?? null,
        dateOfHire: employee.DateOfHire ? new Date(employee.DateOfHire) : null,
        dateOfBirth: employee.DateOfBirth ? new Date(employee.DateOfBirth) : null,
        isSalesperson: employee.UserProfile?.IsSalesperson ?? false,
        isProjectManager: employee.UserProfile?.IsProjectManager ?? false,
        emergencyContactName: employee.EmergencyContact?.Name ?? null,
        emergencyContactRelationship: employee.EmergencyContact?.Relationship ?? null,
        emergencyContactWorkPhone: employee.EmergencyContact?.WorkPhone ?? null,
        emergencyContactCellPhone: employee.EmergencyContact?.CellPhone ?? null,
        emergencyContactAltPhone: employee.EmergencyContact?.AltPhone ?? null,
        emergencyContactAddress: employee.EmergencyContact?.Address ?? null,
        username: employee.AccountSetup?.Username ?? null,
        isMobility: employee.AccountSetup?.IsMobility ?? null,
        securityGroupId: employee.AccountSetup?.SecurityGroup?.ID ?? null,
        securityGroupName: employee.AccountSetup?.SecurityGroup?.Name ?? null,
        mobileSecurityGroupId: typeof employee.AccountSetup?.MobileSecurityGroup?.ID === "number"
            ? employee.AccountSetup.MobileSecurityGroup.ID
            : null,
        mobileSecurityGroupName: employee.AccountSetup?.MobileSecurityGroup?.Name ?? null,
        preferredLanguage: employee.UserProfile?.PreferredLanguage ?? null,
        defaultZoneId: employee.DefaultZone?.ID ?? null,
        defaultZoneName: employee.DefaultZone?.Name ?? null,
        defaultCompanyId: employee.DefaultCompany?.ID ?? null,
        defaultCompanyName: employee.DefaultCompany?.Name ?? null,
        bankAccountName: employee.Banking?.AccountName ?? null,
        bankRoutingNo: employee.Banking?.RoutingNo ?? null,
        bankAccountNo: employee.Banking?.AccountNo ?? null,
        payRate: employee.PayRates?.PayRate ?? null,
        employmentCost: employee.PayRates?.EmploymentCost ?? null,
        overheadCost: employee.PayRates?.Overhead ?? null,
        dateCreated: employee.DateCreated ? new Date(employee.DateCreated) : null,
        dateModified: employee.DateModified
            ? new Date(employee.DateModified)
            : null,
        lastSynced: new Date(),
    };
}
async function upsertEmployee(companyId, employee, archived) {
    const data = transformSimproEmployee(employee);
    await prisma_1.prisma.employee.upsert({
        where: {
            id_companyId: {
                id: employee.ID,
                companyId,
            },
        },
        update: {
            ...data,
            archived,
        },
        create: {
            id: employee.ID,
            companyId,
            ...data,
            archived,
        },
    });
}
async function syncEmployees(companyId, simproCompanyId, includeArchived = false) {
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
    const activeIds = await fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, false);
    const archivedIds = includeArchived
        ? await fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, true)
        : [];
    result.fetched = activeIds.length + archivedIds.length;
    const limiter = new rate_limiter_1.RateLimiter({ concurrency: 5, delayMs: 500 });
    const activeEmployees = await limiter.processBatch(activeIds, (id) => fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, id));
    const archivedEmployees = includeArchived
        ? await limiter.processBatch(archivedIds, (id) => fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, id))
        : [];
    for (const employee of activeEmployees) {
        try {
            await upsertEmployee(companyId, employee, false);
            result.updated++;
        }
        catch (e) {
            result.errors.push({ employeeId: employee.ID, error: e.message });
        }
    }
    for (const employee of archivedEmployees) {
        try {
            await upsertEmployee(companyId, employee, true);
            result.archived++;
        }
        catch (e) {
            result.errors.push({ employeeId: employee.ID, error: e.message });
        }
    }
    result.durationMs = Date.now() - start;
    return result;
}
