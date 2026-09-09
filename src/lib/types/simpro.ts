// Simpro API Response Types
// These types represent the raw API responses from Simpro

// ============================================
// LIST RESPONSES (Paginated)
// ============================================

export type SimproListResponse<T> = T[] | { data: T[] } | { items: T[] };

export interface SimproListItem {
  ID: number;
  DateModified?: string;
}

// ============================================
// CUSTOMERS
// ============================================

export interface SimproCustomer {
  ID: number;

  // -------------------------
  // CORE COMPANY INFO
  // -------------------------
  CompanyName?: string | null;
  CustomerType?: string | null;
  Email?: string | null;
  Phone?: string | null;
  AltPhone?: string | null;
  DoNotCall?: boolean;

  Website?: string | null;
  Fax?: string | null;
  EIN?: string | null;
  CompanyNumber?: string | null;

  // -------------------------
  // ADDRESS
  // -------------------------
  Address?: {
    Address?: string | null;
    City?: string | null;
    State?: string | null;
    PostalCode?: string | null;
    Country?: string | null;
  } | null;

  BillingAddress?: {
    Address?: string | null;
    City?: string | null;
    State?: string | null;
    PostalCode?: string | null;
    Country?: string | null;
  } | null;

  // -------------------------
  // TAGS / TECHS
  // -------------------------
  Tags?: string[] | null;

  PreferredTechs?: Array<{
    ID: number;
    Name: string;
    Type: string;
    TypeId: number;
  }> | null;

  // -------------------------
  // FINANCIALS
  // -------------------------
  AmountOwing?: number | null;

  Rates?: {
    PartTaxCode?: {
      ID: number;
      Code: string;
      Type: string;
      Rate: number;
      ReverseTaxEnabled: boolean;
    } | null;

    LabourTaxCode?: {
      ID: number;
      Code: string;
      Type: string;
      Rate: number;
      ReverseTaxEnabled: boolean;
    } | null;

    DiscountFee?: number | null;
    AlwaysDeductCIS?: boolean;

    ServiceFee?: {
      ID: number;
      Name: string;
    } | null;

    Material?: {
      PricingTier?: {
        ID: number;
        Name: string;
        DefaultMarkup: number;
      } | null;
      Markup?: number | null;
    } | null;
  } | null;

  // -------------------------
  // PROFILE
  // -------------------------
  Profile?: {
    Notes?: string | null;

    CustomerProfile?: {
      ID: number;
      Name: string;
    } | null;

    CustomerGroup?: {
      ID: number;
      Name: string;
    } | null;

    AccountManager?: {
      ID: number;
      Name: string;
    } | null;

    Currency?: {
      ID: string;
      Name: string;
      Visible?: boolean;
    } | null;

    ServiceJobCostCenter?: {
      ID: number;
      Name: string;
    } | null;
  } | null;

  // -------------------------
  // BANKING
  // -------------------------
  Banking?: {
    AccountName?: string | null;
    RoutingNo?: string | null;
    AccountNo?: string | null;

    PaymentMethod?: {
      ID: number;
      Name: string;
    } | null;

    PaymentTermID?: number | null;
    PaymentTerms?: {
      Days: number;
      Type: string;
    } | null;

    CreditLimit?: number | null;
    OnStop?: boolean;
    Retention?: string | null;
    VendorOrderNoRequired?: boolean;
  } | null;

  // -------------------------
  // RELATION HINTS (IDS ONLY)
  // -------------------------
  Sites?: Array<{
    ID: number;
    Name: string;
  }> | null;

  Contracts?: Array<{
    ID: number;
    Name: string;
    StartDate?: string;
    EndDate?: string;
    ContractNo?: string;
    Expired?: boolean;
  }> | null;

  Contacts?: Array<{
    ID: number;
    GivenName?: string;
    FamilyName?: string;
  }> | null;

  // -------------------------
  // META
  // -------------------------
  Archived?: boolean;
  DateCreated?: string | null;
  DateModified?: string | null;
}

// ============================================
// SITES
// ============================================

export interface SimproSite extends SimproListItem {
  ID: number;
  Name?: string;
  Address?: string;
  CustomerId?: number;
  Archived?: boolean;
}

// ============================================
// JOBS
// ============================================

export interface SimproJobDetail {
  ID: number;
  Type?: string | null;

  CustomFields?: SimproCustomField[] | null;

  Customer?: {
    ID: number;
    CompanyName?: string | null;
    GivenName?: string | null;
    FamilyName?: string | null;
  } | null;

  CustomerContract?: {
    ID: number;
    Name?: string | null;
    StartDate?: string | null;
    EndDate?: string | null;
    ContractNo?: string | null;
  } | null;

  CustomerContact?: {
    ID: number;
    GivenName?: string | null;
    FamilyName?: string | null;
  } | null;

  Site?: {
    ID: number;
    Name?: string | null;
  } | null;

  SiteContact?: {
    ID: number;
    GivenName?: string | null;
    FamilyName?: string | null;
  } | null;

  OrderNo?: string | null;
  RequestNo?: string | null;
  Name?: string | null;
  Description?: string | null;
  Notes?: string | null;

  DateIssued?: string | null;
  DueDate?: string | null;
  DueTime?: string | null;
  CompletedDate?: string | null;
  DateModified?: string | null;

  Tags?: Array<{ ID: number; Name: string }> | null;

  Salesperson?: {
    ID: number;
    Name: string;
    Type: string;
    TypeId: number;
  } | null;

  ProjectManager?: {
    ID: number;
    Name: string;
    Type: string;
    TypeId: number;
  } | null;

  Technicians?: Array<{
    ID: number;
    Name: string;
    Type: string;
    TypeId: number;
  }> | null;

  Technician?: {
    ID: number;
    Name: string;
    Type: string;
    TypeId: number;
  } | null;

  Stage?: string | null;

  Status?: {
    ID: number;
    Name: string;
    Color?: string | null;
  } | null;

  ResponseTime?: {
    ID: number;
    Name: string;
    Days?: number | null;
    Hours?: number | null;
    Minutes?: number | null;
  } | null;

  IsVariation?: boolean | null;
  AutoAdjustStatus?: boolean | null;
  IsRetentionEnabled?: boolean | null;

  ConvertedFrom?: {
    ID: number;
    Type: string;
    Date?: string | null;
  } | null;

  Total?: {
    ExTax?: number | null;
    Tax?: number | null;
    IncTax?: number | null;
  } | null;

  Totals?: {
    MaterialsCost?: {
      Actual?: number | null;
      Committed?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    ResourcesCost?: {
      Total?: {
        Actual?: number | null;
        Committed?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
      Labor?: {
        Actual?: number | null;
        Committed?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
      LaborHours?: {
        Actual?: number | null;
        Committed?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
      PlantAndEquipment?: {
        Actual?: number | null;
        Committed?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
      PlantAndEquipmentHours?: {
        Actual?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
      Commission?: {
        Actual?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
      Overhead?: {
        Actual?: number | null;
        Committed?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
    };

    MaterialsMarkup?: {
      Actual?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    ResourcesMarkup?: {
      Total?: {
        Actual?: number | null;
        Estimate?: number | null;
        Revised?: number | null;
      };
    };

    Adjusted?: {
      Actual?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    MembershipDiscount?: number | null;
    Discount?: number | null;

    GrossProfitLoss?: {
      Actual?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    GrossMargin?: {
      Actual?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    NettProfitLoss?: {
      Actual?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    NettMargin?: {
      Actual?: number | null;
      Estimate?: number | null;
      Revised?: number | null;
    };

    InvoicedValue?: number | null;
    InvoicePercentage?: number | null;
  } | null;

  STC?: {
    STCsEligible?: boolean | null;
    VEECsEligible?: boolean | null;
    STCValue?: number | null;
    VEECValue?: number | null;
  } | null;
}

export interface SimproCustomField {
  CustomField: {
    ID: number;
    Name: string;
  };
  Value: string | null;
}

// ============================================
// QUOTES
// ============================================

export interface SimproQuoteDetail {
  ID: number;
  QuoteNo?: string;
  Name?: string;
  Description?: string;
  Status?: { Name?: string };
  Total?: Decimal;
  DateCreated?: string;
  ValidUntil?: string;
  DateModified?: string;
  Customer?: { ID?: number; Name?: string };
  Site?: { ID?: number; Name?: string };
  Archived?: boolean;
}

// ============================================
// EMPLOYEES
// ============================================

export interface SimproEmployee extends SimproListItem {
  ID: number;
  FullName?: string;
  Email?: string;
  Phone?: string;
  Position?: string;
  Archived?: boolean;
}

// ============================================
// ASSETS
// ============================================

export interface SimproAsset extends SimproListItem {
  ID: number;
  Name?: string;
  Type?: string;
  SerialNumber?: string;
  Manufacturer?: string;
  Model?: string;
  SiteId?: number;
  Archived?: boolean;
}

// ============================================
// ASSET TESTS
// ============================================

export interface SimproAssetTest extends SimproListItem {
  ID: number;
  AssetId?: number;
  TestType?: string;
  Result?: string;
  Reading?: any;
  TestedAt?: string;
  NextTestDue?: string;
  Archived?: boolean;
}

// ============================================
// CONTRACTORS
// ============================================

export interface SimproContractor extends SimproListItem {
  ID: number;
  FullName?: string;
  CompanyName?: string;
  Email?: string;
  Phone?: string;
  Archived?: boolean;
}

// ============================================
// LABOUR ENTRIES
// ============================================

export interface SimproLabourEntry extends SimproListItem {
  ID: number;
  JobId?: number;
  EmployeeId?: number;
  Hours?: number;
  Cost?: number;
  Date?: string;
  Description?: string;
  Archived?: boolean;
}

export type Decimal = string | number;
