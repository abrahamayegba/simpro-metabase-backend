import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

// =====================================================
// SCHEDULES
// =====================================================

interface SimproSchedule {
  ID: number;
  Type?: string | null;
  Reference?: string | null;
  TotalHours?: number | null;
  Date?: string | null;
  DateModified?: string | null;

  Staff?: {
    ID?: number;
    Name?: string;
    Type?: string;
  } | null;

  Blocks?: Array<{
    Hrs?: number;
    ISO8601StartTime?: string;
    ISO8601EndTime?: string;
    ScheduleRate?: {
      ID?: number;
      Name?: string;
    };
  }> | null;

  Project?:
    | {
        ProjectID?: number;
        SectionID?: number;
        CostCenterID?: number;
      }
    | string
    | null;
}

interface SyncSchedulesResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ id: number; error: string }>;
  durationMs: number;
}

async function fetchSchedules(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
): Promise<SimproSchedule[]> {
  const results: SimproSchedule[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/schedules/?page=${page}&pageSize=${pageSize}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);

    if (!items.length) break;

    results.push(...items);

    if (items.length < pageSize) break;
    page++;
  }

  return results;
}

function transformSchedule(schedule: SimproSchedule) {
  const block = schedule.Blocks?.[0] ?? null;

  const project =
    schedule.Project && typeof schedule.Project === "object"
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

async function upsertReportSchedule(
  companyId: string,
  schedule: SimproSchedule,
): Promise<void> {
  const data = transformSchedule(schedule);

  const existing = await prisma.reportSchedule.findFirst({
    where: { companyId, simproScheduleId: schedule.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportSchedule.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportSchedule.create({
      data: { companyId, ...data },
    });
  }
}

export async function syncReportSchedules(
  companyId: string,
  simproCompanyId: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<SyncSchedulesResult> {
  const start = Date.now();

  const result: SyncSchedulesResult = {
    fetched: 0,
    upserted: 0,
    skipped: 0,
    errors: [],
    durationMs: 0,
  };

  const integration = await prisma.integration.findUnique({
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
    } catch (e: any) {
      result.errors.push({ id: schedule.ID, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  }

  result.durationMs = Date.now() - start;
  return result;
}