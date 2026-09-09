"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSyncs = exports.getActiveSyncForEntity = exports.cancelSync = exports.getSyncById = exports.getSyncDashboard = exports.failSync = exports.completeSync = exports.createSync = void 0;
const prisma_1 = require("../../lib/prisma");
const client_1 = require("@prisma/client");
const createSync = async (data) => {
    return prisma_1.prisma.sync.create({
        data: {
            companyId: data.companyId,
            provider: data.provider,
            entity: data.entity,
            status: client_1.SyncStatus.running,
        },
    });
};
exports.createSync = createSync;
const completeSync = async (syncId, data) => {
    const sync = await prisma_1.prisma.sync.findUnique({
        where: {
            id: syncId,
        },
    });
    if (!sync) {
        throw new Error("Sync not found");
    }
    return prisma_1.prisma.sync.update({
        where: {
            id: syncId,
        },
        data: {
            status: client_1.SyncStatus.completed,
            completedAt: new Date(),
            durationMs: Date.now() - sync.startedAt.getTime(),
            recordsRead: data?.recordsRead ?? 0,
            recordsSaved: data?.recordsSaved ?? 0,
            recordsUpdated: data?.recordsUpdated ?? 0,
            recordsFailed: data?.recordsFailed ?? 0,
        },
    });
};
exports.completeSync = completeSync;
const failSync = async (syncId, errorMessage) => {
    const sync = await prisma_1.prisma.sync.findUnique({
        where: {
            id: syncId,
        },
    });
    if (!sync) {
        throw new Error("Sync not found");
    }
    return prisma_1.prisma.sync.update({
        where: {
            id: syncId,
        },
        data: {
            status: client_1.SyncStatus.failed,
            errorMessage,
            completedAt: new Date(),
            durationMs: Date.now() - sync.startedAt.getTime(),
        },
    });
};
exports.failSync = failSync;
const getSyncDashboard = async (companyId) => {
    const entityConfigs = await prisma_1.prisma.syncEntityConfig.findMany({
        where: {
            companyId,
        },
    });
    const totalRecords = entityConfigs.reduce((total, entity) => total + entity.totalRecords, 0);
    const syncedEntities = entityConfigs.filter((entity) => entity.lastSyncStatus === client_1.SyncStatus.completed).length;
    const pendingSyncs = entityConfigs.filter((entity) => entity.lastSyncStatus === client_1.SyncStatus.pending).length;
    const lastSync = await prisma_1.prisma.sync.findFirst({
        where: {
            companyId,
            status: client_1.SyncStatus.completed,
        },
        orderBy: {
            completedAt: "desc",
        },
    });
    const activeSyncs = await prisma_1.prisma.sync.count({
        where: {
            companyId,
            status: client_1.SyncStatus.running,
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
exports.getSyncDashboard = getSyncDashboard;
const getSyncById = async (id) => {
    return prisma_1.prisma.sync.findUnique({ where: { id } });
};
exports.getSyncById = getSyncById;
const cancelSync = async (syncId) => {
    const sync = await prisma_1.prisma.sync.findUnique({
        where: { id: syncId },
    });
    if (!sync) {
        throw new Error("Sync not found");
    }
    if (sync.status !== client_1.SyncStatus.pending && sync.status !== client_1.SyncStatus.running) {
        return sync;
    }
    return prisma_1.prisma.sync.update({
        where: { id: syncId },
        data: {
            status: client_1.SyncStatus.cancelled,
            completedAt: new Date(),
            durationMs: Date.now() - sync.startedAt.getTime(),
            errorMessage: "Cancelled by user",
        },
    });
};
exports.cancelSync = cancelSync;
const getActiveSyncForEntity = async (companyId, entity) => {
    return prisma_1.prisma.sync.findFirst({
        where: {
            companyId,
            entity,
            status: { in: [client_1.SyncStatus.pending, client_1.SyncStatus.running] },
        },
        orderBy: { startedAt: "desc" },
    });
};
exports.getActiveSyncForEntity = getActiveSyncForEntity;
const getActiveSyncs = async (companyId) => {
    return prisma_1.prisma.sync.findMany({
        where: {
            companyId,
            status: { in: [client_1.SyncStatus.pending, client_1.SyncStatus.running] },
        },
        orderBy: { startedAt: "desc" },
    });
};
exports.getActiveSyncs = getActiveSyncs;
