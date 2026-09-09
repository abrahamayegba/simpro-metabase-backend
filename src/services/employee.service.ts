import { prisma } from "../lib/prisma";
import { RateLimiter } from "../lib/rate-limiter";

interface SimproEmployee {
  ID: number;
  Name: string;
  Position?: string | null;

  Address?: {
    Address?: string;
    City?: string;
    State?: string;
    PostalCode?: string;
    Country?: string;
  };

  DateOfHire?: string | null;
  DateOfBirth?: string | null;

  PrimaryContact?: {
    Email?: string | null;
    SecondaryEmail?: string | null;
    WorkPhone?: string | null;
    Extension?: string | null;
    CellPhone?: string | null;
    Fax?: string | null;
    PreferredNotificationMethod?: string | null;
  };

  EmergencyContact?: {
    Name?: string | null;
    Relationship?: string | null;
    WorkPhone?: string | null;
    CellPhone?: string | null;
    AltPhone?: string | null;
    Address?: string | null;
  };

  AccountSetup?: {
    Username?: string | null;
    IsMobility?: boolean;
    SecurityGroup?: {
      ID?: number;
      Name?: string;
    } | null;
    MobileSecurityGroup?: {
      ID?: number | string;
      Name?: string;
    } | null;
  };

  UserProfile?: {
    IsSalesperson?: boolean;
    IsProjectManager?: boolean;
    PreferredLanguage?: string | null;
  };

  DefaultZone?: {
    ID?: number;
    Name?: string;
  } | null;

  DefaultCompany?: {
    ID?: number;
    Name?: string;
  } | null;

  Banking?: {
    AccountName?: string | null;
    RoutingNo?: string | null;
    AccountNo?: string | null;
  };

  PayRates?: {
    PayRate?: number;
    EmploymentCost?: number;
    Overhead?: number;
  };

  Archived?: boolean;
  DateCreated?: string | null;
  DateModified?: string | null;
}

interface SyncEmployeesResult {
  fetched: number;
  updated: number;
  archived: number;
  errors: Array<{ employeeId: number; error: string }>;
  durationMs: number;
}

async function fetchEmployeeIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  archived: boolean
): Promise<number[]> {
  const ids = new Set<number>();
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(
        `Failed fetching employees (page ${page}): ${res.status}`
      );
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items ?? [];

    if (!items.length) break;

    for (const item of items) {
      if (item.ID) ids.add(item.ID);
    }

    if (items.length < pageSize) break;
    page++;
  }

  return [...ids];
}

async function fetchEmployeeDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  employeeId: number
): Promise<SimproEmployee> {
  const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/employees/${employeeId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Failed fetching employee ${employeeId}: ${res.status}`);
  }

  return res.json();
}

function transformSimproEmployee(employee: SimproEmployee) {
  return {
    name: employee.Name,
    position: employee.Position ?? null,

    email: employee.PrimaryContact?.Email ?? null,
    secondaryEmail: employee.PrimaryContact?.SecondaryEmail ?? null,
    workPhone: employee.PrimaryContact?.WorkPhone ?? null,
    extension: employee.PrimaryContact?.Extension ?? null,
    cellPhone: employee.PrimaryContact?.CellPhone ?? null,
    fax: employee.PrimaryContact?.Fax ?? null,
    preferredNotificationMethod:
      employee.PrimaryContact?.PreferredNotificationMethod ?? null,

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
    emergencyContactRelationship:
      employee.EmergencyContact?.Relationship ?? null,
    emergencyContactWorkPhone: employee.EmergencyContact?.WorkPhone ?? null,
    emergencyContactCellPhone: employee.EmergencyContact?.CellPhone ?? null,
    emergencyContactAltPhone: employee.EmergencyContact?.AltPhone ?? null,
    emergencyContactAddress: employee.EmergencyContact?.Address ?? null,

    username: employee.AccountSetup?.Username ?? null,
    isMobility: employee.AccountSetup?.IsMobility ?? null,

    securityGroupId: employee.AccountSetup?.SecurityGroup?.ID ?? null,
    securityGroupName: employee.AccountSetup?.SecurityGroup?.Name ?? null,

    mobileSecurityGroupId:
      typeof employee.AccountSetup?.MobileSecurityGroup?.ID === "number"
        ? employee.AccountSetup.MobileSecurityGroup.ID
        : null,
    mobileSecurityGroupName:
      employee.AccountSetup?.MobileSecurityGroup?.Name ?? null,

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

async function upsertEmployee(
  companyId: string,
  employee: SimproEmployee,
  archived: boolean
) {
  const data = transformSimproEmployee(employee);

  await prisma.employee.upsert({
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

export async function syncEmployees(
  companyId: string,
  simproCompanyId: string,
  includeArchived = false
): Promise<SyncEmployeesResult> {
  const start = Date.now();

  const result: SyncEmployeesResult = {
    fetched: 0,
    updated: 0,
    archived: 0,
    errors: [],
    durationMs: 0,
  };

  const integration = await prisma.integration.findUnique({
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

  const activeIds = await fetchEmployeeIds(
    apiUrl,
    apiKey,
    simproCompanyId,
    false
  );

  const archivedIds = includeArchived
    ? await fetchEmployeeIds(apiUrl, apiKey, simproCompanyId, true)
    : [];

  result.fetched = activeIds.length + archivedIds.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 500 });

  const activeEmployees = await limiter.processBatch(activeIds, (id) =>
    fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, id)
  );

  const archivedEmployees = includeArchived
    ? await limiter.processBatch(archivedIds, (id) =>
        fetchEmployeeDetail(apiUrl, apiKey, simproCompanyId, id)
      )
    : [];

  for (const employee of activeEmployees) {
    try {
      await upsertEmployee(companyId, employee, false);
      result.updated++;
    } catch (e: any) {
      result.errors.push({ employeeId: employee.ID, error: e.message });
    }
  }

  for (const employee of archivedEmployees) {
    try {
      await upsertEmployee(companyId, employee, true);
      result.archived++;
    } catch (e: any) {
      result.errors.push({ employeeId: employee.ID, error: e.message });
    }
  }

  result.durationMs = Date.now() - start;
  return result;
}
