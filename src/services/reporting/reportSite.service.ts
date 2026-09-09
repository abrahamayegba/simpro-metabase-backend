import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";

interface SimproSite {
  ID: number;
  Name: string;
  Archived?: boolean;
  DateCreated?: string | null;
  DateModified?: string | null;

  Address?: {
    Address?: string;
    City?: string;
    State?: string;
    PostalCode?: string;
    Country?: string;
  };

  BillingAddress?: {
    Address?: string;
    City?: string;
    State?: string;
    PostalCode?: string;
    Country?: string;
  };

  PrimaryContact?: {
    Contact?: {
      ID?: number;
      GivenName?: string;
      FamilyName?: string;
      Email?: string;
    };
    GivenName?: string;
    FamilyName?: string;
    Email?: string;
    WorkPhone?: string;
    CellPhone?: string;
  };

  Zone?: {
    ID?: number;
    Name?: string;
  };

  STCZone?: number | null;
  VEECZone?: string | null;

  Customers?: Array<{
    ID: number;
    CompanyName?: string;
  }>;
}

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ siteId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH SITE IDS
// =====================================================
async function fetchSiteIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  archived: boolean,
): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;

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
// PHASE 2 — FETCH SITE DETAIL
// =====================================================
async function fetchSiteDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  siteId: number,
): Promise<SimproSite | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/sites/${siteId}`;

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
function transformSite(site: SimproSite, archived: boolean) {
  const customer = site.Customers?.[0] ?? null;
  const primary = site.PrimaryContact;

  return {
    simproSiteId: site.ID,
    simproCustomerId: customer?.ID ?? null,
    customerName: customer?.CompanyName ?? null,

    name: site.Name ?? null,

    address: site.Address?.Address ?? null,
    city: site.Address?.City ?? null,
    state: site.Address?.State ?? null,
    postalCode: site.Address?.PostalCode ?? null,
    country: site.Address?.Country ?? null,
    suburb: null,

    latitude: null,
    longitude: null,

    billingAddress: site.BillingAddress?.Address ?? null,
    billingCity: site.BillingAddress?.City ?? null,
    billingState: site.BillingAddress?.State ?? null,
    billingPostalCode: site.BillingAddress?.PostalCode ?? null,
    billingCountry: site.BillingAddress?.Country ?? null,

    primaryContactId: primary?.Contact?.ID ?? null,
    primaryContactGivenName: primary?.GivenName ?? null,
    primaryContactFamilyName: primary?.FamilyName ?? null,
    primaryContactEmail: primary?.Email ?? null,
    primaryContactWorkPhone: primary?.WorkPhone ?? null,
    primaryContactCellPhone: primary?.CellPhone ?? null,

    zoneId: site.Zone?.ID ?? null,
    zoneName: site.Zone?.Name ?? null,

    stcZone: site.STCZone ?? null,
    veecZone: site.VEECZone ?? null,

    archived,

    dateCreated: null,
    dateModified: site.DateModified ? new Date(site.DateModified) : null,

    syncedAt: new Date(),
  };
}

// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportSite(
  companyId: string,
  site: SimproSite,
  archived: boolean,
): Promise<void> {
  const data = transformSite(site, archived);

  const existing = await prisma.reportSite.findFirst({
    where: { companyId, simproSiteId: site.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportSite.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportSite.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportSites(
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
    fetchSiteIds(apiUrl, apiKey, simproCompanyId, false),
    fetchSiteIds(apiUrl, apiKey, simproCompanyId, true),
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
    const site = await fetchSiteDetail(apiUrl, apiKey, simproCompanyId, id);

    if (!site) {
      result.skipped++;
      return;
    }

    try {
      await upsertReportSite(companyId, site, archived);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ siteId: id, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
