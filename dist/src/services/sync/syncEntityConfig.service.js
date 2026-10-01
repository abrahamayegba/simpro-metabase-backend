"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCsvEntities = exports.updateCsvEntityConfig = exports.getSyncEntities = exports.updateSyncEntityConfig = void 0;
const prisma_1 = require("../../lib/prisma");
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
const updateSyncEntityConfig = async (data) => {
    return prisma_1.prisma.syncEntityConfig.upsert({
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
exports.updateSyncEntityConfig = updateSyncEntityConfig;
const getSyncEntities = async (companyId, provider) => {
    const configs = await prisma_1.prisma.syncEntityConfig.findMany({
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
exports.getSyncEntities = getSyncEntities;
// =====================================================
// CSV ENTITY CONFIG
// =====================================================
const updateCsvEntityConfig = async (data) => {
    return prisma_1.prisma.csvEntityConfig.upsert({
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
exports.updateCsvEntityConfig = updateCsvEntityConfig;
const getCsvEntities = async (companyId) => {
    const configs = await prisma_1.prisma.csvEntityConfig.findMany({
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
exports.getCsvEntities = getCsvEntities;
