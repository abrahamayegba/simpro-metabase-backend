-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "industry" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeCompanyId" TEXT,
    "refreshTokenHash" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT,
    "apiUrl" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyIdValue" TEXT,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "doNotCall" BOOLEAN NOT NULL DEFAULT false,
    "altPhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "fax" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "customerType" TEXT,
    "amountOwing" DECIMAL(10,2),
    "creditLimit" DECIMAL(10,2),
    "onStop" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "accountManagerId" INTEGER,
    "customerProfileId" INTEGER,
    "customerGroupId" INTEGER,
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountManagerName" TEXT,
    "alwaysDeductCIS" BOOLEAN,
    "bankAccountName" TEXT,
    "bankAccountNo" TEXT,
    "bankRoutingNo" TEXT,
    "companyNumber" TEXT,
    "currency" TEXT,
    "customerGroupName" TEXT,
    "customerProfileName" TEXT,
    "discountFee" DECIMAL(10,2),
    "ein" TEXT,
    "labourReverseTaxEnabled" BOOLEAN,
    "labourTaxCodeCode" TEXT,
    "labourTaxCodeId" INTEGER,
    "labourTaxCodeRate" DECIMAL(5,2),
    "labourTaxCodeType" TEXT,
    "materialMarkup" DECIMAL(10,2),
    "materialPricingTierId" INTEGER,
    "materialPricingTierMarkup" DECIMAL(10,2),
    "materialPricingTierName" TEXT,
    "partReverseTaxEnabled" BOOLEAN,
    "partTaxCodeCode" TEXT,
    "partTaxCodeId" INTEGER,
    "partTaxCodeRate" DECIMAL(5,2),
    "partTaxCodeType" TEXT,
    "paymentMethodId" INTEGER,
    "paymentMethodName" TEXT,
    "paymentTermDays" INTEGER,
    "paymentTermId" INTEGER,
    "paymentTermType" TEXT,
    "preferredTechs" JSONB,
    "profileNotes" TEXT,
    "retentionType" TEXT,
    "serviceFeeId" INTEGER,
    "serviceFeeName" TEXT,
    "serviceJobCostCenterId" INTEGER,
    "serviceJobCostCenterName" TEXT,
    "tags" JSONB,
    "vendorOrderNoRequired" BOOLEAN,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" INTEGER,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingContact" TEXT,
    "billingCountry" TEXT,
    "billingPostalCode" TEXT,
    "billingState" TEXT,
    "primaryContactCellPhone" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactFamilyName" TEXT,
    "primaryContactFax" TEXT,
    "primaryContactGivenName" TEXT,
    "primaryContactId" INTEGER,
    "primaryContactNotification" TEXT,
    "primaryContactPosition" TEXT,
    "primaryContactTitle" TEXT,
    "primaryContactWorkPhone" TEXT,
    "privateNotes" TEXT,
    "publicNotes" TEXT,
    "serviceFeeId" INTEGER,
    "serviceFeeName" TEXT,
    "stcZone" INTEGER,
    "veecZone" TEXT,
    "zoneId" INTEGER,
    "zoneName" TEXT,
    "customerName" TEXT,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "customerId" INTEGER,
    "siteId" INTEGER,
    "stage" TEXT,
    "jobType" TEXT,
    "priority" TEXT,
    "totalExTax" DECIMAL(10,2),
    "totalTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "materialsCostActual" DECIMAL(10,2),
    "materialsCostEstimate" DECIMAL(10,2),
    "laborHoursActual" DECIMAL(10,2),
    "laborHoursEstimate" DECIMAL(10,2),
    "grossProfitActual" DECIMAL(10,2),
    "grossMarginActual" DECIMAL(10,2),
    "invoicedValue" DECIMAL(10,2),
    "dateCreated" TIMESTAMP(3),
    "dateScheduled" TIMESTAMP(3),
    "dateCompleted" TIMESTAMP(3),
    "dateInvoiced" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "adjustedActual" DECIMAL(10,2),
    "adjustedEstimate" DECIMAL(10,2),
    "adjustedRevised" DECIMAL(10,2),
    "autoAdjustStatus" BOOLEAN,
    "commissionActual" DECIMAL(10,2),
    "commissionEstimate" DECIMAL(10,2),
    "commissionRevised" DECIMAL(10,2),
    "convertedFromDate" TIMESTAMP(3),
    "convertedFromId" INTEGER,
    "convertedFromQuoteDescription" TEXT,
    "convertedFromQuoteExTax" DECIMAL(10,2),
    "convertedFromQuoteId" INTEGER,
    "convertedFromQuoteIncTax" DECIMAL(10,2),
    "convertedFromQuoteTax" DECIMAL(10,2),
    "convertedFromType" TEXT,
    "customerContactFamilyName" TEXT,
    "customerContactGivenName" TEXT,
    "customerContactId" INTEGER,
    "customerContractEndDate" TIMESTAMP(3),
    "customerContractId" INTEGER,
    "customerContractName" TEXT,
    "customerContractNo" TEXT,
    "customerContractStartDate" TIMESTAMP(3),
    "customerFamilyName" TEXT,
    "customerGivenName" TEXT,
    "customerName" TEXT,
    "dateIssued" TIMESTAMP(3),
    "discount" DECIMAL(10,2),
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "grossMarginEstimate" DECIMAL(10,2),
    "grossMarginRevised" DECIMAL(10,2),
    "grossProfitEstimate" DECIMAL(10,2),
    "grossProfitRevised" DECIMAL(10,2),
    "invoicePercentage" DECIMAL(10,2),
    "isRetentionEnabled" BOOLEAN,
    "isVariation" BOOLEAN,
    "laborActual" DECIMAL(10,2),
    "laborCommitted" DECIMAL(10,2),
    "laborEstimate" DECIMAL(10,2),
    "laborHoursCommitted" DECIMAL(10,2),
    "laborHoursRevised" DECIMAL(10,2),
    "laborRevised" DECIMAL(10,2),
    "materialsCostCommitted" DECIMAL(10,2),
    "materialsCostRevised" DECIMAL(10,2),
    "materialsMarkupActual" DECIMAL(10,2),
    "materialsMarkupEstimate" DECIMAL(10,2),
    "materialsMarkupRevised" DECIMAL(10,2),
    "membershipDiscount" DECIMAL(10,2),
    "nettMarginActual" DECIMAL(10,2),
    "nettMarginEstimate" DECIMAL(10,2),
    "nettMarginRevised" DECIMAL(10,2),
    "nettProfitActual" DECIMAL(10,2),
    "nettProfitEstimate" DECIMAL(10,2),
    "nettProfitRevised" DECIMAL(10,2),
    "notes" TEXT,
    "orderNo" TEXT,
    "overheadActual" DECIMAL(10,2),
    "overheadCommitted" DECIMAL(10,2),
    "overheadEstimate" DECIMAL(10,2),
    "overheadRevised" DECIMAL(10,2),
    "plantActual" DECIMAL(10,2),
    "plantCommitted" DECIMAL(10,2),
    "plantEstimate" DECIMAL(10,2),
    "plantHoursActual" DECIMAL(10,2),
    "plantHoursEstimate" DECIMAL(10,2),
    "plantHoursRevised" DECIMAL(10,2),
    "plantRevised" DECIMAL(10,2),
    "projectManagerId" INTEGER,
    "projectManagerName" TEXT,
    "projectManagerType" TEXT,
    "projectManagerTypeId" INTEGER,
    "requestNo" TEXT,
    "resourcesCostActual" DECIMAL(10,2),
    "resourcesCostCommitted" DECIMAL(10,2),
    "resourcesCostEstimate" DECIMAL(10,2),
    "resourcesCostRevised" DECIMAL(10,2),
    "resourcesMarkupActual" DECIMAL(10,2),
    "resourcesMarkupEstimate" DECIMAL(10,2),
    "resourcesMarkupRevised" DECIMAL(10,2),
    "responseTimeDays" INTEGER,
    "responseTimeHours" INTEGER,
    "responseTimeId" INTEGER,
    "responseTimeMinutes" INTEGER,
    "responseTimeName" TEXT,
    "salespersonId" INTEGER,
    "salespersonName" TEXT,
    "salespersonType" TEXT,
    "salespersonTypeId" INTEGER,
    "siteContactFamilyName" TEXT,
    "siteContactGivenName" TEXT,
    "siteContactId" INTEGER,
    "siteName" TEXT,
    "statusColor" TEXT,
    "statusId" INTEGER,
    "statusName" TEXT,
    "stcValue" DECIMAL(10,2),
    "stcsEligible" BOOLEAN,
    "tags" JSONB,
    "technicianId" INTEGER,
    "technicianName" TEXT,
    "technicianType" TEXT,
    "technicianTypeId" INTEGER,
    "technicians" JSONB,
    "type" TEXT,
    "veecValue" DECIMAL(10,2),
    "veecsEligible" BOOLEAN,
    "accountManagerComments" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "customerId" INTEGER,
    "siteId" INTEGER,
    "totalExTax" DECIMAL(10,2),
    "totalTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "convertedToJob" BOOLEAN NOT NULL DEFAULT false,
    "jobId" INTEGER,
    "dateCreated" TIMESTAMP(3),
    "dateSent" TIMESTAMP(3),
    "dateAccepted" TIMESTAMP(3),
    "dateExpires" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjustedEstimate" DECIMAL(10,2),
    "adjustedRevised" DECIMAL(10,2),
    "archiveReasonId" INTEGER,
    "archiveReasonName" TEXT,
    "commissionEstimate" DECIMAL(10,2),
    "commissionRevised" DECIMAL(10,2),
    "convertedFromLeadDateCreated" TIMESTAMP(3),
    "convertedFromLeadId" INTEGER,
    "convertedFromLeadName" TEXT,
    "customerContactFamilyName" TEXT,
    "customerContactGivenName" TEXT,
    "customerContactId" INTEGER,
    "customerFamilyName" TEXT,
    "customerGivenName" TEXT,
    "customerName" TEXT,
    "customerStage" TEXT,
    "dateApproved" TIMESTAMP(3),
    "dateIssued" TIMESTAMP(3),
    "discount" DECIMAL(10,2),
    "dueDate" TIMESTAMP(3),
    "forecastMonth" INTEGER,
    "forecastPercent" DECIMAL(10,2),
    "forecastYear" INTEGER,
    "isClosed" BOOLEAN,
    "isVariation" BOOLEAN,
    "jobNo" TEXT,
    "laborEstimate" DECIMAL(10,2),
    "laborHoursEstimate" DECIMAL(10,2),
    "laborHoursRevised" DECIMAL(10,2),
    "laborRevised" DECIMAL(10,2),
    "linkedJobId" INTEGER,
    "materialsCostEstimate" DECIMAL(10,2),
    "materialsCostRevised" DECIMAL(10,2),
    "materialsMarkupEstimate" DECIMAL(10,2),
    "materialsMarkupRevised" DECIMAL(10,2),
    "membershipDiscount" DECIMAL(10,2),
    "notes" TEXT,
    "orderNo" TEXT,
    "overheadEstimate" DECIMAL(10,2),
    "overheadRevised" DECIMAL(10,2),
    "plantEstimate" DECIMAL(10,2),
    "plantHoursEstimate" DECIMAL(10,2),
    "plantHoursRevised" DECIMAL(10,2),
    "plantRevised" DECIMAL(10,2),
    "projectManagerId" INTEGER,
    "projectManagerName" TEXT,
    "projectManagerType" TEXT,
    "projectManagerTypeId" INTEGER,
    "requestNo" TEXT,
    "resourcesCostEstimate" DECIMAL(10,2),
    "resourcesCostRevised" DECIMAL(10,2),
    "resourcesMarkupEstimate" DECIMAL(10,2),
    "resourcesMarkupRevised" DECIMAL(10,2),
    "salespersonId" INTEGER,
    "salespersonName" TEXT,
    "salespersonType" TEXT,
    "salespersonTypeId" INTEGER,
    "siteContactFamilyName" TEXT,
    "siteContactGivenName" TEXT,
    "siteContactId" INTEGER,
    "siteName" TEXT,
    "stage" TEXT,
    "statusColor" TEXT,
    "statusId" INTEGER,
    "statusName" TEXT,
    "stcValue" DECIMAL(10,2),
    "stcsEligible" BOOLEAN,
    "technicianId" INTEGER,
    "technicianName" TEXT,
    "technicianType" TEXT,
    "technicianTypeId" INTEGER,
    "type" TEXT,
    "validityDays" INTEGER,
    "veecValue" DECIMAL(10,2),
    "veecsEligible" BOOLEAN,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "workPhone" TEXT,
    "isSalesperson" BOOLEAN NOT NULL DEFAULT false,
    "isProjectManager" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "payRate" DECIMAL(10,2),
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNo" TEXT,
    "bankRoutingNo" TEXT,
    "cellPhone" TEXT,
    "city" TEXT,
    "country" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfHire" TIMESTAMP(3),
    "defaultCompanyId" INTEGER,
    "defaultCompanyName" TEXT,
    "defaultZoneId" INTEGER,
    "defaultZoneName" TEXT,
    "emergencyContactAddress" TEXT,
    "emergencyContactAltPhone" TEXT,
    "emergencyContactCellPhone" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContactWorkPhone" TEXT,
    "employmentCost" DECIMAL(10,2),
    "extension" TEXT,
    "fax" TEXT,
    "isMobility" BOOLEAN,
    "mobileSecurityGroupId" INTEGER,
    "mobileSecurityGroupName" TEXT,
    "overheadCost" DECIMAL(10,2),
    "postalCode" TEXT,
    "preferredLanguage" TEXT,
    "preferredNotificationMethod" TEXT,
    "secondaryEmail" TEXT,
    "securityGroupId" INTEGER,
    "securityGroupName" TEXT,
    "state" TEXT,
    "storageDeviceId" INTEGER,
    "storageDeviceName" TEXT,
    "username" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCostCenter" (
    "id" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "costCenterId" INTEGER,
    "costCenterName" TEXT,
    "name" TEXT,
    "header" TEXT,
    "totalExTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "materialsCostActual" DECIMAL(10,2),
    "laborHoursActual" DECIMAL(10,2),
    "percentComplete" INTEGER,
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjustedActual" DECIMAL(10,2),
    "adjustedEstimate" DECIMAL(10,2),
    "adjustedRevised" DECIMAL(10,2),
    "autoAdjustDates" BOOLEAN,
    "claimedExTaxRemaining" DECIMAL(10,2),
    "claimedExTaxToDate" DECIMAL(10,2),
    "claimedIncTaxRemaining" DECIMAL(10,2),
    "claimedIncTaxToDate" DECIMAL(10,2),
    "claimedPercentRemaining" DECIMAL(10,2),
    "claimedPercentToDate" DECIMAL(10,2),
    "commissionActual" DECIMAL(10,2),
    "commissionEstimate" DECIMAL(10,2),
    "commissionRevised" DECIMAL(10,2),
    "description" TEXT,
    "discount" DECIMAL(10,2),
    "displayOrder" INTEGER,
    "endDate" TIMESTAMP(3),
    "grossMarginActual" DECIMAL(10,2),
    "grossMarginEstimate" DECIMAL(10,2),
    "grossMarginRevised" DECIMAL(10,2),
    "grossProfitActual" DECIMAL(10,2),
    "grossProfitEstimate" DECIMAL(10,2),
    "grossProfitRevised" DECIMAL(10,2),
    "invoicePercentage" DECIMAL(10,2),
    "invoicedValue" DECIMAL(10,2),
    "itemsLocked" BOOLEAN,
    "laborActual" DECIMAL(10,2),
    "laborCommitted" DECIMAL(10,2),
    "laborEstimate" DECIMAL(10,2),
    "laborHoursCommitted" DECIMAL(10,2),
    "laborHoursEstimate" DECIMAL(10,2),
    "laborHoursRevised" DECIMAL(10,2),
    "laborRevised" DECIMAL(10,2),
    "lockedIsLocked" BOOLEAN,
    "lockedType" TEXT,
    "materialsCostCommitted" DECIMAL(10,2),
    "materialsCostEstimate" DECIMAL(10,2),
    "materialsCostRevised" DECIMAL(10,2),
    "materialsMarkupActual" DECIMAL(10,2),
    "materialsMarkupEstimate" DECIMAL(10,2),
    "materialsMarkupRevised" DECIMAL(10,2),
    "membershipDiscount" DECIMAL(10,2),
    "nettMarginActual" DECIMAL(10,2),
    "nettMarginEstimate" DECIMAL(10,2),
    "nettMarginRevised" DECIMAL(10,2),
    "nettProfitActual" DECIMAL(10,2),
    "nettProfitEstimate" DECIMAL(10,2),
    "nettProfitRevised" DECIMAL(10,2),
    "notes" TEXT,
    "orderNo" TEXT,
    "overheadActual" DECIMAL(10,2),
    "overheadCommitted" DECIMAL(10,2),
    "overheadEstimate" DECIMAL(10,2),
    "overheadRevised" DECIMAL(10,2),
    "plantActual" DECIMAL(10,2),
    "plantCommitted" DECIMAL(10,2),
    "plantEstimate" DECIMAL(10,2),
    "plantHoursActual" DECIMAL(10,2),
    "plantHoursEstimate" DECIMAL(10,2),
    "plantHoursRevised" DECIMAL(10,2),
    "plantRevised" DECIMAL(10,2),
    "resourcesCostActual" DECIMAL(10,2),
    "resourcesCostCommitted" DECIMAL(10,2),
    "resourcesCostEstimate" DECIMAL(10,2),
    "resourcesCostRevised" DECIMAL(10,2),
    "resourcesMarkupActual" DECIMAL(10,2),
    "resourcesMarkupEstimate" DECIMAL(10,2),
    "resourcesMarkupRevised" DECIMAL(10,2),
    "siteId" INTEGER,
    "siteName" TEXT,
    "stage" TEXT,
    "startDate" TIMESTAMP(3),
    "stcs" DECIMAL(10,2),
    "taxCodeCode" TEXT,
    "taxCodeId" INTEGER,
    "taxCodeRate" DECIMAL(10,2),
    "taxCodeType" TEXT,
    "totalTax" DECIMAL(10,2),
    "variation" BOOLEAN,
    "variationApprovalDate" TIMESTAMP(3),
    "veecs" DECIMAL(10,2),

    CONSTRAINT "JobCostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAsset" (
    "id" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "customerId" INTEGER,
    "siteId" INTEGER,
    "assetNumber" TEXT,
    "name" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "status" TEXT,
    "purchaseValue" DECIMAL(10,2),
    "replacementCost" DECIMAL(10,2),
    "lastServiceDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN,
    "assetTypeId" INTEGER,
    "assetTypeName" TEXT,
    "contractEndDate" TIMESTAMP(3),
    "contractExpired" BOOLEAN,
    "contractId" INTEGER,
    "contractName" TEXT,
    "contractNo" TEXT,
    "contractStartDate" TIMESTAMP(3),
    "displayOrder" INTEGER,
    "lastTestDate" TIMESTAMP(3),
    "lastTestResult" TEXT,
    "lastTestServiceLevelId" INTEGER,
    "lastTestServiceLevelName" TEXT,
    "parentId" INTEGER,
    "startDate" TIMESTAMP(3),
    "siteName" TEXT,
    "customerName" TEXT,

    CONSTRAINT "CustomerAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTestHistory" (
    "id" SERIAL NOT NULL,
    "assetId" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "testStatus" TEXT,
    "passOrFail" TEXT,
    "testDate" TIMESTAMP(3),
    "nextTestDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobDateIssued" TIMESTAMP(3),
    "jobDueDate" TIMESTAMP(3),
    "jobId" INTEGER,
    "quoteDateIssued" TIMESTAMP(3),
    "quoteDueDate" TIMESTAMP(3),
    "quoteId" INTEGER,
    "serviceLevelId" INTEGER,
    "serviceLevelName" TEXT,
    "testEmployeeId" INTEGER,
    "testEmployeeName" TEXT,
    "testNotes" TEXT,
    "testResult" TEXT,
    "assetType" TEXT,

    CONSTRAINT "AssetTestHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorJob" (
    "id" INTEGER NOT NULL,
    "jobId" INTEGER,
    "companyId" TEXT NOT NULL,
    "projectType" TEXT,
    "contractorId" INTEGER,
    "contractorName" TEXT,
    "status" TEXT,
    "contractedAmount" DECIMAL(10,2),
    "totalExTax" DECIMAL(10,2),
    "dateIssued" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractorContact" TEXT,
    "contractorSupplyMaterials" BOOLEAN,
    "createdById" INTEGER,
    "createdByName" TEXT,
    "createdByType" TEXT,
    "createdByTypeId" INTEGER,
    "currency" TEXT,
    "description" TEXT,
    "exchangeRate" DECIMAL(10,6),
    "labor" DECIMAL(10,2),
    "materials" DECIMAL(10,2),
    "retentionAmount" DECIMAL(10,2),
    "retentionPerClaim" DECIMAL(10,2),
    "retentionPeriodMonths" INTEGER,
    "reverseChargeTax" DECIMAL(10,2),
    "taxCodeCode" TEXT,
    "taxCodeId" INTEGER,
    "taxCodeRate" DECIMAL(10,2),
    "taxCodeType" TEXT,
    "totalIncTax" DECIMAL(10,2),

    CONSTRAINT "ContractorJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_raw_asset_service_levels" (
    "Name" TEXT,
    "Years" TEXT,
    "Months" TEXT,
    "Days" TEXT,
    "Service Start Date" TEXT,
    "Asset ID" TEXT,
    "Next Service Date" TEXT
);

-- CreateTable
CREATE TABLE "simpro_raw_asset_tests" (
    "Job ID" TEXT,
    "Employee ID" TEXT,
    "Employee Name" TEXT,
    "Contractor ID" TEXT,
    "Contractor Name" TEXT,
    "Service Level Name" TEXT,
    "Asset ID" TEXT,
    "Asset Type" TEXT,
    "Result" TEXT,
    "Date Tested" TEXT,
    "Job Costcentre Asset ID" TEXT,
    "Assets Test Notes" TEXT
);

-- CreateTable
CREATE TABLE "simpro_raw_assets" (
    "Asset ID" TEXT,
    "Asset Type" TEXT,
    "Display Order" TEXT,
    "Custom Fields" TEXT,
    "Customer ID" TEXT,
    "Customer Name" TEXT,
    "Site ID" TEXT,
    "Site Name" TEXT,
    "Contract ID" TEXT,
    "Contract Name" TEXT,
    "Parent Asset ID" TEXT,
    "Removed" TEXT,
    "Top Parent Asset ID" TEXT
);

-- CreateTable
CREATE TABLE "simpro_raw_job_response_times" (
    "Job Response Time ID" TEXT,
    "Job ID" TEXT,
    "Response Time ID" TEXT,
    "Created" TEXT,
    "Due" TEXT,
    "Job Start Time" TEXT,
    "Response Time Achieved" TEXT
);

-- CreateTable
CREATE TABLE "simpro_report_asset_service_levels" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "asset_id" INTEGER,
    "service_level_name" TEXT,
    "interval_years" INTEGER,
    "interval_months" INTEGER,
    "interval_days" INTEGER,
    "service_start_date" DATE,
    "next_service_date" DATE,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_asset_service_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_asset_tests" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "asset_id" INTEGER,
    "asset_type" TEXT,
    "job_id" INTEGER,
    "employee_id" INTEGER,
    "employee_name" TEXT,
    "contractor_id" INTEGER,
    "contractor_name" TEXT,
    "service_level_name" TEXT,
    "test_result" TEXT,
    "test_date" DATE,
    "test_notes" TEXT,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_asset_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_assets" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "asset_id" INTEGER,
    "asset_type" TEXT,
    "display_order" INTEGER,
    "customer_id" INTEGER,
    "customer_name" TEXT,
    "site_id" INTEGER,
    "site_name" TEXT,
    "contract_id" INTEGER,
    "contract_name" TEXT,
    "parent_asset_id" INTEGER,
    "top_parent_asset_id" INTEGER,
    "removed" BOOLEAN,
    "custom_fields" TEXT,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_job_response_times" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "job_response_time_id" INTEGER,
    "job_id" INTEGER,
    "response_time_id" INTEGER,
    "created_at" TIMESTAMP(6),
    "due_at" TIMESTAMP(6),
    "job_start_time" TIMESTAMP(6),
    "response_time_achieved" BOOLEAN,
    "response_minutes" INTEGER,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_job_response_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_raw_invoice_jobs" (
    "Job ID" TEXT,
    "Invoice ID" TEXT,
    "Invoice No" TEXT,
    "Company ID" TEXT,
    "Order No" TEXT,
    "Status" TEXT
);

-- CreateTable
CREATE TABLE "simpro_raw_invoices" (
    "Invoice ID" TEXT,
    "Invoice No" TEXT,
    "Company ID" TEXT,
    "Invoice Type" TEXT,
    "Claim No" TEXT,
    "Date Issued" TEXT,
    "Period Start" TEXT,
    "Period End" TEXT,
    "Due Date" TEXT,
    "Stage" TEXT,
    "Per Item" TEXT,
    "Category" TEXT,
    "Comment" TEXT,
    "Total Price Ex" TEXT,
    "Total Price Inc" TEXT,
    "Total Discount" TEXT,
    "Total Retention Ex" TEXT,
    "Total Retention Inc" TEXT,
    "Credit" TEXT,
    "Job ID" TEXT,
    "Recurring Invoice ID" TEXT,
    "Customer ID" TEXT,
    "Customer" TEXT,
    "Customer Contract ID" TEXT,
    "Recurring" TEXT,
    "Voided" TEXT
);

-- CreateTable
CREATE TABLE "simpro_raw_response_times" (
    "Response Time ID" TEXT,
    "Name" TEXT,
    "Removed" TEXT
);

-- CreateTable
CREATE TABLE "simpro_raw_schedules" (
    "Schedule ID" TEXT,
    "Schedule Block ID" TEXT,
    "Date" TEXT,
    "Start Time" TEXT,
    "End Time" TEXT,
    "Hours" TEXT,
    "Schedule Rate" TEXT,
    "Employee ID" TEXT,
    "Employee Name" TEXT,
    "Contractor ID" TEXT,
    "Contractor Name" TEXT,
    "Type" TEXT,
    "Pay Rate Cost" TEXT,
    "Overhead Cost" TEXT,
    "Employment Cost" TEXT,
    "Job ID" TEXT,
    "Lead ID" TEXT,
    "Quote ID" TEXT,
    "Job Costcentre ID" TEXT,
    "Quote Cost Centre ID" TEXT,
    "Plant ID" TEXT,
    "Plant Name" TEXT
);

-- CreateTable
CREATE TABLE "simpro_report_invoice_jobs" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" INTEGER,
    "invoice_no" TEXT,
    "job_id" INTEGER,
    "order_no" TEXT,
    "job_invoice_status" TEXT,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_invoice_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_invoices" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "invoice_id" INTEGER,
    "invoice_no" TEXT,
    "invoice_type" TEXT,
    "job_id" INTEGER,
    "customer_id" INTEGER,
    "customer_name" TEXT,
    "date_issued" DATE,
    "due_date" DATE,
    "period_start" DATE,
    "period_end" DATE,
    "stage" TEXT,
    "total_price_ex" DECIMAL,
    "total_price_inc" DECIMAL,
    "total_discount" DECIMAL,
    "is_credit" BOOLEAN,
    "is_recurring" BOOLEAN,
    "is_voided" BOOLEAN,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_response_times" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "response_time_id" INTEGER NOT NULL,
    "name" TEXT,
    "removed" BOOLEAN,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_response_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_schedules" (
    "id" SERIAL NOT NULL,
    "company_id" TEXT NOT NULL,
    "schedule_id" INTEGER,
    "schedule_block_id" INTEGER,
    "schedule_date" DATE,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "hours" DECIMAL,
    "schedule_rate" TEXT,
    "employee_id" INTEGER,
    "employee_name" TEXT,
    "contractor_id" INTEGER,
    "contractor_name" TEXT,
    "type" TEXT,
    "pay_rate_cost" DECIMAL,
    "overhead_cost" DECIMAL,
    "employment_cost" DECIMAL,
    "job_id" INTEGER,
    "lead_id" INTEGER,
    "quote_id" INTEGER,
    "job_costcentre_id" INTEGER,
    "quote_costcentre_id" INTEGER,
    "plant_id" INTEGER,
    "plant_name" TEXT,
    "last_synced" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simpro_report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simpro_report_purchase_orders" (
    "Order_No" INTEGER NOT NULL,
    "Storage_Device" TEXT NOT NULL,
    "Date_Issued" TIMESTAMP(3) NOT NULL,
    "Supplier" TEXT NOT NULL,
    "Supplier_ID" INTEGER NOT NULL,
    "Quote_No" TEXT,
    "Reference" TEXT,
    "Job_ID" INTEGER,
    "Date_Due" TIMESTAMP(3),
    "Status" TEXT NOT NULL,
    "Stage" TEXT NOT NULL,
    "Sub_Total" DECIMAL(10,2),
    "Total" DECIMAL(10,2),
    "Tax" DECIMAL(10,2),
    "Pending" BOOLEAN NOT NULL DEFAULT false,
    "Received" BOOLEAN NOT NULL DEFAULT false,
    "Completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "simpro_report_purchase_orders_pkey" PRIMARY KEY ("Order_No")
);

-- CreateTable
CREATE TABLE "Sync" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "entity" TEXT NOT NULL,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "recordsSaved" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "Sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEntity" (
    "id" TEXT NOT NULL,
    "syncId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "records" INTEGER NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEntityConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" "SyncStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncEntityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_customers" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproCustomerId" INTEGER,
    "companyName" TEXT,
    "phone" TEXT,
    "altPhone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "customerType" TEXT,
    "amountOwing" DECIMAL(10,2),
    "creditLimit" DECIMAL(10,2),
    "doNotCall" BOOLEAN,
    "onStop" BOOLEAN,
    "archived" BOOLEAN,
    "accountManagerId" INTEGER,
    "accountManagerName" TEXT,
    "customerProfileId" INTEGER,
    "customerProfileName" TEXT,
    "customerGroupId" INTEGER,
    "customerGroupName" TEXT,
    "currency" TEXT,
    "paymentMethodId" INTEGER,
    "paymentMethodName" TEXT,
    "paymentTermId" INTEGER,
    "paymentTermDays" INTEGER,
    "paymentTermType" TEXT,
    "profileNotes" TEXT,
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sites" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproSiteId" INTEGER,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "name" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "suburb" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingState" TEXT,
    "billingPostalCode" TEXT,
    "billingCountry" TEXT,
    "primaryContactId" INTEGER,
    "primaryContactGivenName" TEXT,
    "primaryContactFamilyName" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactWorkPhone" TEXT,
    "primaryContactCellPhone" TEXT,
    "archived" BOOLEAN,
    "zoneId" INTEGER,
    "zoneName" TEXT,
    "stcZone" INTEGER,
    "veecZone" TEXT,
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproEmployeeId" INTEGER,
    "name" TEXT,
    "position" TEXT,
    "email" TEXT,
    "secondaryEmail" TEXT,
    "workPhone" TEXT,
    "cellPhone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "payRate" DECIMAL(10,2),
    "employmentCost" DECIMAL(10,2),
    "overheadCost" DECIMAL(10,2),
    "isSalesperson" BOOLEAN,
    "isProjectManager" BOOLEAN,
    "archived" BOOLEAN,
    "dateOfBirth" TIMESTAMP(3),
    "dateOfHire" TIMESTAMP(3),
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_assets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproAssetId" INTEGER,
    "assetType" TEXT,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "simproSiteId" INTEGER,
    "siteName" TEXT,
    "contractId" INTEGER,
    "contractName" TEXT,
    "parentAssetId" INTEGER,
    "topParentAssetId" INTEGER,
    "displayOrder" INTEGER,
    "removed" BOOLEAN,
    "customFields" TEXT,
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_asset_service_levels" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproAssetId" INTEGER,
    "serviceLevelName" TEXT,
    "intervalYears" INTEGER,
    "intervalMonths" INTEGER,
    "intervalDays" INTEGER,
    "serviceStartDate" TIMESTAMP(3),
    "nextServiceDate" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_asset_service_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproJobId" INTEGER,
    "reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "orderNo" TEXT,
    "requestNo" TEXT,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "customerGivenName" TEXT,
    "customerFamilyName" TEXT,
    "customerContactId" INTEGER,
    "customerContactGivenName" TEXT,
    "customerContactFamilyName" TEXT,
    "customerContractId" INTEGER,
    "customerContractName" TEXT,
    "customerContractNo" TEXT,
    "customerContractStartDate" TIMESTAMP(3),
    "customerContractEndDate" TIMESTAMP(3),
    "simproSiteId" INTEGER,
    "siteName" TEXT,
    "siteContactId" INTEGER,
    "siteContactGivenName" TEXT,
    "siteContactFamilyName" TEXT,
    "stage" TEXT,
    "statusId" INTEGER,
    "statusName" TEXT,
    "statusColor" TEXT,
    "jobType" TEXT,
    "type" TEXT,
    "priority" TEXT,
    "isVariation" BOOLEAN,
    "isRetentionEnabled" BOOLEAN,
    "technicianId" INTEGER,
    "technicianName" TEXT,
    "projectManagerId" INTEGER,
    "projectManagerName" TEXT,
    "salespersonId" INTEGER,
    "salespersonName" TEXT,
    "accountManagerComments" TEXT,
    "responseTimeId" INTEGER,
    "responseTimeName" TEXT,
    "responseTimeDays" INTEGER,
    "responseTimeHours" INTEGER,
    "responseTimeMinutes" INTEGER,
    "totalExTax" DECIMAL(10,2),
    "totalTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "invoicedValue" DECIMAL(10,2),
    "invoicePercentage" DECIMAL(10,2),
    "grossProfitActual" DECIMAL(10,2),
    "grossMarginActual" DECIMAL(10,2),
    "laborActual" DECIMAL(10,2),
    "laborEstimate" DECIMAL(10,2),
    "laborHoursActual" DECIMAL(10,2),
    "laborHoursEstimate" DECIMAL(10,2),
    "materialsCostActual" DECIMAL(10,2),
    "materialsCostEstimate" DECIMAL(10,2),
    "convertedFromQuoteId" INTEGER,
    "convertedFromDate" TIMESTAMP(3),
    "archived" BOOLEAN,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "dateIssued" TIMESTAMP(3),
    "dateCreated" TIMESTAMP(3),
    "dateScheduled" TIMESTAMP(3),
    "dateCompleted" TIMESTAMP(3),
    "dateInvoiced" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_quotes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproQuoteId" INTEGER,
    "reference" TEXT,
    "name" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "orderNo" TEXT,
    "requestNo" TEXT,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "customerGivenName" TEXT,
    "customerFamilyName" TEXT,
    "customerStage" TEXT,
    "customerContactId" INTEGER,
    "customerContactGivenName" TEXT,
    "customerContactFamilyName" TEXT,
    "simproSiteId" INTEGER,
    "siteName" TEXT,
    "siteContactId" INTEGER,
    "siteContactGivenName" TEXT,
    "siteContactFamilyName" TEXT,
    "simproJobId" INTEGER,
    "jobNo" TEXT,
    "linkedJobId" INTEGER,
    "stage" TEXT,
    "statusId" INTEGER,
    "statusName" TEXT,
    "statusColor" TEXT,
    "type" TEXT,
    "isVariation" BOOLEAN,
    "isClosed" BOOLEAN,
    "validityDays" INTEGER,
    "technicianId" INTEGER,
    "technicianName" TEXT,
    "projectManagerId" INTEGER,
    "projectManagerName" TEXT,
    "salespersonId" INTEGER,
    "salespersonName" TEXT,
    "archiveReasonId" INTEGER,
    "archiveReasonName" TEXT,
    "convertedToJob" BOOLEAN,
    "convertedFromLeadId" INTEGER,
    "convertedFromLeadName" TEXT,
    "totalExTax" DECIMAL(10,2),
    "totalTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "forecastMonth" INTEGER,
    "forecastYear" INTEGER,
    "forecastPercent" DECIMAL(10,2),
    "laborEstimate" DECIMAL(10,2),
    "laborHoursEstimate" DECIMAL(10,2),
    "materialsCostEstimate" DECIMAL(10,2),
    "dueDate" TIMESTAMP(3),
    "dateIssued" TIMESTAMP(3),
    "dateSent" TIMESTAMP(3),
    "dateAccepted" TIMESTAMP(3),
    "dateApproved" TIMESTAMP(3),
    "dateExpires" TIMESTAMP(3),
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_job_cost_centres" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproJobCostCentreId" INTEGER,
    "simproJobId" INTEGER,
    "simproSiteId" INTEGER,
    "siteName" TEXT,
    "costCentreId" INTEGER,
    "costCentreName" TEXT,
    "name" TEXT,
    "header" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "orderNo" TEXT,
    "stage" TEXT,
    "type" TEXT,
    "displayOrder" INTEGER,
    "percentComplete" INTEGER,
    "variation" BOOLEAN,
    "variationApprovalDate" TIMESTAMP(3),
    "totalExTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "totalTax" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "invoicedValue" DECIMAL(10,2),
    "invoicePercentage" DECIMAL(10,2),
    "claimedExTaxToDate" DECIMAL(10,2),
    "claimedIncTaxToDate" DECIMAL(10,2),
    "claimedPercentToDate" DECIMAL(10,2),
    "laborActual" DECIMAL(10,2),
    "laborEstimate" DECIMAL(10,2),
    "laborHoursActual" DECIMAL(10,2),
    "laborHoursEstimate" DECIMAL(10,2),
    "materialsCostActual" DECIMAL(10,2),
    "materialsCostEstimate" DECIMAL(10,2),
    "grossProfitActual" DECIMAL(10,2),
    "grossMarginActual" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_job_cost_centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_contractor_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproContractorJobId" INTEGER,
    "simproJobId" INTEGER,
    "contractorId" INTEGER,
    "contractorName" TEXT,
    "contractorContact" TEXT,
    "contractorSupplyMaterials" BOOLEAN,
    "projectType" TEXT,
    "status" TEXT,
    "description" TEXT,
    "currency" TEXT,
    "exchangeRate" DECIMAL(10,6),
    "contractedAmount" DECIMAL(10,2),
    "totalExTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "labor" DECIMAL(10,2),
    "materials" DECIMAL(10,2),
    "retentionAmount" DECIMAL(10,2),
    "retentionPerClaim" DECIMAL(10,2),
    "retentionPeriodMonths" INTEGER,
    "reverseChargeTax" DECIMAL(10,2),
    "taxCodeId" INTEGER,
    "taxCodeCode" TEXT,
    "taxCodeRate" DECIMAL(10,2),
    "taxCodeType" TEXT,
    "dateIssued" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_contractor_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproInvoiceId" INTEGER,
    "invoiceNo" TEXT,
    "invoiceType" TEXT,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "simproJobId" INTEGER,
    "recurringInvoiceId" INTEGER,
    "customerContractId" INTEGER,
    "claimNo" TEXT,
    "stage" TEXT,
    "description" TEXT,
    "totalExTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "totalDiscount" DECIMAL(10,2),
    "totalRetentionExTax" DECIMAL(10,2),
    "totalRetentionIncTax" DECIMAL(10,2),
    "isCredit" BOOLEAN,
    "isRecurring" BOOLEAN,
    "isVoided" BOOLEAN,
    "perItem" BOOLEAN,
    "dateIssued" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "dateCreated" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_invoice_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproJobId" INTEGER,
    "simproInvoiceId" INTEGER,
    "invoiceNo" TEXT,
    "stage" TEXT,
    "status" TEXT,
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_invoice_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_response_times" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproResponseTimeId" INTEGER,
    "name" TEXT,
    "archived" BOOLEAN,
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_response_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproScheduleId" INTEGER,
    "type" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "totalHours" DECIMAL(10,2),
    "staffId" INTEGER,
    "staffName" TEXT,
    "staffType" TEXT,
    "simproJobId" INTEGER,
    "simproJobCostCentreId" INTEGER,
    "simproSectionId" INTEGER,
    "scheduleDate" TIMESTAMP(3),
    "blockStartTime" TIMESTAMP(3),
    "blockEndTime" TIMESTAMP(3),
    "blockHours" DECIMAL(10,2),
    "scheduleRateId" INTEGER,
    "scheduleRateName" TEXT,
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_contractor_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproContractorInvoiceId" INTEGER,
    "invoiceNo" TEXT,
    "contractorId" INTEGER,
    "contractorName" TEXT,
    "contractorJobIds" INTEGER,
    "totalExTax" DECIMAL(10,2),
    "totalIncTax" DECIMAL(10,2),
    "currency" TEXT,
    "exchangeRate" DECIMAL(10,6),
    "isPaid" BOOLEAN,
    "cisDeduction" DECIMAL(10,2),
    "rctDeduction" DECIMAL(10,2),
    "dateIssued" TIMESTAMP(3),
    "datePaid" TIMESTAMP(3),
    "dateApproved" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_contractor_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_asset_test_histories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproAssetId" INTEGER,
    "assetType" TEXT,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "simproSiteId" INTEGER,
    "siteName" TEXT,
    "simproJobId" INTEGER,
    "jobReference" TEXT,
    "jobDateIssued" TIMESTAMP(3),
    "jobDueDate" TIMESTAMP(3),
    "quoteId" INTEGER,
    "quoteDateIssued" TIMESTAMP(3),
    "quoteDueDate" TIMESTAMP(3),
    "employeeId" INTEGER,
    "employeeName" TEXT,
    "contractorId" INTEGER,
    "contractorName" TEXT,
    "serviceLevelId" INTEGER,
    "serviceLevelName" TEXT,
    "testStatus" TEXT,
    "passOrFail" TEXT,
    "testResult" TEXT,
    "testNotes" TEXT,
    "testDate" TIMESTAMP(3),
    "nextTestDate" TIMESTAMP(3),
    "dateModified" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_asset_test_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_job_response_times" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "simproJobId" INTEGER,
    "jobReference" TEXT,
    "jobName" TEXT,
    "simproCustomerId" INTEGER,
    "customerName" TEXT,
    "simproSiteId" INTEGER,
    "siteName" TEXT,
    "responseTimeName" TEXT,
    "createdAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "jobStartTime" TIMESTAMP(3),
    "achieved" BOOLEAN,
    "syncedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_job_response_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_email_key" ON "Company"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");

-- CreateIndex
CREATE INDEX "UserCompany_roleId_idx" ON "UserCompany"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_activeCompanyId_idx" ON "Session"("activeCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_userId_key" ON "PasswordReset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_tokenHash_key" ON "PasswordReset"("tokenHash");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_companyId_provider_key" ON "Integration"("companyId", "provider");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_dateModified_idx" ON "Customer"("dateModified");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_companyId_key" ON "Customer"("id", "companyId");

-- CreateIndex
CREATE INDEX "Site_companyId_idx" ON "Site"("companyId");

-- CreateIndex
CREATE INDEX "Site_customerId_idx" ON "Site"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Site_id_companyId_key" ON "Site"("id", "companyId");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_statusName_idx" ON "Job"("statusName");

-- CreateIndex
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");

-- CreateIndex
CREATE INDEX "Job_dateModified_idx" ON "Job"("dateModified");

-- CreateIndex
CREATE UNIQUE INDEX "Job_id_companyId_key" ON "Job"("id", "companyId");

-- CreateIndex
CREATE INDEX "Quote_companyId_idx" ON "Quote"("companyId");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_statusName_idx" ON "Quote"("statusName");

-- CreateIndex
CREATE INDEX "Quote_dateModified_idx" ON "Quote"("dateModified");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_id_companyId_key" ON "Quote"("id", "companyId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_id_companyId_key" ON "Employee"("id", "companyId");

-- CreateIndex
CREATE INDEX "JobCostCenter_jobId_idx" ON "JobCostCenter"("jobId");

-- CreateIndex
CREATE INDEX "JobCostCenter_companyId_idx" ON "JobCostCenter"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCostCenter_id_jobId_companyId_key" ON "JobCostCenter"("id", "jobId", "companyId");

-- CreateIndex
CREATE INDEX "CustomerAsset_companyId_idx" ON "CustomerAsset"("companyId");

-- CreateIndex
CREATE INDEX "CustomerAsset_customerId_idx" ON "CustomerAsset"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAsset_nextServiceDate_idx" ON "CustomerAsset"("nextServiceDate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAsset_id_companyId_key" ON "CustomerAsset"("id", "companyId");

-- CreateIndex
CREATE INDEX "AssetTestHistory_assetId_idx" ON "AssetTestHistory"("assetId");

-- CreateIndex
CREATE INDEX "AssetTestHistory_companyId_idx" ON "AssetTestHistory"("companyId");

-- CreateIndex
CREATE INDEX "AssetTestHistory_testDate_idx" ON "AssetTestHistory"("testDate");

-- CreateIndex
CREATE INDEX "ContractorJob_jobId_idx" ON "ContractorJob"("jobId");

-- CreateIndex
CREATE INDEX "ContractorJob_companyId_idx" ON "ContractorJob"("companyId");

-- CreateIndex
CREATE INDEX "ContractorJob_status_idx" ON "ContractorJob"("status");

-- CreateIndex
CREATE INDEX "idx_service_levels_asset" ON "simpro_report_asset_service_levels"("asset_id");

-- CreateIndex
CREATE INDEX "idx_service_levels_company" ON "simpro_report_asset_service_levels"("company_id");

-- CreateIndex
CREATE INDEX "idx_service_levels_next_due" ON "simpro_report_asset_service_levels"("next_service_date");

-- CreateIndex
CREATE INDEX "idx_service_levels_next_service" ON "simpro_report_asset_service_levels"("next_service_date");

-- CreateIndex
CREATE INDEX "idx_asset_tests_asset" ON "simpro_report_asset_tests"("asset_id");

-- CreateIndex
CREATE INDEX "idx_asset_tests_company" ON "simpro_report_asset_tests"("company_id");

-- CreateIndex
CREATE INDEX "idx_asset_tests_test_date" ON "simpro_report_asset_tests"("test_date");

-- CreateIndex
CREATE INDEX "idx_assets_asset" ON "simpro_report_assets"("asset_id");

-- CreateIndex
CREATE INDEX "idx_assets_company" ON "simpro_report_assets"("company_id");

-- CreateIndex
CREATE INDEX "idx_assets_site" ON "simpro_report_assets"("site_id");

-- CreateIndex
CREATE INDEX "idx_job_response_company" ON "simpro_report_job_response_times"("company_id");

-- CreateIndex
CREATE INDEX "idx_job_response_due" ON "simpro_report_job_response_times"("due_at");

-- CreateIndex
CREATE INDEX "idx_job_response_job" ON "simpro_report_job_response_times"("job_id");

-- CreateIndex
CREATE INDEX "idx_invoice_jobs_company" ON "simpro_report_invoice_jobs"("company_id");

-- CreateIndex
CREATE INDEX "idx_invoice_jobs_invoice" ON "simpro_report_invoice_jobs"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_invoice_jobs_job" ON "simpro_report_invoice_jobs"("job_id");

-- CreateIndex
CREATE INDEX "idx_invoices_company" ON "simpro_report_invoices"("company_id");

-- CreateIndex
CREATE INDEX "idx_invoices_date" ON "simpro_report_invoices"("date_issued");

-- CreateIndex
CREATE INDEX "idx_invoices_invoice" ON "simpro_report_invoices"("invoice_id");

-- CreateIndex
CREATE INDEX "idx_response_times_company" ON "simpro_report_response_times"("company_id");

-- CreateIndex
CREATE INDEX "idx_response_times_removed" ON "simpro_report_response_times"("removed");

-- CreateIndex
CREATE UNIQUE INDEX "simpro_report_response_times_company_id_response_time_id_key" ON "simpro_report_response_times"("company_id", "response_time_id");

-- CreateIndex
CREATE INDEX "idx_schedules_company" ON "simpro_report_schedules"("company_id");

-- CreateIndex
CREATE INDEX "idx_schedules_date" ON "simpro_report_schedules"("schedule_date");

-- CreateIndex
CREATE INDEX "idx_schedules_job" ON "simpro_report_schedules"("job_id");

-- CreateIndex
CREATE INDEX "Sync_companyId_startedAt_idx" ON "Sync"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "SyncEntity_syncId_idx" ON "SyncEntity"("syncId");

-- CreateIndex
CREATE INDEX "SyncEntityConfig_companyId_idx" ON "SyncEntityConfig"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncEntityConfig_companyId_provider_entity_key" ON "SyncEntityConfig"("companyId", "provider", "entity");

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompany" ADD CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_activeCompanyId_fkey" FOREIGN KEY ("activeCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAsset" ADD CONSTRAINT "CustomerAsset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAsset" ADD CONSTRAINT "CustomerAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAsset" ADD CONSTRAINT "CustomerAsset_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTestHistory" ADD CONSTRAINT "AssetTestHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "CustomerAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sync" ADD CONSTRAINT "Sync_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncEntity" ADD CONSTRAINT "SyncEntity_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "Sync"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncEntityConfig" ADD CONSTRAINT "SyncEntityConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
