"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importReportJobResponseTimes = importReportJobResponseTimes;
const prisma_1 = require("../../lib/prisma");
const BATCH_SIZE = 1000;
function parseDateTime(value) {
    if (!value)
        return null;
    try {
        const [date, time] = value.split(" ");
        if (!date || !time)
            return null;
        const [day, month, year] = date.split("/").map(Number);
        const [hour, minute] = time.split(":").map(Number);
        const result = new Date(year, month - 1, day, hour, minute);
        return Number.isNaN(result.getTime()) ? null : result;
    }
    catch {
        return null;
    }
}
function parseJobId(value) {
    if (!value)
        return null;
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
}
function parseAchieved(value) {
    if (!value)
        return null;
    return value.trim().toLowerCase() === "yes";
}
function transformJobResponseTime(companyId, row) {
    return {
        companyId,
        simproJobId: parseJobId(row["Job No"]),
        jobReference: row["Job No"] || null,
        jobName: row["Job Name"] || null,
        customerName: row.Customer || null,
        siteName: row.Site || null,
        responseTimeName: row["Response Time"] || null,
        createdAt: parseDateTime(row.Created),
        dueAt: parseDateTime(row.Due),
        jobStartTime: parseDateTime(row["Job Start"]),
        achieved: parseAchieved(row.Achieved),
        syncedAt: new Date(),
    };
}
async function importReportJobResponseTimes(companyId, rows, onProgress) {
    const start = Date.now();
    const result = {
        imported: 0,
        failed: 0,
        errors: [],
        durationMs: 0,
    };
    if (!rows.length) {
        result.durationMs = Date.now() - start;
        return result;
    }
    try {
        // Replace existing reporting snapshot
        await prisma_1.prisma.reportJobResponseTime.deleteMany({
            where: {
                companyId,
            },
        });
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const transformedRows = [];
            for (let j = 0; j < batch.length; j++) {
                try {
                    transformedRows.push(transformJobResponseTime(companyId, batch[j]));
                }
                catch (error) {
                    result.failed++;
                    result.errors.push({
                        row: i + j + 1,
                        error: error?.message ?? "Failed to transform row",
                    });
                }
            }
            if (transformedRows.length) {
                try {
                    await prisma_1.prisma.reportJobResponseTime.createMany({
                        data: transformedRows,
                    });
                    result.imported += transformedRows.length;
                }
                catch (error) {
                    result.failed += transformedRows.length;
                    result.errors.push({
                        row: i + 1,
                        error: error?.message ?? "Failed to insert batch",
                    });
                }
            }
            try {
                onProgress?.(Math.min(i + batch.length, rows.length), rows.length);
            }
            catch {
                // Ignore progress callback failures
            }
        }
    }
    catch (error) {
        result.errors.push({
            row: 0,
            error: error?.message ?? "Unexpected import failure",
        });
    }
    result.durationMs = Date.now() - start;
    return result;
}
