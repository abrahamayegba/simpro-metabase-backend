import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproEmployee {
  ID: number;
  Name: string;
  Position?: string | null;
  Archived?: boolean;
  DateCreated?: string | null;
  DateModified?: string | null;
  DateOfHire?: string | null;
  DateOfBirth?: string | null;

  Address?: {
    Address?: string;
    City?: string;
    State?: string;
    PostalCode?: string;
    Country?: string;
  };

  PrimaryContact?: {
    Email?: string | null;
    SecondaryEmail?: string | null;
    WorkPhone?: string | null;
    CellPhone?: string | null;
  };

  UserProfile?: {
    IsSalesperson?: boolean;
    IsProjectManager?: boolean;
  };

  PayRates?: {
    PayRate?: number;
    EmploymentCost?: number;
    Overhead?: number;
  };
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ employeeId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH EMPLOYEE IDS
// =====================================================
async function fetchEmployeeIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  archived: boolean,
): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) break;

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);

    if (!items.length) break;

    for (const item of items) {
      if (item.ID) ids.push(item.ID);
    }

    if (items.length < pageSize) break;
    page++;
  }

  return ids;
}

// =====================================================
// PHASE 2 — FETCH EMPLOYEE DETAIL
// =====================================================
async function fetchEmployeeDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  employeeId: number,
): Promise<SimproEmployee | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/${employeeId}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

// =====================================================
// PHASE 3 — TRANSFORM
// =====================================================
function transformEmployee(employee: SimproEmployee, archived: boolean) {
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
async function upsertReportEmployee(
  companyId: string,
  employee: SimproEmployee,
  archived: boolean,
): Promise<void> {
  const data = transformEmployee(employee, archived);

  const existing = await prisma.reportEmployee.findFirst({
    where: { companyId, simproEmployeeId: employee.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportEmployee.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportEmployee.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportEmployees(
  companyId: string,
  simproCompanyId: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<SyncResult> {
  const start = Date.now();

  const result: SyncResult = {
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

  const [activeIds, archivedIds] = await Promise.all([
    fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, false),
    fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, true),
  ]);

  const activeSet = new Set(activeIds);
  const uniqueArchivedIds = archivedIds.filter((id) => !activeSet.has(id));

  const allIds: Array<{ id: number; archived: boolean }> = [
    ...activeIds.map((id) => ({ id, archived: false })),
    ...uniqueArchivedIds.map((id) => ({ id, archived: true })),
  ];

  result.fetched = allIds.length;

  const limiter = new RateLimiter({ concurrency: 6, delayMs: 500 });

  let processed = 0;

  await limiter.processBatch(allIds, async ({ id, archived }) => {
    const employee = await fetchEmployeeDetail(
      apiUrl,
      apiKey,
      simproCompanyId,
      id,
    );

    if (!employee) {
      result.skipped++;
      return;
    }

    try {
      await upsertReportEmployee(companyId, employee, archived);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ employeeId: id, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
