import { prisma } from "../../lib/prisma";
import { RateLimiter } from "../../lib/rate-limiter";
import type { SimproCustomer } from "../../lib/types/simpro";

interface SyncResult {
  fetched: number;
  upserted: number;
  skipped: number;
  errors: Array<{ customerId: number; error: string }>;
  durationMs: number;
}

// =====================================================
// PHASE 1 — FETCH CUSTOMER IDS
// =====================================================
async function fetchCustomerIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  archived: boolean,
): Promise<number[]> {
  const ids: number[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customers/companies/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;

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
// PHASE 2 — FETCH CUSTOMER DETAIL
// =====================================================
async function fetchCustomerDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  customerId: number,
): Promise<SimproCustomer | null> {
  try {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/customers/companies/${customerId}`;

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
function transformCustomer(customer: SimproCustomer, archived: boolean) {
  return {
    simproCustomerId: customer.ID,
    companyName: customer.CompanyName ?? null,

    phone: customer.Phone ?? null,
    altPhone: customer.AltPhone || null,
    email: customer.Email ?? null,
    website: customer.Website || null,

    doNotCall: customer.DoNotCall ?? null,
    onStop: customer.Banking?.OnStop ?? null,
    archived,

    address: customer.Address?.Address ?? null,
    city: customer.Address?.City ?? null,
    state: customer.Address?.State ?? null,
    postalCode: customer.Address?.PostalCode ?? null,
    country: customer.Address?.Country ?? null,

    billingAddress: customer.BillingAddress?.Address ?? null,
    billingCity: customer.BillingAddress?.City ?? null,
    billingState: customer.BillingAddress?.State ?? null,
    billingPostalCode: customer.BillingAddress?.PostalCode ?? null,
    billingCountry: customer.BillingAddress?.Country ?? null,

    customerType: customer.CustomerType ?? null,

    amountOwing: customer.AmountOwing ?? null,
    creditLimit: customer.Banking?.CreditLimit ?? null,

    accountManagerId: customer.Profile?.AccountManager?.ID ?? null,
    accountManagerName: customer.Profile?.AccountManager?.Name ?? null,

    customerProfileId: customer.Profile?.CustomerProfile?.ID ?? null,
    customerProfileName: customer.Profile?.CustomerProfile?.Name ?? null,

    customerGroupId: customer.Profile?.CustomerGroup?.ID ?? null,
    customerGroupName: customer.Profile?.CustomerGroup?.Name ?? null,

    currency: customer.Profile?.Currency?.ID ?? null,

    paymentMethodId: customer.Banking?.PaymentMethod?.ID ?? null,
    paymentMethodName: customer.Banking?.PaymentMethod?.Name ?? null,

    paymentTermId: customer.Banking?.PaymentTermID ?? null,
    paymentTermDays: customer.Banking?.PaymentTerms?.Days ?? null,
    paymentTermType: customer.Banking?.PaymentTerms?.Type ?? null,

    profileNotes: customer.Profile?.Notes ?? null,

    dateCreated: customer.DateCreated ? new Date(customer.DateCreated) : null,
    dateModified: customer.DateModified
      ? new Date(customer.DateModified)
      : null,

    syncedAt: new Date(),
  };
}

// =====================================================
// PHASE 4 — UPSERT INTO REPORT TABLE
// =====================================================
async function upsertReportCustomer(
  companyId: string,
  customer: SimproCustomer,
  archived: boolean,
): Promise<void> {
  const data = transformCustomer(customer, archived);

  const existing = await prisma.reportCustomer.findFirst({
    where: { companyId, simproCustomerId: customer.ID },
    select: { id: true },
  });

  if (existing) {
    await prisma.reportCustomer.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.reportCustomer.create({
      data: { companyId, ...data },
    });
  }
}

// =====================================================
// MAIN
// =====================================================
export async function syncReportCustomers(
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

  // Pull both active and archived, dedupe by ID
  const [activeIds, archivedIds] = await Promise.all([
    fetchCustomerIds(apiUrl, apiKey, simproCompanyId, false),
    fetchCustomerIds(apiUrl, apiKey, simproCompanyId, true),
  ]);

  // Active takes precedence if ID appears in both
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
    const customer = await fetchCustomerDetail(
      apiUrl,
      apiKey,
      simproCompanyId,
      id,
    );

    if (!customer) {
      result.skipped++;
      return;
    }

    try {
      await upsertReportCustomer(companyId, customer, archived);
      result.upserted++;
    } catch (e: any) {
      result.errors.push({ customerId: id, error: e.message });
    }

    processed++;
    onProgress?.(processed, result.fetched);
  });

  result.durationMs = Date.now() - start;
  return result;
}
