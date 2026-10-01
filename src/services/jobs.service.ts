import { prisma } from "../lib/prisma";
import { RateLimiter } from "../lib/rate-limiter";
import { SimproJobDetail } from "../lib/types/simpro";

// =====================================================
// PHASE 1 — FETCH JOB IDS
// =====================================================
async function fetchJobIds(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  archived: boolean,
): Promise<number[]> {
  const ids = new Set<number>();
  let page = 1;
  const pageSize = 250;

  while (true) {
    const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobs/?page=${page}&pageSize=${pageSize}&Archived=${archived}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Failed fetching job list (page ${page}): ${res.status}`);
    }

    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items ?? []);

    if (!items.length) break;

    for (const item of items) {
      if (item.ID) ids.add(item.ID);
    }

    if (items.length < pageSize) break;
    page++;
  }

  return [...ids];
}

// =====================================================
// PHASE 2 — FETCH JOB DETAIL
// =====================================================
async function fetchJobDetail(
  apiUrl: string,
  apiKey: string,
  simproCompanyId: string,
  jobId: number,
): Promise<SimproJobDetail> {
  const url = `${apiUrl}/api/v1.0/companies/${simproCompanyId}/jobs/${jobId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    throw new Error(`Failed fetching job ${jobId}: ${res.status}`);
  }

  return res.json();
}

// =====================================================
// PHASE 3 — TRANSFORM & UPSERT
// =====================================================
async function upsertJob(
  companyId: string,
  job: SimproJobDetail,
  archived: boolean,
) {
  const data = transformSimproJob(job);

  await prisma.job.upsert({
    where: {
      id_companyId: {
        id: job.ID,
        companyId,
      },
    },
    update: {
      ...data,
      archived,
    },
    create: {
      id: job.ID,
      companyId,
      ...data,
      archived,
    },
  });
}

function transformSimproJob(job: SimproJobDetail) {
  const customFields = job.CustomFields ?? [];

  const accountManagerField = customFields.find(
    (cf) => cf.CustomField?.Name === "Account Manager Comments",
  );
  return {
    // BASIC INFO
    type: job.Type ?? null,
    reference: job.OrderNo ?? null,
    orderNo: job.OrderNo ?? null,
    requestNo: job.RequestNo ?? null,
    name: job.Name ?? null,
    description: job.Description ?? null,
    notes: job.Notes ?? null,

    // CUSTOMER
    customerId: job.Customer?.ID ?? null,
    customerName: job.Customer?.CompanyName ?? null,
    customerGivenName: job.Customer?.GivenName ?? null,
    customerFamilyName: job.Customer?.FamilyName ?? null,

    // CUSTOMER CONTRACT
    customerContractId: job.CustomerContract?.ID ?? null,
    customerContractName: job.CustomerContract?.Name ?? null,
    customerContractStartDate: job.CustomerContract?.StartDate
      ? new Date(job.CustomerContract.StartDate)
      : null,
    customerContractEndDate: job.CustomerContract?.EndDate
      ? new Date(job.CustomerContract.EndDate)
      : null,
    customerContractNo: job.CustomerContract?.ContractNo ?? null,

    // CUSTOMER CONTACT
    customerContactId: job.CustomerContact?.ID ?? null,
    customerContactGivenName: job.CustomerContact?.GivenName ?? null,
    customerContactFamilyName: job.CustomerContact?.FamilyName ?? null,

    // SITE
    siteId: job.Site?.ID ?? null,
    siteName: job.Site?.Name ?? null,

    // SITE CONTACT
    siteContactId: job.SiteContact?.ID ?? null,
    siteContactGivenName: job.SiteContact?.GivenName ?? null,
    siteContactFamilyName: job.SiteContact?.FamilyName ?? null,

    // DATES
    dateIssued: job.DateIssued ? new Date(job.DateIssued) : null,
    dueDate: job.DueDate ? new Date(job.DueDate) : null,
    dueTime: job.DueTime ?? null,
    dateCreated: job.DateIssued ? new Date(job.DateIssued) : null,
    dateScheduled: job.DueDate ? new Date(job.DueDate) : null,
    dateCompleted: job.CompletedDate ? new Date(job.CompletedDate) : null,
    dateModified: job.DateModified ? new Date(job.DateModified) : null,

    // SALES
    salespersonId: job.Salesperson?.ID ?? null,
    salespersonName: job.Salesperson?.Name ?? null,
    salespersonType: job.Salesperson?.Type ?? null,
    salespersonTypeId: job.Salesperson?.TypeId ?? null,

    // PROJECT MANAGER
    projectManagerId: job.ProjectManager?.ID ?? null,
    projectManagerName: job.ProjectManager?.Name ?? null,
    projectManagerType: job.ProjectManager?.Type ?? null,
    projectManagerTypeId: job.ProjectManager?.TypeId ?? null,

    // TECHNICIANS
    technicianId: job.Technician?.ID ?? null,
    technicianName: job.Technician?.Name ?? null,
    technicianType: job.Technician?.Type ?? null,
    technicianTypeId: job.Technician?.TypeId ?? null,

    // STATUS / META
    statusId: job.Status?.ID ?? null,
    statusName: job.Status?.Name ?? null,
    statusColor: job.Status?.Color ?? null,
    stage: job.Stage ?? null,
    jobType: job.Type ?? null,

    // RESPONSE TIME
    responseTimeId: job.ResponseTime?.ID ?? null,
    responseTimeName: job.ResponseTime?.Name ?? null,
    responseTimeDays: job.ResponseTime?.Days ?? null,
    responseTimeHours: job.ResponseTime?.Hours ?? null,
    responseTimeMinutes: job.ResponseTime?.Minutes ?? null,

    // VARIATION
    isVariation: job.IsVariation ?? null,

    // CONVERTED FROM
    convertedFromId: job.ConvertedFrom?.ID ?? null,
    convertedFromType: job.ConvertedFrom?.Type ?? null,
    convertedFromDate: job.ConvertedFrom?.Date
      ? new Date(job.ConvertedFrom.Date)
      : null,

    // TOTALS
    totalExTax: job.Total?.ExTax ?? null,
    totalTax: job.Total?.Tax ?? null,
    totalIncTax: job.Total?.IncTax ?? null,

    // MATERIALS
    materialsCostActual: job.Totals?.MaterialsCost?.Actual ?? null,
    materialsCostCommitted: job.Totals?.MaterialsCost?.Committed ?? null,
    materialsCostEstimate: job.Totals?.MaterialsCost?.Estimate ?? null,
    materialsCostRevised: job.Totals?.MaterialsCost?.Revised ?? null,

    // RESOURCES
    resourcesCostActual: job.Totals?.ResourcesCost?.Total?.Actual ?? null,
    resourcesCostCommitted: job.Totals?.ResourcesCost?.Total?.Committed ?? null,
    resourcesCostEstimate: job.Totals?.ResourcesCost?.Total?.Estimate ?? null,
    resourcesCostRevised: job.Totals?.ResourcesCost?.Total?.Revised ?? null,

    // LABOUR
    laborActual: job.Totals?.ResourcesCost?.Labor?.Actual ?? null,
    laborCommitted: job.Totals?.ResourcesCost?.Labor?.Committed ?? null,
    laborEstimate: job.Totals?.ResourcesCost?.Labor?.Estimate ?? null,
    laborRevised: job.Totals?.ResourcesCost?.Labor?.Revised ?? null,

    // LABOUR HOURS
    laborHoursActual: job.Totals?.ResourcesCost?.LaborHours?.Actual ?? null,
    laborHoursCommitted:
      job.Totals?.ResourcesCost?.LaborHours?.Committed ?? null,
    laborHoursEstimate: job.Totals?.ResourcesCost?.LaborHours?.Estimate ?? null,
    laborHoursRevised: job.Totals?.ResourcesCost?.LaborHours?.Revised ?? null,

    // PLANT
    plantActual: job.Totals?.ResourcesCost?.PlantAndEquipment?.Actual ?? null,
    plantCommitted:
      job.Totals?.ResourcesCost?.PlantAndEquipment?.Committed ?? null,
    plantEstimate:
      job.Totals?.ResourcesCost?.PlantAndEquipment?.Estimate ?? null,
    plantRevised: job.Totals?.ResourcesCost?.PlantAndEquipment?.Revised ?? null,

    plantHoursActual:
      job.Totals?.ResourcesCost?.PlantAndEquipmentHours?.Actual ?? null,
    plantHoursEstimate:
      job.Totals?.ResourcesCost?.PlantAndEquipmentHours?.Estimate ?? null,
    plantHoursRevised:
      job.Totals?.ResourcesCost?.PlantAndEquipmentHours?.Revised ?? null,

    // COMMISSION
    commissionActual: job.Totals?.ResourcesCost?.Commission?.Actual ?? null,
    commissionEstimate: job.Totals?.ResourcesCost?.Commission?.Estimate ?? null,
    commissionRevised: job.Totals?.ResourcesCost?.Commission?.Revised ?? null,

    // OVERHEAD
    overheadActual: job.Totals?.ResourcesCost?.Overhead?.Actual ?? null,
    overheadCommitted: job.Totals?.ResourcesCost?.Overhead?.Committed ?? null,
    overheadEstimate: job.Totals?.ResourcesCost?.Overhead?.Estimate ?? null,
    overheadRevised: job.Totals?.ResourcesCost?.Overhead?.Revised ?? null,

    // MARKUP
    materialsMarkupActual: job.Totals?.MaterialsMarkup?.Actual ?? null,
    materialsMarkupEstimate: job.Totals?.MaterialsMarkup?.Estimate ?? null,
    materialsMarkupRevised: job.Totals?.MaterialsMarkup?.Revised ?? null,

    resourcesMarkupActual: job.Totals?.ResourcesMarkup?.Total?.Actual ?? null,
    resourcesMarkupEstimate:
      job.Totals?.ResourcesMarkup?.Total?.Estimate ?? null,
    resourcesMarkupRevised: job.Totals?.ResourcesMarkup?.Total?.Revised ?? null,

    // ADJUSTED
    adjustedActual: job.Totals?.Adjusted?.Actual ?? null,
    adjustedEstimate: job.Totals?.Adjusted?.Estimate ?? null,
    adjustedRevised: job.Totals?.Adjusted?.Revised ?? null,

    // DISCOUNTS
    membershipDiscount: job.Totals?.MembershipDiscount ?? null,
    discount: job.Totals?.Discount ?? null,

    // PROFITS
    grossProfitActual: job.Totals?.GrossProfitLoss?.Actual ?? null,
    grossProfitEstimate: job.Totals?.GrossProfitLoss?.Estimate ?? null,
    grossProfitRevised: job.Totals?.GrossProfitLoss?.Revised ?? null,

    grossMarginActual: job.Totals?.GrossMargin?.Actual ?? null,
    grossMarginEstimate: job.Totals?.GrossMargin?.Estimate ?? null,
    grossMarginRevised: job.Totals?.GrossMargin?.Revised ?? null,

    nettProfitActual: job.Totals?.NettProfitLoss?.Actual ?? null,
    nettProfitEstimate: job.Totals?.NettProfitLoss?.Estimate ?? null,
    nettProfitRevised: job.Totals?.NettProfitLoss?.Revised ?? null,

    nettMarginActual: job.Totals?.NettMargin?.Actual ?? null,
    nettMarginEstimate: job.Totals?.NettMargin?.Estimate ?? null,
    nettMarginRevised: job.Totals?.NettMargin?.Revised ?? null,

    // INVOICING
    invoicedValue: job.Totals?.InvoicedValue ?? null,
    invoicePercentage: job.Totals?.InvoicePercentage ?? null,

    // FLAGS
    autoAdjustStatus: job.AutoAdjustStatus ?? null,
    isRetentionEnabled: job.IsRetentionEnabled ?? null,

    accountManagerComments: accountManagerField?.Value ?? null,

    // META
    lastSynced: new Date(),
  };
}

export async function syncJobs(
  companyId: string,
  simproCompanyId: string,
  includeArchived = false,
  onProgress?: (done: number, total: number) => void,
) {
  const start = Date.now();

  const integration = await prisma.integration.findUnique({
    where: {
      companyId_provider: {
        companyId,
        provider: "Simpro",
      },
    },
  });

  if (!integration?.apiUrl || !integration?.apiKey) {
    throw new Error("Missing Simpro integration");
  }

  const apiUrl = integration.apiUrl;
  const apiKey = integration.apiKey;

  const activeIds = await fetchJobIds(apiUrl, apiKey, simproCompanyId, false);
  const archivedIds = includeArchived
    ? await fetchJobIds(apiUrl, apiKey, simproCompanyId, true)
    : [];

  const total = activeIds.length + archivedIds.length;

  const limiter = new RateLimiter({ concurrency: 5, delayMs: 400 });
  const activeJobs = await limiter.processBatch(
    activeIds,
    (id) => fetchJobDetail(apiUrl, apiKey, simproCompanyId, id),
    onProgress,
  );

  const archivedJobs = includeArchived
    ? await limiter.processBatch(
        archivedIds,
        (id) => fetchJobDetail(apiUrl, apiKey, simproCompanyId, id),
        onProgress,
      )
    : [];

  let created = 0;
  let updated = 0;
  let archivedCount = 0;
  const errors: any[] = [];

  for (const job of activeJobs) {
    try {
      await upsertJob(companyId, job, false);
    } catch (err: any) {
      errors.push({ jobId: job.ID, error: err.message });
    }
  }

  for (const job of archivedJobs) {
    try {
      await upsertJob(companyId, job, true);
      archivedCount++;
    } catch (err: any) {
      errors.push({ jobId: job.ID, error: err.message });
    }
  }

  return {
    fetched: total,
    created,
    updated,
    archived: archivedCount,
    errors,
    durationMs: Date.now() - start,
  };
}
