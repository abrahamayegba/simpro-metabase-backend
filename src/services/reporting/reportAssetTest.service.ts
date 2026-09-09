import { prisma } from "../../lib/prisma";

interface AssetTestCsvRow {
  "Asset ID": string;
  Customer: string;
  Site: string;
  "Asset Type": string;
  "Date Tested": string;
  "Service Level": string;
  "Test Result": string;
  "Job No.": string;
  Technician: string;
  Notes: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  durationMs: number;
}

const BATCH_SIZE = 1000;

function parseDate(date: string): Date | null {
  try {
    const [day, month, year] = date.split("/");

    return new Date(Number(year), Number(month) - 1, Number(day));
  } catch {
    return null;
  }
}

function parseJobId(value: string): number | null {
  if (!value) return null;

  try {
    const jobId = value.split("-")[0];

    const parsed = Number(jobId);

    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function transformAssetTest(companyId: string, row: AssetTestCsvRow) {
  const result = row["Test Result"]?.trim() || null;

  return {
    companyId,

    simproAssetId: Number(row["Asset ID"]) || null,

    customerName: row.Customer || null,

    siteName: row.Site || null,

    assetType: row["Asset Type"] || null,

    testDate: parseDate(row["Date Tested"]),

    serviceLevelName: row["Service Level"] || null,

    testResult: result,

    passOrFail: result === "Pass" || result === "Fail" ? result : null,
    simproJobId: parseJobId(row["Job No."]),

    jobReference: row["Job No."] || null,

    employeeName: row.Technician || null,

    testNotes: row.Notes || null,

    syncedAt: new Date(),
  };
}

export async function importReportAssetTests(
  companyId: string,
  rows: AssetTestCsvRow[],
  onProgress?: (processed: number, total: number) => void,
): Promise<ImportResult> {
  const start = Date.now();

  const result: ImportResult = {
    imported: 0,
    failed: 0,
    errors: [],
    durationMs: 0,
  };

  if (!rows.length) {
    result.durationMs = Date.now() - start;
    return result;
  }

  try {
    // CSV import replaces the existing reporting snapshot
    await prisma.reportAssetTest.deleteMany({
      where: {
        companyId,
      },
    });

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      const transformedRows = [];

      for (let j = 0; j < batch.length; j++) {
        try {
          transformedRows.push(transformAssetTest(companyId, batch[j]));
        } catch (error: any) {
          result.failed++;

          result.errors.push({
            row: i + j + 1,
            error: error?.message ?? "Failed to transform row",
          });
        }
      }

      if (transformedRows.length) {
        try {
          await prisma.reportAssetTest.createMany({
            data: transformedRows,
          });

          result.imported += transformedRows.length;
        } catch (error: any) {
          result.failed += transformedRows.length;

          result.errors.push({
            row: i + 1,
            error: error?.message ?? "Failed to insert batch",
          });
        }
      }

      try {
        onProgress?.(Math.min(i + batch.length, rows.length), rows.length);
      } catch {
        // Ignore progress callback errors
      }
    }
  } catch (error: any) {
    result.errors.push({
      row: 0,
      error: error?.message ?? "Unexpected import failure",
    });
  }

  result.durationMs = Date.now() - start;

  return result;
}
