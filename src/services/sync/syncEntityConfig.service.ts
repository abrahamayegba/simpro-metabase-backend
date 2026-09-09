
import { prisma } from "../../lib/prisma";
import { SyncStatus } from "@prisma/client";

const SYNC_ENTITIES = [
  "Jobs",
  "Employees",
  "Quotes",
  "Customers",
  "Sites",
  "Assets",
  "Asset Service Levels",
  "Contractor Jobs",
  "Invoice Jobs",
  "Invoices",
  "Job Cost Centres",
  "Response Times",
  "Schedules",
  "Contractor Invoices",
];

const CSV_ENTITIES = [
  "Asset Tests",
  "Job Response Times",
  "Purchase Orders",
];

// =====================================================
// API SYNC ENTITY CONFIG
// =====================================================

export const updateSyncEntityConfig = async (data: {
  companyId: string;
  provider: string;
  entity: string;
  totalRecords: number;
  status: SyncStatus;
}) => {
  return prisma.syncEntityConfig.upsert({
    where: {
      companyId_provider_entity: {
        companyId: data.companyId,
        provider: data.provider,
        entity: data.entity,
      },
    },
    create: {
      companyId: data.companyId,
      provider: data.provider,
      entity: data.entity,
      totalRecords: data.totalRecords,
      lastSyncAt: new Date(),
      lastSyncStatus: data.status,
    },
    update: {
      totalRecords: data.totalRecords,
      lastSyncAt: new Date(),
      lastSyncStatus: data.status,
    },
  });
};

export const getSyncEntities = async (
  companyId: string,
  provider: string,
) => {

  const configs = await prisma.syncEntityConfig.findMany({
    where: {
      companyId,
      provider,
    },
  });

  return SYNC_ENTITIES.map((entity) => {
    const config = configs.find((item) => item.entity === entity);

    return {
      entity,
      totalRecords: config?.totalRecords ?? 0,
      lastSyncAt: config?.lastSyncAt ?? null,
      lastSyncStatus: config?.lastSyncStatus ?? null,
    };
  });
};

// =====================================================
// CSV ENTITY CONFIG
// =====================================================

export const updateCsvEntityConfig = async (data: {
  companyId: string;
  entity: string;
  totalRecords: number;
  status: SyncStatus;
}) => {
  return prisma.csvEntityConfig.upsert({
    where: {
      companyId_entity: {
        companyId: data.companyId,
        entity: data.entity,
      },
    },
    create: {
      companyId: data.companyId,
      entity: data.entity,
      totalRecords: data.totalRecords,
      lastUploadAt: new Date(),
      lastUploadStatus: data.status,
    },
    update: {
      totalRecords: data.totalRecords,
      lastUploadAt: new Date(),
      lastUploadStatus: data.status,
    },
  });
};

export const getCsvEntities = async (companyId: string) => {
  const configs = await prisma.csvEntityConfig.findMany({
    where: {
      companyId,
    },
  });

  return CSV_ENTITIES.map((entity) => {
    const config = configs.find((item) => item.entity === entity);

    return {
      entity,
      totalRecords: config?.totalRecords ?? 0,
      lastUploadAt: config?.lastUploadAt ?? null,
      lastUploadStatus: config?.lastUploadStatus ?? null,
    };
  });
};
