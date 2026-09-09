-- CreateTable
CREATE TABLE "CsvEntityConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "lastUploadAt" TIMESTAMP(3),
    "lastUploadStatus" "SyncStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsvEntityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CsvEntityConfig_companyId_idx" ON "CsvEntityConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CsvEntityConfig_companyId_entity_key" ON "CsvEntityConfig"("companyId", "entity");

-- AddForeignKey
ALTER TABLE "CsvEntityConfig" ADD CONSTRAINT "CsvEntityConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
