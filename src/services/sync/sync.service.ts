import { prisma } from "../../lib/prisma";
import { SyncStatus } from "@prisma/client";

export const createSync = async (data: {
  companyId: string;
  provider: string;
  entity: string;
}) => {
  return prisma.sync.create({
    data: {
      companyId: data.companyId,
      provider: data.provider,
      entity: data.entity,
      status: SyncStatus.running,
    },
  });
};

export const completeSync = async (
  syncId: string,
  data?: {
    recordsRead?: number;
    recordsSaved?: number;
    recordsUpdated?: number;
    recordsFailed?: number;
  },
) => {
  const sync = await prisma.sync.findUnique({
    where: {
      id: syncId,
    },
  });

  if (!sync) {
    throw new Error("Sync not found");
  }

  return prisma.sync.update({
    where: {
      id: syncId,
    },
    data: {
      status: SyncStatus.completed,
      completedAt: new Date(),
      durationMs: Date.now() - sync.startedAt.getTime(),

      recordsRead: data?.recordsRead ?? 0,
      recordsSaved: data?.recordsSaved ?? 0,
      recordsUpdated: data?.recordsUpdated ?? 0,
      recordsFailed: data?.recordsFailed ?? 0,
    },
  });
};

export const failSync = async (syncId: string, errorMessage: string) => {
  const sync = await prisma.sync.findUnique({
    where: {
      id: syncId,
    },
  });

  if (!sync) {
    throw new Error("Sync not found");
  }

  return prisma.sync.update({
    where: {
      id: syncId,
    },
    data: {
      status: SyncStatus.failed,
      errorMessage,
      completedAt: new Date(),
      durationMs: Date.now() - sync.startedAt.getTime(),
    },
  });
};

export const getSyncDashboard = async (companyId: string) => {
  const entityConfigs = await prisma.syncEntityConfig.findMany({
    where: {
      companyId,
    },
  });

  const totalRecords = entityConfigs.reduce(
    (total, entity) => total + entity.totalRecords,
    0,
  );

  const syncedEntities = entityConfigs.filter(
    (entity) => entity.lastSyncStatus === SyncStatus.completed,
  ).length;

  const pendingSyncs = entityConfigs.filter(
    (entity) => entity.lastSyncStatus === SyncStatus.pending,
  ).length;

  const lastSync = await prisma.sync.findFirst({
    where: {
      companyId,
      status: SyncStatus.completed,
    },
    orderBy: {
      completedAt: "desc",
    },
  });

  const activeSyncs = await prisma.sync.count({
    where: {
      companyId,
      status: SyncStatus.running,
    },
  });

  return {
    totalRecords,

    syncedEntities: {
      completed: syncedEntities,
      total: entityConfigs.length,
    },

    pendingSyncs,

    lastSync: lastSync
      ? {
          entity: lastSync.entity,
          provider: lastSync.provider,
          completedAt: lastSync.completedAt,
        }
      : null,

    activeSyncs,
  };
};

export const getSyncById = async (id: string) => {
  return prisma.sync.findUnique({ where: { id } });
};

export const cancelSync = async (syncId: string) => {
  const sync = await prisma.sync.findUnique({
    where: { id: syncId },
  });

  if (!sync) {
    throw new Error("Sync not found");
  }

  if (sync.status !== SyncStatus.pending && sync.status !== SyncStatus.running) {
    return sync;
  }

  return prisma.sync.update({
    where: { id: syncId },
    data: {
      status: SyncStatus.cancelled,
      completedAt: new Date(),
      durationMs: Date.now() - sync.startedAt.getTime(),
      errorMessage: "Cancelled by user",
    },
  });
};

export const getActiveSyncForEntity = async (
  companyId: string,
  entity: string,
) => {
  return prisma.sync.findFirst({
    where: {
      companyId,
      entity,
      status: { in: [SyncStatus.pending, SyncStatus.running] },
    },
    orderBy: { startedAt: "desc" },
  });
};

export const getActiveSyncs = async (companyId: string) => {
  return prisma.sync.findMany({
    where: {
      companyId,
      status: { in: [SyncStatus.pending, SyncStatus.running] },
    },
    orderBy: { startedAt: "desc" },
  });
};
