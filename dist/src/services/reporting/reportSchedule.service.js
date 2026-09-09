"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncReportSchedules = syncReportSchedules;
const prisma_1 = require("../../lib/prisma");
async function fetchSchedules(apiUrl, apiKey, simproCompanyId) {
    const results = [];
    let page = 1;
    const pageSize = 250;
    while (true) {
        const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/schedules/?page=${page}&pageSize=${pageSize}`;
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
function transformSchedule(schedule) {
    const block = schedule.Blocks?.[0] ?? null;
    const project = schedule.Project && typeof schedule.Project === "object"
        ? schedule.Project
        : null;
    return {
        simproScheduleId: schedule.ID,
        type: schedule.Type ?? null,
        reference: schedule.Reference ?? null,
        totalHours: schedule.TotalHours ?? null,
        staffId: schedule.Staff?.ID ?? null,
        staffName: schedule.Staff?.Name ?? null,
        staffType: schedule.Staff?.Type ?? null,
        simproJobId: project?.ProjectID ?? null,
        simproSectionId: project?.SectionID ?? null,
        simproJobCostCentreId: project?.CostCenterID ?? null,
        scheduleDate: schedule.Date ? new Date(schedule.Date) : null,
        blockStartTime: block?.ISO8601StartTime
            ? new Date(block.ISO8601StartTime)
            : null,
        blockEndTime: block?.ISO8601EndTime ? new Date(block.ISO8601EndTime) : null,
        blockHours: block?.Hrs ?? null,
        scheduleRateId: block?.ScheduleRate?.ID ?? null,
        scheduleRateName: block?.ScheduleRate?.Name ?? null,
        dateModified: schedule.DateModified
            ? new Date(schedule.DateModified)
            : null,
        syncedAt: new Date(),
    };
}
async function upsertReportSchedule(companyId, schedule) {
    const data = transformSchedule(schedule);
    const existing = await prisma_1.prisma.reportSchedule.findFirst({
        where: { companyId, simproScheduleId: schedule.ID },
        select: { id: true },
    });
    if (existing) {
        await prisma_1.prisma.reportSchedule.update({
            where: { id: existing.id },
            data,
        });
    }
    else {
        await prisma_1.prisma.reportSchedule.create({
            data: { companyId, ...data },
        });
    }
}
async function syncReportSchedules(companyId, simproCompanyId, onProgress) {
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
    const schedules = await fetchSchedules(apiUrl, apiKey, simproCompanyId);
    result.fetched = schedules.length;
    let processed = 0;
    for (const schedule of schedules) {
        try {
            await upsertReportSchedule(companyId, schedule);
            result.upserted++;
        }
        catch (e) {
            result.errors.push({ id: schedule.ID, error: e.message });
        }
        processed++;
        onProgress?.(processed, result.fetched);
    }
    result.durationMs = Date.now() - start;
    return result;
}
